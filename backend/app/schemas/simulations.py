from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict

class SimulationVariables(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    vehicle_id: Optional[str] = Field(None, alias="vehicleId")
    alternate_route_type: Optional[str] = Field(None, alias="alternateRouteType")
    speed_delta_pct: float = Field(..., ge=-50, le=50, alias="speedDeltaPct")
    fuel_cost_per_km: float = Field(..., ge=0, alias="fuelCostPerKm")
    priority_reordering: bool = Field(False, alias="priorityReordering")

class BaseMetricsSnapshot(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    total_distance_km: float = Field(..., gt=0, alias="totalDistanceKm")
    avg_duration_mins: int = Field(..., gt=0, alias="avgDurationMins")
    current_delay_mins: int = Field(0, ge=0, alias="currentDelayMins")
    orders_count: int = Field(0, ge=0, alias="ordersCount")
    total_order_value: float = Field(0, ge=0, alias="totalOrderValue")
    base_cost_usd: float = Field(..., ge=0, alias="baseCostUsd")

class SimulatedMetricsOutput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    total_distance_km: float = Field(..., alias="totalDistanceKm")
    total_duration_mins: int = Field(..., alias="totalDurationMins")
    projected_delay_mins: int = Field(..., alias="projectedDelayMins")
    net_time_saved_mins: int = Field(..., alias="netTimeSavedMins")
    total_cost_usd: float = Field(..., alias="totalCostUsd")
    cost_delta_usd: float = Field(..., alias="costDeltaUsd")
    sla_breach_risk_pct: Optional[float] = Field(None, alias="slaBreachRiskPct")
    orders_at_risk: Optional[int] = Field(None, alias="ordersAtRisk")
    recommendation_score: Optional[int] = Field(None, alias="recommendationScore")
    verdict: str
    insights: List[str]

    @property
    def recommendationScore(self) -> Optional[int]:
        return self.recommendation_score

    @property
    def netTimeSavedMins(self) -> int:
        return self.net_time_saved_mins

    @property
    def totalCostUsd(self) -> float:
        return self.total_cost_usd

    @property
    def costDeltaUsd(self) -> float:
        return self.cost_delta_usd

    @property
    def totalDurationMins(self) -> int:
        return self.total_duration_mins

    @property
    def totalDistanceKm(self) -> float:
        return self.total_distance_km

    @property
    def slaBreachRiskPct(self) -> Optional[float]:
        return self.sla_breach_risk_pct

    @property
    def projectedDelayMins(self) -> int:
        return self.projected_delay_mins

    @property
    def ordersAtRisk(self) -> Optional[int]:
        return self.orders_at_risk

class SimulationCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    title: str
    description: str
    incident_id: Optional[str] = Field(None, alias="incidentId")
    variables: SimulationVariables
    workspace_id: Optional[str] = Field(None, alias="workspaceId")

class SimulationEvaluateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    base_metrics: BaseMetricsSnapshot = Field(..., alias="baseSnapshot")
    variables: SimulationVariables

class SimulationApplyDecision(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    actor_name: str = Field("Sarah Chen", alias="actorName")
    notes: Optional[str] = Field(None, alias="operatorNotes")
    simulation_id: Optional[str] = Field(None, alias="simulationId")

class SimulationRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    code: str
    title: str
    description: str
    status: str
    incident_id: Optional[str] = Field(None, alias="incidentId")
    variables: Dict[str, Any]
    baseline_metrics: Dict[str, Any] = Field(default_factory=dict, alias="baselineMetrics")
    simulated_metrics: Dict[str, Any] = Field(default_factory=dict, alias="simulatedMetrics")
    ai_briefing: Optional[str] = Field(None, alias="aiBriefing")
    applied_at: Optional[str] = Field(None, alias="appliedAt")
    applied_by: Optional[str] = Field(None, alias="appliedBy")
    workspace_id: str = Field(..., alias="workspaceId")
    created_at: str = Field(..., alias="createdAt")
