import pytest
from app.services.ai_service import ai_service

@pytest.mark.asyncio
async def test_ai_briefing_generation():
    briefing = await ai_service.generate_operational_briefing("Test incident on I-80 corridor.")
    assert isinstance(briefing, str)
    assert len(briefing) > 20

@pytest.mark.asyncio
async def test_ai_incident_rca():
    rca = await ai_service.generate_incident_rca(
        incident_code="INC-TEST-01",
        title="Blizzard Mountain Impasse",
        severity="CRITICAL",
        delay_mins=120,
    )
    assert "root_cause" in rca
    assert "impact_assessment" in rca
    assert "recommended_action" in rca

@pytest.mark.asyncio
async def test_ai_simulation_explanation():
    explanation = await ai_service.generate_simulation_explanation(
        simulation_code="SIM-TEST-01",
        route_type="I-70 South Bypass",
        time_saved_mins=135,
        cost_delta_usd=45.0,
        sla_breach_risk_pct=4.2,
    )
    assert isinstance(explanation, str)
    assert len(explanation) > 10

@pytest.mark.asyncio
async def test_ai_health():
    health = await ai_service.health_check()
    assert "status" in health
    assert health["provider"] == "groq"
