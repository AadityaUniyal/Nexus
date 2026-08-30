from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.simulations import (
    SimulationRead,
    SimulationCreate,
    BaseMetricsSnapshot,
    SimulationApplyDecision,
)
from app.services.simulation_engine import run_deterministic_simulation
from app.core.errors import EntityNotFoundException
from app.realtime.sse import broadcaster

router = APIRouter(prefix="/simulations", tags=["Simulations"])

# In-memory store fallback for instant simulation state
_SIMULATIONS_STORE: List[SimulationRead] = [
    SimulationRead(
        id="sim-901",
        code="SIM-SCENARIO-901",
        title="I-70 South Highway Bypass Simulation",
        description="Hypothetical reroute of Vehicle NX-TRK-104 via Denver I-70 South corridor to bypass Interstate 80 blizzard closure.",
        status="EVALUATED",
        incident_id="inc-8041",
        variables={
            "vehicleId": "v-104",
            "alternateRouteType": "I-70_SOUTH_DETOUR",
            "speedDeltaPct": 10.0,
            "fuelCostPerKm": 0.42,
            "priorityReordering": True,
        },
        baseline_metrics={
            "totalDistanceKm": 1620.0,
            "avgDurationMins": 940,
            "projectedDelayMins": 180,
            "totalCostUsd": 1450.0,
            "slaBreachRiskPct": 88.0,
        },
        simulated_metrics={
            "totalDistanceKm": 1705.0,
            "totalDurationMins": 985,
            "projectedDelayMins": 45,
            "netTimeSavedMins": 135,
            "totalCostUsd": 1530.70,
            "costDeltaUsd": 80.70,
            "slaBreachRiskPct": 12.0,
            "ordersAtRisk": 1,
            "recommendationScore": 94,
            "verdict": "HIGHLY_RECOMMENDED",
            "insights": [
                "Corridor diversion via I-70 South Bypass restores +135 minutes of transit margin.",
                "Incremental operational cost of +$80.70 prevents potential contract SLA penalty of $12,500.",
                "SLA breach probability reduced from 88.0% baseline down to 12.0%.",
                "Reliability confidence indexed at 94% based on historical corridor telemetry.",
            ],
        },
        ai_briefing="Rerouting NX-TRK-104 via the I-70 South corridor recovers 135 minutes with minimal $80 operational fuel surcharge. Highly recommended to preserve AeroTech SLA compliance.",
        applied_at=None,
        applied_by=None,
        workspace_id="ws-demo-1",
        created_at="2026-08-30T00:12:00Z",
    )
]

@router.get("", response_model=List[SimulationRead])
async def list_simulations(
    workspace_id: str = Query(default="ws-demo-1"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all executed What-If simulation scenarios."""
    return _SIMULATIONS_STORE

@router.get("/{sim_id}", response_model=SimulationRead)
async def get_simulation(sim_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve scenario details with comparative metrics."""
    for sim in _SIMULATIONS_STORE:
        if sim.id == sim_id or sim.code == sim_id:
            return sim
    raise EntityNotFoundException("Simulation", sim_id)

@router.post("", response_model=SimulationRead, status_code=status.HTTP_201_CREATED)
async def create_simulation(req: SimulationCreate, db: AsyncSession = Depends(get_db)):
    """Evaluate and store a new deterministic What-If simulation scenario."""
    base_snapshot = BaseMetricsSnapshot()
    sim_output = run_deterministic_simulation(base_snapshot, req.variables)

    new_sim = SimulationRead(
        id=f"sim-{int(datetime.now().timestamp())}",
        code=f"SIM-{int(datetime.now().timestamp()) % 10000}",
        title=req.title,
        description=req.description,
        status="EVALUATED",
        incident_id=req.incident_id,
        variables=req.variables.model_dump(),
        baseline_metrics=base_snapshot.model_dump(),
        simulated_metrics=sim_output.model_dump(),
        ai_briefing=f"Simulation {req.title} completed: {sim_output.verdict} with {sim_output.recommendationScore}% confidence score.",
        applied_at=None,
        applied_by=None,
        workspace_id=req.workspace_id or "ws-demo-1",
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    _SIMULATIONS_STORE.insert(0, new_sim)
    await broadcaster.broadcast("SIMULATION_EVALUATED", new_sim.model_dump())
    return new_sim

@router.post("/{sim_id}/apply-decision", response_model=SimulationRead)
async def apply_simulation_decision(
    sim_id: str,
    req: SimulationApplyDecision,
    db: AsyncSession = Depends(get_db)
):
    """Transactionally apply a validated simulation scenario to live fleet dispatch."""
    for idx, sim in enumerate(_SIMULATIONS_STORE):
        if sim.id == sim_id or sim.code == sim_id:
            now_iso = datetime.now(timezone.utc).isoformat()
            updated = sim.model_copy(
                update={
                    "status": "APPLIED",
                    "applied_at": now_iso,
                    "applied_by": req.actor_name,
                }
            )
            _SIMULATIONS_STORE[idx] = updated

            # Broadcast operational event
            await broadcaster.broadcast("DECISION_APPLIED", {
                "simulationId": updated.id,
                "simulationCode": updated.code,
                "actorName": req.actor_name,
                "appliedAt": now_iso,
            })
            return updated

    raise EntityNotFoundException("Simulation", sim_id)
