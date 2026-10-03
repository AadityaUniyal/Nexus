"""
Multi-provider LLM gateway for NEXUS.

Provider chain (first healthy provider wins):
    1. Groq   (free tier, openai/gpt-oss-120b)      -> low latency, primary
    2. Gemini (free tier, gemini-3.5-flash)         -> fallback / long context
    3. Deterministic templates                      -> always available

Every call records provider, latency and outcome so usage is visible in
Application Insights and the admin analytics dashboard.
"""
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("nexus.ai")

try:
    from groq import AsyncGroq
    GROQ_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    GROQ_AVAILABLE = False
    logger.warning("groq library not available; Groq provider disabled")

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


@dataclass
class AIResult:
    text: str
    provider: str
    model: str
    latency_ms: float


@dataclass
class ProviderStats:
    calls: int = 0
    failures: int = 0
    total_latency_ms: float = 0.0
    last_error: Optional[str] = None

    def as_dict(self) -> Dict[str, Any]:
        avg = self.total_latency_ms / self.calls if self.calls else 0.0
        return {
            "calls": self.calls,
            "failures": self.failures,
            "avgLatencyMs": round(avg, 1),
            "lastError": self.last_error,
        }


@dataclass
class _Stats:
    providers: Dict[str, ProviderStats] = field(default_factory=dict)

    def get(self, name: str) -> ProviderStats:
        return self.providers.setdefault(name, ProviderStats())


def _track(name: str, props: Dict[str, Any]) -> None:
    """Forward AI usage to Application Insights; never raises."""
    try:
        from app.integrations.azure_monitor import azure_monitor_client
        azure_monitor_client.track_event(name, {k: str(v) for k, v in props.items()})
    except Exception:
        pass


