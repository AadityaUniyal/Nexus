"""
Adversarial Verification Suite for NEXUS Milestone 1: De-Azure & Core API Endpoints
Tests:
1. Zero Azure outbound network isolation (socket/DNS interception).
2. Background thread inspection (no Azure workers/exporters).
3. Core endpoints contract compliance (/api/v1/health, /api/v1/overview/stats,
   /api/v1/operations/summary, /api/v1/location/locations, /health/azure).
4. Missing workspace headers and fallback robustness.
5. Adversarial query parameters (SQLi, XSS, buffers, type mismatch).
6. HTTP method tampering and unexpected payloads.
7. Concurrency burst stress test.
"""

import asyncio
import os
import sys
import time
import socket
import threading
from typing import List, Dict, Any, Tuple

# Ensure backend is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Set test environment
os.environ["APP_ENV"] = "test"
os.environ["TESTING"] = "1"

import httpx
from app.main import app

# -----------------------------------------------------------------------------
# 1. SOCKET & DNS INTERCEPTOR FOR ZERO-AZURE VERIFICATION
# -----------------------------------------------------------------------------
PROHIBITED_AZURE_DOMAINS = [
    "azurewebsites.net",
    "windows.net",
    "servicebus.windows.net",
    "applicationinsights.azure.com",
    "vault.azure.net",
    "blob.core.windows.net",
    "azure.com",
    "trafficmanager.net",
]

intercepted_calls: List[str] = []
prohibited_azure_calls: List[str] = []

orig_getaddrinfo = socket.getaddrinfo
orig_connect = socket.socket.connect

def hooked_getaddrinfo(host, port, *args, **kwargs):
    host_str = str(host).lower()
    intercepted_calls.append(host_str)
    for prohibited in PROHIBITED_AZURE_DOMAINS:
        if prohibited in host_str:
            prohibited_azure_calls.append(host_str)
            raise ConnectionRefusedError(f"[ADVERSARIAL BLOCKED] Prohibited Azure connection attempt: {host}")
    return orig_getaddrinfo(host, port, *args, **kwargs)

def hooked_connect(self, address):
    if isinstance(address, tuple) and len(address) >= 1:
        host_str = str(address[0]).lower()
        intercepted_calls.append(host_str)
        for prohibited in PROHIBITED_AZURE_DOMAINS:
            if prohibited in host_str:
                prohibited_azure_calls.append(host_str)
                raise ConnectionRefusedError(f"[ADVERSARIAL BLOCKED] Prohibited Azure connection attempt: {host_str}")
    return orig_connect(self, address)

socket.getaddrinfo = hooked_getaddrinfo
socket.socket.connect = hooked_connect

# -----------------------------------------------------------------------------
# TEST RUNNER & ASSERTION FRAMEWORK
# -----------------------------------------------------------------------------
class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.findings: List[Dict[str, Any]] = []

    def assert_true(self, condition: bool, description: str, details: str = ""):
        if condition:
            self.passed += 1
            print(f"  [PASS] {description}")
        else:
            self.failed += 1
            finding = {"test": description, "details": details}
            self.findings.append(finding)
            print(f"  [FAIL] {description} -> {details}")

    def summary(self) -> str:
        return f"Passed: {self.passed}, Failed: {self.failed}"


