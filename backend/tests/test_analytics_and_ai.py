import pytest
from httpx import AsyncClient
from app.services.ai_service import ai_service

@pytest.mark.asyncio
async def test_ai_service_initialization():
    """Verify AI service initialized with Groq client or fallback."""
    assert ai_service is not None
    summary = {
        "activeIncidentsCount": 1,
        "slaCompliancePercent": 97.4,
        "totalNetworkUnits": 50000
    }
    briefing = await ai_service.generate_executive_briefing(summary)
    assert briefing is not None
    assert isinstance(briefing, str)
    assert len(briefing) > 10

@pytest.mark.asyncio
async def test_analytics_overview_endpoint(async_client: AsyncClient):
    """Test SQL analytics overview endpoint end-to-end."""
    response = await async_client.get("/api/v1/analytics/overview?timeframe=24h")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "slaComplianceRate" in data
    assert "hubThroughput" in data
    assert "slaTrends" in data
    assert len(data["slaTrends"]) > 0

@pytest.mark.asyncio
async def test_analytics_export_csv_endpoint(async_client: AsyncClient):
    """Test CSV analytics export endpoint end-to-end."""
    response = await async_client.get("/api/v1/analytics/export?format=csv&timeframe=7d")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "Order Number" in response.text
    assert "Customer" in response.text

@pytest.mark.asyncio
async def test_hubs_throughput_endpoint(async_client: AsyncClient):
    """Test regional hubs throughput endpoint."""
    response = await async_client.get("/api/v1/analytics/hubs")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "hubs" in data

@pytest.mark.asyncio
async def test_analytics_forecast_endpoint(async_client: AsyncClient):
    """Test ML time-series forecast endpoint."""
    response = await async_client.get("/api/v1/analytics/forecast?metric=delivery_volume&horizon=7d")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "forecast" in data
    assert len(data["forecast"]) == 7
    assert "p10" in data["forecast"][0]
    assert "p50" in data["forecast"][0]
    assert "p90" in data["forecast"][0]
    assert "modelMetadata" in data

@pytest.mark.asyncio
async def test_analytics_anomalies_endpoint(async_client: AsyncClient):
    """Test Scikit-Learn IsolationForest anomaly detection endpoint."""
    response = await async_client.get("/api/v1/analytics/anomalies")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "anomalies" in data
    assert "algorithm" in data
    assert "anomaliesDetectedCount" in data

@pytest.mark.asyncio
async def test_analytics_risk_scores_endpoint(async_client: AsyncClient):
    """Test multi-factor risk scores endpoint."""
    response = await async_client.get("/api/v1/analytics/risk-scores")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "riskBreakdown" in data
    assert "portfolioExposureUsd" in data

@pytest.mark.asyncio
async def test_analytics_medallion_summary_endpoint(async_client: AsyncClient):
    """Test Medallion Lakehouse Architecture summary endpoint."""
    response = await async_client.get("/api/v1/analytics/medallion-summary")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "layers" in data
    assert "bronze" in data["layers"]
    assert "silver" in data["layers"]
    assert "gold" in data["layers"]

