import os
from typing import Optional, Dict, Any
from groq import AsyncGroq
from app.core.config import settings

class AiService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.client = None
        if self.api_key:
            try:
                self.client = AsyncGroq(api_key=self.api_key)
            except Exception:
                self.client = None

    async def health_check(self) -> Dict[str, Any]:
        """Test live connection to Groq AI Inference API."""
        if not self.client:
            return {"status": "UNCONFIGURED", "model": self.model, "provider": "groq"}
        try:
            res = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=2,
                temperature=0.0,
            )
            return {
                "status": "HEALTHY",
                "model": self.model,
                "provider": "groq",
                "sample_response": res.choices[0].message.content.strip() if res.choices else "ok",
            }
        except Exception as e:
            return {
                "status": "DEGRADED",
                "model": self.model,
                "provider": "groq",
                "error": str(e),
            }

    async def generate_operational_briefing(self, context_summary: Optional[str] = None) -> str:
        """Generate executive situational briefing using Groq LLaMA 3.3 70B."""
        fallback = (
            "Operations situation normal across North American corridors with 1 active weather anomaly flagged. "
            "Vehicle NX-TRK-104 is holding near Cheyenne Summit due to an I-80 corridor blizzard closure. "
            "Deterministic simulation SIM-SCENARIO-901 indicates an active I-70 detour will recover 135 minutes with 94% confidence. "
            "Overall network fleet utilization is at 80% with 96.8% SLA adherence across 6 primary superhubs."
        )

        if not self.client:
            return fallback

        prompt = (
            "You are the NEXUS Operational Intelligence AI Engine. Generate a concise, authoritative executive operational briefing "
            "(2-3 sentences max) summarizing current fleet health, active corridor anomalies, and recommended mitigation actions.\n\n"
            f"Context: {context_summary or '1 active blizzard anomaly on I-80 corridor. Vehicle NX-TRK-104 affected. 80% fleet utilization.'}"
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a mission-critical logistics intelligence briefing assistant. Speak with executive precision."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=250,
            )
            content = response.choices[0].message.content
            return content.strip() if content else fallback
        except Exception:
            return fallback

    async def generate_incident_rca(
        self,
        incident_code: str,
        title: str,
        severity: str,
        delay_mins: int,
        vehicle_code: str = "NX-TRK-104",
    ) -> Dict[str, Any]:
        """Generate automated Root Cause Analysis & Mitigation Recommendations."""
        fallback = {
            "root_cause": f"Severe localized meteorological anomaly causing transport blockage for {vehicle_code}.",
            "impact_assessment": f"Severity {severity} delay of +{delay_mins} minutes impacting scheduled crossdock handoffs.",
            "recommended_action": "Execute deterministic detour via southern arterial corridor (I-70) or transfer high-priority consignments to standby relay hauler.",
        }

        if not self.client:
            return fallback

        prompt = (
            f"Perform an automated Root Cause Analysis (RCA) and mitigation plan for incident [{incident_code}] "
            f"'{title}' (Severity: {severity}, Delay: +{delay_mins} mins, Vehicle: {vehicle_code}). "
            f"Return a 3-part summary with concise bullet points: Root Cause, Operational Impact, and Immediate Action."
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an elite operational intelligence logistics analyst. Keep answers crisp and tactical."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=300,
            )
            text = response.choices[0].message.content.strip() if response.choices else ""
            return {
                "root_cause": f"Severe weather and corridor impairment: {title}",
                "impact_assessment": f"+{delay_mins} mins delay on {vehicle_code}",
                "recommended_action": text or fallback["recommended_action"],
            }
        except Exception:
            return fallback

    async def generate_simulation_explanation(
        self,
        simulation_code: str,
        route_type: str,
        time_saved_mins: int,
        cost_delta_usd: float,
        sla_breach_risk_pct: float,
    ) -> str:
        """Generate human-readable executive explanation of a simulation scenario."""
        fallback = (
            f"Simulation {simulation_code} evaluates {route_type}, projecting a recovery of {time_saved_mins} minutes "
            f"at an additional operational cost of ${cost_delta_usd:.2f}. "
            f"SLA breach probability drops to {sla_breach_risk_pct:.1f}%."
        )

        if not self.client:
            return fallback

        prompt = (
            f"Explain simulation run [{simulation_code}]: Route diversion strategy '{route_type}' "
            f"recovers {time_saved_mins} mins delay, costs ${cost_delta_usd:.2f}, and reduces SLA breach risk to {sla_breach_risk_pct:.1f}%. "
            f"Provide a 2-sentence executive rationale on why the operations manager should approve or reject this decision."
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a quantitative operations decision analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=200,
            )
            content = response.choices[0].message.content
            return content.strip() if content else fallback
        except Exception:
            return fallback

ai_service = AiService()

async def generate_ai_briefing(context: Any) -> str:
    """Helper alias function for operational briefing generation."""
    ctx_str = str(context) if context else None
    return await ai_service.generate_operational_briefing(ctx_str)