async def run_adversarial_suite():
    results = TestResults()
    print("\n" + "=" * 70)
    print("NEXUS ADVERSARIAL VERIFICATION SUITE — MILESTONE 1")
    print("=" * 70)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # ---------------------------------------------------------------------
        # SUITE 1: BACKGROUND THREAD INSPECTION
        # ---------------------------------------------------------------------
        print("\n--- [Suite 1] Background Thread & Process Inspection ---")
        threads = [t.name for t in threading.enumerate()]
        print(f"Active threads: {threads}")
        has_azure_threads = any("azure" in t.lower() or "telemetry_worker" in t.lower() for t in threads)
        results.assert_true(
            not has_azure_threads,
            "No background threads with 'azure' or 'telemetry_worker' active",
            f"Found threads: {threads}"
        )

        # ---------------------------------------------------------------------
        # SUITE 2: BASELINE CONTRACT CONFORMANCE (HAPPY PATH)
        # ---------------------------------------------------------------------
        print("\n--- [Suite 2] Baseline Contract Conformance ---")

        # 2.1 /api/v1/health
        resp = await client.get("/api/v1/health")
        results.assert_true(resp.status_code == 200, "GET /api/v1/health returns HTTP 200", f"Status: {resp.status_code}")
        h_data = resp.json()
        results.assert_true("status" in h_data and "version" in h_data, "Health response contains status and version", str(h_data))
        azure_iot_status = h_data.get("azureIot") or h_data.get("azure_iot")
        results.assert_true(
            azure_iot_status == "CONNECTED (Unified IoT Gateway Active)",
            "Health azureIot field reports Unified IoT Gateway Active",
            str(azure_iot_status)
        )
        results.assert_true(
            resp.headers.get("x-content-type-options") == "nosniff",
            "Security header X-Content-Type-Options: nosniff present",
            str(resp.headers)
        )
        results.assert_true(
            resp.headers.get("x-frame-options") == "DENY",
            "Security header X-Frame-Options: DENY present",
            str(resp.headers)
        )
        results.assert_true("x-request-id" in resp.headers, "Security header X-Request-ID present", str(resp.headers))

        # 2.2 /api/v1/overview/stats
        resp = await client.get("/api/v1/overview/stats")
        results.assert_true(resp.status_code == 200, "GET /api/v1/overview/stats returns HTTP 200", f"Status: {resp.status_code}")
        s_data = resp.json()
        expected_keys = ["total_orders", "active_vehicles", "warehouse_utilization", "on_time_delivery_rate"]
        all_keys_present = all(k in s_data for k in expected_keys)
        results.assert_true(all_keys_present, "Overview stats contains all required snake_case keys", str(s_data))
        camel_keys_present = all(k in s_data for k in ["totalOrders", "activeVehicles", "warehouseUtilization", "onTimeDeliveryRate"])
        results.assert_true(camel_keys_present, "Overview stats contains camelCase aliases for frontend", str(s_data))
        results.assert_true(isinstance(s_data.get("total_orders"), int), "total_orders is integer", str(type(s_data.get("total_orders"))))
        results.assert_true(0 <= s_data.get("on_time_delivery_rate", 0) <= 100, "on_time_delivery_rate is percentage (0-100)", str(s_data.get("on_time_delivery_rate")))

        # 2.3 /api/v1/operations/summary
        resp = await client.get("/api/v1/operations/summary")
        results.assert_true(resp.status_code == 200, "GET /api/v1/operations/summary returns HTTP 200", f"Status: {resp.status_code}")
        op_data = resp.json()
        op_keys = ["warehouses", "vehicles", "routes", "orders", "total_warehouses", "total_vehicles", "total_routes", "total_orders"]
        results.assert_true(all(k in op_data for k in op_keys), "Operations summary contains all top-level keys", str(op_data.keys()))
        results.assert_true("items" in op_data.get("warehouses", {}), "Warehouses summary has items list", str(op_data.get("warehouses")))
        results.assert_true("items" in op_data.get("vehicles", {}), "Vehicles summary has items list", str(op_data.get("vehicles")))

        # 2.4 /api/v1/location/locations
        resp = await client.get("/api/v1/location/locations")
        results.assert_true(resp.status_code == 200, "GET /api/v1/location/locations returns HTTP 200", f"Status: {resp.status_code}")
        loc_data = resp.json()
        results.assert_true(isinstance(loc_data, list) and len(loc_data) > 0, "Location endpoint returns non-empty list", f"Type: {type(loc_data)}, Len: {len(loc_data) if isinstance(loc_data, list) else 0}")
        if isinstance(loc_data, list) and len(loc_data) > 0:
            first_loc = loc_data[0]
            has_coords = "latitude" in first_loc and "longitude" in first_loc
            results.assert_true(has_coords, "Location item has latitude and longitude", str(first_loc))
            if has_coords:
                lat, lng = first_loc["latitude"], first_loc["longitude"]
                results.assert_true(-90 <= lat <= 90 and -180 <= lng <= 180, f"Valid GPS coordinates ({lat}, {lng})", f"{lat}, {lng}")

        # 2.5 /health/azure
        resp = await client.get("/health/azure")
        results.assert_true(resp.status_code == 200, "GET /health/azure returns HTTP 200", f"Status: {resp.status_code}")
        az_data = resp.json()
        results.assert_true(az_data.get("status") == "ok" and az_data.get("platform") == "nexus-unified", "Reports status: ok, platform: nexus-unified", str(az_data))
        services = az_data.get("services", {})
        results.assert_true(
            services.get("applicationInsights", {}).get("status") == "LOCAL_FALLBACK" and
            services.get("blobStorage", {}).get("status") == "LOCAL_FALLBACK" and
            services.get("keyVault", {}).get("status") == "ENV_FALLBACK",
            "Azure health correctly declares LOCAL_FALLBACK and ENV_FALLBACK",
            str(services)
        )

        # ---------------------------------------------------------------------
        # SUITE 3: MISSING & MALFORMED WORKSPACE HEADERS
        # ---------------------------------------------------------------------
        print("\n--- [Suite 3] Missing & Malformed Workspace Headers ---")

        endpoints_to_test = [
            "/api/v1/health",
            "/api/v1/overview/stats",
            "/api/v1/operations/summary",
            "/api/v1/location/locations",
            "/health/azure",
        ]

        # 3.1 Completely omitted workspace header
        for ep in endpoints_to_test:
            resp = await client.get(ep, headers={})
            results.assert_true(resp.status_code == 200, f"{ep} with NO X-Workspace-ID header succeeds (200 OK)", f"Status: {resp.status_code}")

        # 3.2 Empty workspace header
        for ep in endpoints_to_test:
            resp = await client.get(ep, headers={"X-Workspace-ID": ""})
            results.assert_true(resp.status_code == 200, f"{ep} with empty X-Workspace-ID header succeeds (200 OK)", f"Status: {resp.status_code}")

        # 3.3 Whitespace-only workspace header
        for ep in endpoints_to_test:
            resp = await client.get(ep, headers={"X-Workspace-ID": "   "})
            results.assert_true(resp.status_code == 200, f"{ep} with whitespace X-Workspace-ID succeeds (200 OK)", f"Status: {resp.status_code}")

        # 3.4 Custom non-existent workspace (multi-tenant tenant isolation check)
        resp_hdr = await client.get("/api/v1/overview/stats", headers={"X-Workspace-ID": "ws-nonexistent-9999"})
        results.assert_true(resp_hdr.status_code == 200, "overview/stats with unauthenticated X-Workspace-ID header succeeds (200 OK)", f"Status: {resp_hdr.status_code}")

        # When tenant workspace_id is explicitly passed in query param, verify 0 records returned (strict tenant scoping)
        resp_qp = await client.get("/api/v1/overview/stats?workspace_id=ws-nonexistent-9999")
        results.assert_true(resp_qp.status_code == 200, "overview/stats with custom workspace query param returns 200", f"Status: {resp_qp.status_code}")
        data = resp_qp.json()
        results.assert_true(data["total_orders"] == 0 and data["active_vehicles"] == 0, "Tenant isolation: 0 orders/vehicles for empty workspace", str(data))

        # ---------------------------------------------------------------------
        # SUITE 4: ADVERSARIAL QUERY PARAMETERS (SQLi, XSS, OVERSIZED, TYPES)
        # ---------------------------------------------------------------------
        print("\n--- [Suite 4] Adversarial Query Parameters ---")

        # 4.1 SQL Injection attempts in query parameters
        sqli_payloads = [
            "' OR 1=1 --",
            "'; DROP TABLE vehicles; --",
            "\" UNION SELECT * FROM users --",
            "1' OR '1'='1",
        ]
        for sqli in sqli_payloads:
            resp = await client.get(f"/api/v1/overview/stats?workspace_id={sqli}")
            results.assert_true(
                resp.status_code == 200,
                f"SQLi in workspace_id safely parameterized: '{sqli[:20]}...'",
                f"Status: {resp.status_code}"
            )

            resp_loc = await client.get(f"/api/v1/location/locations?workspace_id={sqli}")
            results.assert_true(
                resp_loc.status_code == 200,
                f"SQLi in locations workspace_id safely parameterized: '{sqli[:20]}...'",
                f"Status: {resp_loc.status_code}"
            )

        # 4.2 XSS attempts in query parameters
        xss_payloads = [
            "<script>alert('xss')</script>",
            "\"><img src=x onerror=alert(1)>",
        ]
        for xss in xss_payloads:
            resp = await client.get(f"/api/v1/overview/stats?workspace_id={xss}")
            results.assert_true(resp.status_code == 200, f"XSS string safely handled: '{xss[:20]}'", f"Status: {resp.status_code}")
            # Ensure reflection is not raw HTML
            results.assert_true("<script>" not in resp.text, "Response does not reflect unescaped script tag", resp.text)

        # 4.3 Oversized query parameter (buffer / DoS stress)
        oversized_str = "A" * 16384  # 16KB query param
        resp = await client.get(f"/api/v1/overview/stats?workspace_id={oversized_str}")
        results.assert_true(resp.status_code in [200, 414, 422], "Oversized 16KB query param handled without 500 crash", f"Status: {resp.status_code}")

        # 4.4 Type mismatch on boolean parameters: use_azure in /api/v1/location/locations
        # In FastAPI, a boolean query param that receives "notabool" should return 422 Unprocessable Entity
        resp = await client.get("/api/v1/location/locations?use_azure=invalid_bool_string")
        results.assert_true(
            resp.status_code == 422,
            "Invalid boolean string in use_azure yields HTTP 422 Unprocessable Entity",
            f"Status: {resp.status_code}"
        )

        # Valid boolean variants: true, 1, false, 0
        for b_val in ["true", "false", "1", "0", "True", "False"]:
            resp = await client.get(f"/api/v1/location/locations?use_azure={b_val}")
            results.assert_true(resp.status_code == 200, f"Valid bool variant use_azure={b_val} returns 200", f"Status: {resp.status_code}")

        # 4.5 Extraneous / unexpected query parameters
        for ep in endpoints_to_test:
            resp = await client.get(f"{ep}?unexpected_param=evil_value&drop_db=true&__proto__=polluted")
            results.assert_true(resp.status_code == 200, f"{ep} ignores unexpected query params cleanly", f"Status: {resp.status_code}")

        # ---------------------------------------------------------------------
        # SUITE 5: METHOD TAMPERING & UNEXPECTED PAYLOADS
        # ---------------------------------------------------------------------
        print("\n--- [Suite 5] Method Tampering & Unexpected Payloads ---")

        # 5.1 POST to GET-only endpoints -> Expect 405 Method Not Allowed
        for ep in endpoints_to_test:
            resp = await client.post(ep, json={"unexpected": "payload"})
            results.assert_true(resp.status_code == 405, f"POST to {ep} rejected with 405 Method Not Allowed", f"Status: {resp.status_code}")

        # 5.2 DELETE to GET-only endpoints -> Expect 405 Method Not Allowed
        for ep in endpoints_to_test:
            resp = await client.delete(ep)
            results.assert_true(resp.status_code == 405, f"DELETE to {ep} rejected with 405 Method Not Allowed", f"Status: {resp.status_code}")

        # 5.3 GET request carrying an unexpected JSON body
        for ep in endpoints_to_test:
            req = client.build_request("GET", ep, json={"injected": "body", "attack": True})
            resp = await client.send(req)
            results.assert_true(resp.status_code == 200, f"GET {ep} with unexpected JSON body succeeds without 500 error", f"Status: {resp.status_code}")

        # 5.4 Malformed / corrupt Authorization headers
        bad_auth_headers = [
            "Bearer ",
            "Bearer invalid.jwt.token",
            "Basic YWRtaW46cGFzc3dvcmQ=",
            "Token 12345",
            "NONSENSE_SCHEME token",
        ]
        for bad_auth in bad_auth_headers:
            resp = await client.get("/api/v1/overview/stats", headers={"Authorization": bad_auth})
            results.assert_true(resp.status_code == 200, f"Corrupted auth header '{bad_auth[:15]}' falls back gracefully (200 OK)", f"Status: {resp.status_code}")

        # ---------------------------------------------------------------------
        # SUITE 6: CONCURRENCY BURST STRESS TEST
        # ---------------------------------------------------------------------
        print("\n--- [Suite 6] Concurrency Burst Stress Test ---")
        burst_size = 50
        start_burst = time.time()
        tasks = [client.get("/api/v1/overview/stats") for _ in range(burst_size)]
        burst_responses = await asyncio.gather(*tasks)
        burst_time = time.time() - start_burst

        success_count = sum(1 for r in burst_responses if r.status_code == 200)
        avg_latency = (burst_time / burst_size) * 1000
        print(f"Burst completed: {burst_size} requests in {burst_time:.2f}s ({avg_latency:.1f}ms avg)")
        results.assert_true(
            success_count == burst_size,
            f"All {burst_size} concurrent requests returned HTTP 200 OK",
            f"Success: {success_count}/{burst_size}"
        )

        # ---------------------------------------------------------------------
        # SUITE 7: ZERO AZURE OUTBOUND ISOLATION VERIFICATION
        # ---------------------------------------------------------------------
        print("\n--- [Suite 7] Zero Azure Outbound Isolation Verification ---")
        print(f"Total intercepted socket/DNS queries during suite: {len(intercepted_calls)}")
        unique_targets = sorted(list(set(intercepted_calls)))
        print(f"Distinct targets queried: {unique_targets}")
        print(f"Prohibited Azure calls attempted: {prohibited_azure_calls}")

        results.assert_true(
            len(prohibited_azure_calls) == 0,
            "Zero outbound network or DNS requests attempted to Azure endpoints (*.azurewebsites.net, *.windows.net, etc.)",
            f"Violations: {prohibited_azure_calls}"
        )

    # -------------------------------------------------------------------------
    # FINAL REPORT
    # -------------------------------------------------------------------------
    print("\n" + "=" * 70)
    print(f"FINAL SUMMARY: {results.summary()}")
    print("=" * 70)
    if results.failed > 0:
        print("\nFINDINGS / FAILURES:")
        for idx, f in enumerate(results.findings, 1):
            print(f"[{idx}] Test: {f['test']}")
            print(f"    Details: {f['details']}")
        return False
    else:
        print("\nALL ADVERSARIAL TESTS PASSED CONVINCINGLY.")
        return True


if __name__ == "__main__":
    success = asyncio.run(run_adversarial_suite())
    sys.exit(0 if success else 1)
