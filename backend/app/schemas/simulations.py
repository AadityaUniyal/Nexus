from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict

class SimulationVariables(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    vehicle_id: Optional[str] = Field("v-104", alias="vehicleId")
    alternate_route_type: str = Field("I-70_SOUTH_DETOUR", alias="alternateRouteType")
    speed_delta_pct: float = Field(10.0, alias="speedDeltaPct")
    fuel_cost_per_km: float = Field(0.42, alias="fuelCostPerKm")
    priority_reordering: bool = Field(True, alias="priorityReordering")

class BaseMetricsSnapshot(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    total_distance_km: float = Field(1620.0, alias="totalDistanceKm")
    avg_duration_mins: int = Field(940, alias="avgDurationMins")
    current_delay_mins: int = Field(180, alias="currentDelayMins")
    orders_count: int = Field(14, alias="ordersCount")
    total_order_value: float = Field(45000.0, alias="totalOrderValue")
    base_cost_usd: float = Field(1450.0, alias="baseCostUsd")

class SimulatedMetricsOutput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    total_distance_km: float = Field(..., alias="totalDistanceKm")
    total_duration_mins: int = Field(..., alias="totalDurationMins")
    projected_delay_mins: int = Field(..., alias="projectedDelayMins")
    net_time_saved_mins: int = Field(..., alias="netTimeSavedMins")
    total_cost_usd: float = Field(..., alias="totalCostUsd")
    cost_delta_usd: float = Field(..., alias="costDeltaUsd")
    sla_breach_risk_pct: float = Field(..., alias="slaBreachRiskPct")
    orders_at_risk: int = Field(..., alias="ordersAtRisk")
    recommendation_score: int = Field(..., alias="recommendationScore")
    verdict: str
    insights: List[str]

    @property
    def recommendationScore(self) -> int:
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
    def slaBreachRiskPct(self) -> float:
        return self.sla_breach_risk_pct

    @property
    def projectedDelayMins(self) -> int:
        return self.projected_delay_mins

    @property
    def ordersAtRisk(self) -> int:
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
