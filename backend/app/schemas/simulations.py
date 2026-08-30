from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class SimulationVariables(BaseModel):
    vehicleId: Optional[str] = "v-104"
    alternateRouteType: str = "I-70_SOUTH_DETOUR"
    speedDeltaPct: float = 10.0
    fuelCostPerKm: float = 0.42
    priorityReordering: bool = True

class BaseMetricsSnapshot(BaseModel):
    totalDistanceKm: float = 1620.0
    avgDurationMins: int = 940
    currentDelayMins: int = 180
    ordersCount: int = 14
    totalOrderValue: float = 45000.0
    baseCostUsd: float = 1450.0

class SimulatedMetricsOutput(BaseModel):
    totalDistanceKm: float
    totalDurationMins: int
    projectedDelayMins: int
    netTimeSavedMins: int
    totalCostUsd: float
    costDeltaUsd: float
    slaBreachRiskPct: float
    ordersAtRisk: int
    recommendationScore: int
    verdict: str
    insights: List[str]

class SimulationCreate(BaseModel):
    title: str
    description: str
    incident_id: Optional[str] = None
    variables: SimulationVariables
    workspace_id: Optional[str] = None

class SimulationApplyDecision(BaseModel):
    actor_name: str = "Sarah Chen"

class SimulationRead(BaseModel):
    id: str
    code: str
    title: str
    description: str
    status: str
    incident_id: Optional[str] = None
    variables: Dict[str, Any]
    baseline_metrics: Dict[str, Any]
    simulated_metrics: Dict[str, Any]
    ai_briefing: Optional[str] = None
    applied_at: Optional[str] = None
    applied_by: Optional[str] = None
    workspace_id: str
    created_at: str

    model_config = {"from_attributes": True}