class AIService:
    """Provider-agnostic LLM facade used by copilot, briefings and insights."""

    def __init__(self) -> None:
        self.groq_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        self.groq_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        self.gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        self.gemini_model = settings.GEMINI_MODEL or "gemini-3.5-flash"
        self.timeout = float(os.getenv("AI_TIMEOUT_SECONDS", "20"))
        self.stats = _Stats()
        self._client: Optional[Any] = None  # Groq client (kept name for b/w compat)

        if GROQ_AVAILABLE and self.groq_key:
            try:
                self._client = AsyncGroq(api_key=self.groq_key, timeout=self.timeout)
                logger.info("Groq provider ready (%s)", self.groq_model)
            except Exception as e:
                logger.error("Failed to initialise Groq client: %s", e)
        if self.gemini_key:
            logger.info("Gemini provider ready (%s)", self.gemini_model)
        if not self.is_enabled:
            logger.info("No LLM keys configured; AI runs in deterministic mode")

    # ------------------------------------------------------------------ status
    @property
    def is_enabled(self) -> bool:
        return bool(self._client or self.gemini_key)

    @property
    def active_providers(self) -> List[str]:
        chain = []
        if self._client:
            chain.append("groq")
        if self.gemini_key:
            chain.append("gemini")
        return chain

    def status(self) -> Dict[str, Any]:
        return {
            "enabled": self.is_enabled,
            "providers": {
                "groq": {"configured": bool(self._client), "model": self.groq_model},
                "gemini": {"configured": bool(self.gemini_key), "model": self.gemini_model},
            },
            "chain": self.active_providers + ["deterministic"],
            "usage": {k: v.as_dict() for k, v in self.stats.providers.items()},
        }

    # --------------------------------------------------------------- providers
    async def _call_groq(self, system: str, user: str, temperature: float, max_tokens: int) -> str:
        resp = await self._client.chat.completions.create(
            model=self.groq_model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if not resp.choices:
            raise RuntimeError("Groq returned no choices")
        return resp.choices[0].message.content or ""

    async def _call_gemini(self, system: str, user: str, temperature: float, max_tokens: int) -> str:
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            # Flash models "think" by default, which eats the output budget; keep it minimal.
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            # Header auth: works for both AIza... and AQ... key formats and keeps keys out of URLs/logs.
            url = GEMINI_ENDPOINT.format(model=self.gemini_model)
            headers = {"x-goog-api-key": self.gemini_key}
            r = await client.post(url, headers=headers, json=payload)
            if r.status_code == 400:
                # Some models (e.g. *-lite) reject thinkingConfig; retry without it.
                payload["generationConfig"].pop("thinkingConfig", None)
                r = await client.post(url, headers=headers, json=payload)
            if r.status_code >= 400:
                raise RuntimeError(f"Gemini HTTP {r.status_code}: {r.text[:160]}")
            data = r.json()
        parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts)
        if not text:
            raise RuntimeError("Gemini returned empty content")
        return text

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 1000,
        prefer: Optional[str] = None,
    ) -> Optional[AIResult]:
        """Run the provider chain. Returns None when no provider succeeded."""
        chain = self.active_providers
        if prefer in chain:
            chain = [prefer] + [p for p in chain if p != prefer]

        for provider in chain:
            stats = self.stats.get(provider)
            started = time.perf_counter()
            try:
                if provider == "groq":
                    text = await self._call_groq(system_prompt, user_prompt, temperature, max_tokens)
                    model = self.groq_model
                else:
                    text = await self._call_gemini(system_prompt, user_prompt, temperature, max_tokens)
                    model = self.gemini_model
                latency = (time.perf_counter() - started) * 1000
                stats.calls += 1
                stats.total_latency_ms += latency
                _track("ai_completion", {"provider": provider, "model": model,
                                         "latency_ms": round(latency), "success": True})
                return AIResult(text=text, provider=provider, model=model, latency_ms=latency)
            except Exception as e:
                stats.calls += 1
                stats.failures += 1
                stats.last_error = f"{type(e).__name__}: {str(e)[:160]}"
                logger.warning("AI provider %s failed: %s", provider, stats.last_error)
                _track("ai_completion", {"provider": provider, "success": False,
                                         "error": type(e).__name__})
        return None

    async def generate_response(
        self, system_prompt: str, user_prompt: str, temperature: float = 0.3, max_tokens: int = 1000
    ) -> Optional[str]:
        """Backward-compatible helper returning only text."""
        result = await self.complete(system_prompt, user_prompt, temperature, max_tokens)
        return result.text if result else None

    # ------------------------------------------------------------ use cases
    async def generate_copilot_reasoning(
        self, user_prompt: str, tools_executed: List[Dict[str, Any]], context_data: Dict[str, Any]
    ) -> Optional[str]:
        system_prompt = (
            "You are the NEXUS operations analyst. You analyse fleet telemetry, incidents, "
            "warehouse capacity, SLA risk and simulation outcomes. Answer with concise markdown: "
            "key findings, risk assessment, and recommended next steps. Use numbers from the "
            "evidence only; never invent data."
        )
        user_content = (
            f"Question: {user_prompt}\n\nEvidence:\n{context_data}\n\nTool log: {tools_executed}"
        )
        return await self.generate_response(system_prompt, user_content, 0.3, 600)

    async def generate_executive_briefing(self, state_summary: Dict[str, Any]) -> str:
        system_prompt = (
            "You write a 3-bullet executive operations briefing from live metrics. "
            "Cover fleet posture, risk hotspots and capacity. Be specific and brief."
        )
        text = await self.generate_response(system_prompt, f"Live state:\n{state_summary}", 0.2, 300)
        if text:
            return text
        active_inc = state_summary.get("activeIncidentsCount", 0)
        sla = state_summary.get("slaCompliancePercent", 0)
        return (
            f"- Monitoring {active_inc} active incident(s).\n"
            f"- Network SLA adherence is {sla}%.\n"
            f"- Hub capacity pressure: {'yes' if state_summary.get('capacityPressure') else 'none detected'}."
        )

    async def explain_metrics(self, metrics: Dict[str, Any], question: Optional[str] = None) -> Dict[str, Any]:
        """Turn an analytics payload into narrative insights for dashboards."""
        system_prompt = (
            "You are a data analyst for a logistics analytics product. Given a JSON metrics "
            "payload, return 3-5 short bullet insights (trend, anomaly, risk, recommendation). "
            "Quote exact figures from the payload. Plain markdown bullets only."
        )
        user = f"Metrics:\n{metrics}"
        if question:
            user += f"\n\nFocus question: {question}"
        result = await self.complete(system_prompt, user, temperature=0.2, max_tokens=400)
        if result:
            return {"insights": result.text, "provider": result.provider, "model": result.model,
                    "latencyMs": round(result.latency_ms)}
        return {"insights": _deterministic_insights(metrics), "provider": "deterministic",
                "model": "rules-v1", "latencyMs": 0}


def _deterministic_insights(metrics: Dict[str, Any]) -> str:
    lines = []
    sla = metrics.get("slaComplianceRate")
    if sla is not None:
        tone = "healthy" if sla >= 95 else "below the 95% target"
        lines.append(f"- SLA compliance is **{sla}%**, {tone}.")
    tat = metrics.get("avgTurnaroundMins")
    if tat is not None:
        lines.append(f"- Average turnaround is **{tat} min**.")
    units = metrics.get("totalNetworkUnits")
    if units is not None:
        lines.append(f"- **{units}** units currently in the network.")
    if not lines:
        lines.append("- Not enough data yet. Import operations data to unlock insights.")
    lines.append("- Add a Groq or Gemini API key to enable AI-written narrative insights.")
    return "\n".join(lines)


ai_service = AIService()
