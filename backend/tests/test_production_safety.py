import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.auth.dependencies import require_onboarded
from app.auth.principal import ROLE_PERMISSIONS_MAP, RequestPrincipal, RoleEnum
from app.integrations.azure_monitor import AzureMonitorClient
from app.main import app
from app.services.ai_service import ai_service
from app.schemas.simulations import BaseMetricsSnapshot, SimulationVariables
from app.services.simulation_engine import run_stochastic_simulation


def test_stochastic_estimate_keeps_unknown_sla_risk_unknown():
    base = BaseMetricsSnapshot(
        totalDistanceKm=120,
        avgDurationMins=180,
        currentDelayMins=20,
        baseCostUsd=60,
    )
    variables = SimulationVariables(speedDeltaPct=5, fuelCostPerKm=0.5)

    result = run_stochastic_simulation(base, variables, iterations=50)

    assert result["stochastic_confidence"]["sla_breach_risk_pct"] is None
    assert result["stochastic_confidence"]["iterations"] == 50


def test_telemetry_facade_accepts_missing_exception():
    AzureMonitorClient().track_exception(None, {"source": "test"})


@pytest.mark.asyncio
async def test_viewer_cannot_process_dispatch_approval(async_client: AsyncClient):
    viewer = RequestPrincipal(
        nexus_user_id="usr-viewer",
        clerk_user_id="clerk-viewer",
        email="viewer@example.test",
        display_name="Viewer",
        workspace_id="ws-viewer",
        role=RoleEnum.VIEWER,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.VIEWER],
    )
    app.dependency_overrides[require_onboarded] = lambda: viewer

    response = await async_client.post(
        "/api/v1/governance/approvals/appr-test/action",
        json={"decision": "APPROVE"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_ai_chat_fallback_reports_workspace_data_without_inventing_metrics(async_client: AsyncClient):
    with patch.object(ai_service, "complete", new=AsyncMock(return_value=None)):
        response = await async_client.post(
            "/api/v1/ai/chat",
            json={"prompt": "Summarize my workspace"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "deterministic"
    assert "0 vehicles" in payload["reply"]
    assert "0 orders" in payload["reply"]
    assert "unavailable" in payload["reply"]
