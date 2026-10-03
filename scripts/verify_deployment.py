"""
Nexus production smoke test.

Checks the live Vercel frontend, the Vercel -> Azure API proxy, backend
health, Azure integrations, the AI provider chain, and an end-to-end
product-analytics roundtrip (track -> Neon -> summary).

Usage:
    python scripts/verify_deployment.py
    FRONTEND_URL=https://my-app.vercel.app BACKEND_URL=https://api... python scripts/verify_deployment.py
Exit code is non-zero if any required check fails.
"""
import os
import sys
import time
import uuid

import httpx

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://frontend-brown-seven-19.vercel.app").rstrip("/")
BACKEND_URL = os.environ.get(
    "BACKEND_URL", "https://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net"
).rstrip("/")

results = []


def check(name, fn, required=True):
    t0 = time.perf_counter()
    try:
        detail = fn()
        ok = True
    except AssertionError as e:
        ok, detail = False, str(e) or "assertion failed"
    except Exception as e:
        ok, detail = False, f"{type(e).__name__}: {str(e)[:120]}"
    ms = int((time.perf_counter() - t0) * 1000)
    tag = "PASS" if ok else ("FAIL" if required else "WARN")
    print(f"  [{tag}] {name} ({ms} ms){' - ' + str(detail) if detail else ''}")
    results.append(ok or not required)


def main() -> int:
    c = httpx.Client(timeout=30.0, follow_redirects=True, headers={"User-Agent": "nexus-smoke/2.0"})
    print(f"Frontend: {FRONTEND_URL}\nBackend:  {BACKEND_URL}\n")

    print("Backend (Azure App Service)")

    def backend_health():
        r = c.get(f"{BACKEND_URL}/api/v1/health")
        assert r.status_code == 200, f"status {r.status_code}"
        body = r.json()
        assert body.get("databaseConnected") is True, f"database: {body.get('database')}"
        return f"db={body.get('database')}"

    def azure_services():
        r = c.get(f"{BACKEND_URL}/health/azure")
        assert r.status_code == 200, f"status {r.status_code}"
        s = r.json()["services"]
        return ", ".join(f"{k}={v.get('status')}" for k, v in s.items() if k in
                         ("applicationInsights", "blobStorage", "keyVault", "aiProviders"))

    def ai_status():
        r = c.get(f"{BACKEND_URL}/api/v1/ai/status")
        assert r.status_code == 200, f"status {r.status_code} (new AI router not deployed?)"
        return "chain=" + " > ".join(r.json()["chain"])

    check("API health + Neon connection", backend_health)
    check("Azure integrations", azure_services)
    check("AI provider chain", ai_status)

    print("\nFrontend (Vercel)")

    def landing():
        r = c.get(f"{FRONTEND_URL}/")
        assert r.status_code == 200, f"status {r.status_code}"
        assert "Nexus" in r.text, "brand not found in HTML"

    def login():
        r = c.get(f"{FRONTEND_URL}/login")
        assert r.status_code == 200, f"status {r.status_code}"

    def proxy():
        r = c.get(f"{FRONTEND_URL}/api/v1/health")
        assert r.status_code == 200, f"status {r.status_code}"
        assert "databaseConnected" in r.text, "proxy did not reach backend"

    check("Landing page", landing)
    check("Sign-in page", login)
    check("Vercel -> Azure API proxy", proxy)

    print("\nProduct analytics pipeline")
    session = f"smoke-{uuid.uuid4().hex[:8]}"

    def track():
        r = c.post(f"{FRONTEND_URL}/api/v1/events/track", json={"events": [
            {"name": "page_view", "path": "/__smoke__", "sessionId": session, "device": "desktop"},
        ]})
        assert r.status_code == 202, f"status {r.status_code}: {r.text[:120]}"
        return f"accepted={r.json().get('accepted')}"

    def summary():
        r = c.get(f"{BACKEND_URL}/api/v1/events/summary?range=24h")
        assert r.status_code == 200, f"status {r.status_code}"
        return f"events_24h={r.json()['totals']['events']}"

    check("Track event via proxy (-> Neon, App Insights, Blob)", track)
    check("Aggregate summary from Neon", summary)

    passed = all(results)
    print("\nRESULT:", "ALL CHECKS PASSED" if passed else "FAILURES DETECTED")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
