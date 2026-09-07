import os
import logging
from typing import Optional, Dict, Any
import httpx
from groq import AsyncGroq
from app.core.config import settings

logger = logging.getLogger("nexus.ai")

class AiService:
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY
        self.groq_model = settings.GROQ_MODEL
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.gemini_model = settings.GEMINI_MODEL

        self.groq_client = None
        if self.groq_api_key:
            try:
                self.groq_client = AsyncGroq(api_key=self.groq_api_key)
            except Exception as e:
                logger.warning(f"Groq client initialization warning: {e}")
                self.groq_client = None

    async def _call_gemini_fallback(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 250,
        temperature: float = 0.3,
    ) -> Optional[str]:
        """Secondary fallback LLM inference using Google Gemini REST API."""
        if not self.gemini_api_key:
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_api_key}"
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            }
        }
        if system_prompt:
            payload["system_instruction"] = {"parts": [{"text": system_prompt}]}

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            text = parts[0]["text"].strip()
                            if text:
                                logger.info(f"Successfully generated completion via Gemini fallback ({self.gemini_model})")
                                return text
                else:
                    logger.warning(f"Gemini API returned HTTP status {res.status_code}: {res.text[:150]}")
        except Exception as e:
            logger.warning(f"Gemini API failover execution exception: {e}")

        return None

    async def health_check(self) -> Dict[str, Any]:
        """Test live connection to both Groq Primary and Gemini Secondary AI Providers."""
        groq_status = "UNCONFIGURED"
        groq_sample = None
        gemini_status = "UNCONFIGURED"
        gemini_sample = None

        # 1. Test Groq
        if self.groq_client:
            try:
                res = await self.groq_client.chat.completions.create(
                    model=self.groq_model,
                    messages=[{"role": "user", "content": "ping"}],
                    max_tokens=2,
                    temperature=0.0,
                )
                groq_status = "HEALTHY"
                groq_sample = res.choices[0].message.content.strip() if res.choices else "ok"
            except Exception as e:
                groq_status = f"DEGRADED: {str(e)}"

        # 2. Test Gemini
        if self.gemini_api_key:
            gem_res = await self._call_gemini_fallback("ping", max_tokens=2, temperature=0.0)
            if gem_res is not None:
                gemini_status = "HEALTHY"
                gemini_sample = gem_res
            else:
                gemini_status = "DEGRADED"

        active_provider = "groq" if groq_status == "HEALTHY" else ("gemini" if gemini_status == "HEALTHY" else "deterministic_fallback")

        return {
            "status": "HEALTHY" if active_provider in ["groq", "gemini"] else "DEGRADED",
            "active_provider": active_provider,
            "providers": {
                "groq": {
                    "status": groq_status,
                    "model": self.groq_model,
                    "sample": groq_sample,
                },
                "gemini": {
                    "status": gemini_status,
                    "model": self.gemini_model,
                    "sample": gemini_sample,
                }
            }
        }

    async def generate_operational_briefing(self, context_summary: Optional[str] = None) -> str:
        """Generate executive situational briefing with Groq Primary -> Gemini Secondary failover."""
        fallback = (
            "Operations situation normal across North American corridors with 1 active weather anomaly flagged. "
            "Vehicle NX-TRK-104 is holding near Cheyenne Summit due to an I-80 corridor blizzard closure. "
            "Deterministic simulation SIM-SCENARIO-901 indicates an active I-70 detour will recover 135 minutes with 94% confidence. "
            "Overall network fleet utilization is at 80% with 96.8% SLA adherence across 6 primary superhubs."
        )

        prompt = (
            "You are the NEXUS Operational Intelligence AI Engine. Generate a concise, authoritative executive operational briefing "
            "(2-3 sentences max) summarizing current fleet health, active corridor anomalies, and recommended mitigation actions.\n\n"
            f"Context: {context_summary or '1 active blizzard anomaly on I-80 corridor. Vehicle NX-TRK-104 affected. 80% fleet utilization.'}"
        )
        system_prompt = "You are a mission-critical logistics intelligence briefing assistant. Speak with executive precision."

        # 1. Try Groq Primary
        if self.groq_client:
            try:
                response = await self.groq_client.chat.completions.create(
                    model=self.groq_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=250,
                )
                content = response.choices[0].message.content
                if content and content.strip():
                    return content.strip()
            except Exception as e:
                logger.warning(f"Groq API error in generate_operational_briefing: {e}. Initiating Gemini fallback...")

        # 2. Try Gemini Secondary
        gemini_result = await self._call_gemini_fallback(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=250,
            temperature=0.3,
        )
        if gemini_result:
            return gemini_result

        # 3. Tertiary Deterministic Fallback
        return fallback

    async def generate_incident_rca(
        self,
        incident_code: str,
        title: str,
        severity: str,
        delay_mins: int,
        vehicle_code: str = "NX-TRK-104",
    ) -> Dict[str, Any]:
        """Generate automated Root Cause Analysis & Mitigation Recommendations with Groq -> Gemini failover."""
        fallback = {
            "root_cause": f"Severe localized meteorological anomaly causing transport blockage for {vehicle_code}.",
            "impact_assessment": f"Severity {severity} delay of +{delay_mins} minutes impacting scheduled crossdock handoffs.",
            "recommended_action": "Execute deterministic detour via southern arterial corridor (I-70) or transfer high-priority consignments to standby relay hauler.",
        }

        prompt = (
            f"Perform an automated Root Cause Analysis (RCA) and mitigation plan for incident [{incident_code}] "
            f"'{title}' (Severity: {severity}, Delay: +{delay_mins} mins, Vehicle: {vehicle_code}). "
            f"Return a 3-part summary with concise bullet points: Root Cause, Operational Impact, and Immediate Action."
        )
        system_prompt = "You are an elite operational intelligence logistics analyst. Keep answers crisp and tactical."

        # 1. Try Groq Primary
        if self.groq_client:
            try:
                response = await self.groq_client.chat.completions.create(
                    model=self.groq_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=300,
                )
                text = response.choices[0].message.content.strip() if response.choices else ""
                if text:
                    return {
                        "root_cause": f"Severe weather and corridor impairment: {title}",
                        "impact_assessment": f"+{delay_mins} mins delay on {vehicle_code}",
                        "recommended_action": text,
                    }
            except Exception as e:
                logger.warning(f"Groq API error in generate_incident_rca: {e}. Initiating Gemini fallback...")

        # 2. Try Gemini Secondary
        gemini_text = await self._call_gemini_fallback(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=300,
            temperature=0.2,
        )
        if gemini_text:
            return {
                "root_cause": f"Severe weather and corridor impairment: {title}",
                "impact_assessment": f"+{delay_mins} mins delay on {vehicle_code}",
                "recommended_action": gemini_text,
            }

        # 3. Tertiary Deterministic Fallback
        return fallback

    async def generate_simulation_explanation(
        self,
        simulation_code: str,
        route_type: str,
        time_saved_mins: int,
        cost_delta_usd: float,
        sla_breach_risk_pct: float,
    ) -> str:
        """Generate human-readable executive explanation of a simulation scenario with Groq -> Gemini failover."""
        fallback = (
            f"Simulation {simulation_code} evaluates {route_type}, projecting a recovery of {time_saved_mins} minutes "
            f"at an additional operational cost of ${cost_delta_usd:.2f}. "
            f"SLA breach probability drops to {sla_breach_risk_pct:.1f}%."
        )

        prompt = (
            f"Explain simulation run [{simulation_code}]: Route diversion strategy '{route_type}' "
            f"recovers {time_saved_mins} mins delay, costs ${cost_delta_usd:.2f}, and reduces SLA breach risk to {sla_breach_risk_pct:.1f}%. "
            f"Provide a 2-sentence executive rationale on why the operations manager should approve or reject this decision."
        )
        system_prompt = "You are a quantitative operations decision analyst."

        # 1. Try Groq Primary
        if self.groq_client:
            try:
                response = await self.groq_client.chat.completions.create(
                    model=self.groq_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=200,
                )
                content = response.choices[0].message.content
                if content and content.strip():
                    return content.strip()
            except Exception as e:
                logger.warning(f"Groq API error in generate_simulation_explanation: {e}. Initiating Gemini fallback...")

        # 2. Try Gemini Secondary
        gemini_explanation = await self._call_gemini_fallback(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=200,
            temperature=0.3,
        )
        if gemini_explanation:
            return gemini_explanation

        # 3. Tertiary Fallback
        return fallback

ai_service = AiService()

async def generate_ai_briefing(context: Any) -> str:
    """Helper alias function for operational briefing generation."""
    ctx_str = str(context) if context else None
    return await ai_service.generate_operational_briefing(ctx_str)
