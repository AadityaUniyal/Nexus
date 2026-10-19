import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.models.simulations import Simulation
from app.models.operations import Vehicle, Route, Order
from app.models.incidents import Incident
from app.models.system import OperationalEvent
from app.schemas.simulations import (
    SimulationRead,
    SimulationCreate,
    SimulationVariables,
    BaseMetricsSnapshot,
    SimulationApplyDecision,
    SimulationEvaluateRequest,
    SimulatedMetricsOutput,
)
from app.services.simulation_engine import run_deterministic_simulation
from app.core.errors import EntityNotFoundException, NexusException
from app.realtime.sse import broadcaster
from app.auth.dependencies import require_permission, require_workspace
from app.auth.principal import PermissionEnum, RequestPrincipal

router = APIRouter(prefix="/simulations", tags=["Simulations"])

@router.post("/evaluate", response_model=SimulatedMetricsOutput)
async def evaluate_simulation_parameters(req: SimulationEvaluateRequest):
    """
    Authoritative backend physics engine evaluation endpoint.
    Computes aerodynamic drag, rolling resistance, SLA breach probability, and Pareto recommendation score.
    """
    return run_deterministic_simulation(req.base_metrics, req.variables)

@router.post("/evaluate-stochastic")
async def evaluate_stochastic_simulation_parameters(
    req: SimulationEvaluateRequest,
    iterations: int = Query(default=500, ge=50, le=2000)
):
    """
    Monte Carlo stochastic simulation endpoint.
    Runs N risk iterations to compute P10, P50, and P90 percentile confidence bounds for delay, cost, and SLA survival.
    """
    from app.services.simulation_engine import run_stochastic_simulation
    return run_stochastic_simulation(req.base_metrics, req.variables, iterations=iterations)

@router.get("", response_model=List[SimulationRead])
async def list_simulations(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve executed What-If simulation scenarios directly from PostgreSQL with pagination support."""
    ws = principal.workspace_id
    stmt = (
        select(Simulation)
        .where(Simulation.workspace_id == ws)
        .order_by(Simulation.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(stmt)
    sims = result.scalars().all()

    output = []
    for s in sims:
        output.append(
            SimulationRead(
                id=s.id,
                code=s.code,
                title=s.title,
                description=s.description,
                status=s.status,
                incident_id=s.incident_id,
                variables=s.variables or {},
                baseline_metrics=s.baseline_metrics or {},
                simulated_metrics=s.simulated_metrics or {},
                ai_briefing=s.ai_briefing,
                applied_at=s.applied_at,
                applied_by=s.applied_by,
                workspace_id=s.workspace_id,
                created_at=s.created_at.isoformat() if hasattr(s.created_at, "isoformat") else str(s.created_at),
            )
        )
    return output

@router.get("/{sim_id}", response_model=SimulationRead)
async def get_simulation(
    sim_id: str,
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve scenario details with comparative metrics from PostgreSQL."""
    ws = principal.workspace_id
    stmt = select(Simulation).where(
        Simulation.workspace_id == ws,
        or_(Simulation.id == sim_id, Simulation.code == sim_id)
    )
    result = await db.execute(stmt)
    s = result.scalars().first()
    if not s:
        raise EntityNotFoundException("Simulation", sim_id)

    return SimulationRead(
        id=s.id,
        code=s.code,
        title=s.title,
        description=s.description,
        status=s.status,
        incident_id=s.incident_id,
        variables=s.variables or {},
        baseline_metrics=s.baseline_metrics or {},
        simulated_metrics=s.simulated_metrics or {},
        ai_briefing=s.ai_briefing,
        applied_at=s.applied_at,
        applied_by=s.applied_by,
        workspace_id=s.workspace_id,
        created_at=s.created_at.isoformat() if hasattr(s.created_at, "isoformat") else str(s.created_at),
    )

@router.post("", response_model=SimulationRead, status_code=status.HTTP_201_CREATED)
async def create_simulation(
    req: SimulationCreate,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.RUN_SIMULATION)),
    db: AsyncSession = Depends(get_db)
):
    """Evaluate and store a new deterministic What-If simulation scenario in PostgreSQL."""
    sim_id = f"sim-{uuid.uuid4().hex[:8]}"
    sim_code = f"SIM-{int(datetime.now().timestamp()) % 10000}"
    ws_id = principal.workspace_id

    # Dynamically query target Vehicle, Route, Incident, and Orders from PostgreSQL
    target_vehicle = None
    target_vehicle_id = req.variables.vehicle_id if req.variables else None
    if not target_vehicle_id:
        raise NexusException(status_code=422, code="VEHICLE_REQUIRED", message="Select a workspace vehicle with an assigned route to create an estimate.")
    v_stmt = select(Vehicle).where(Vehicle.workspace_id == ws_id, or_(Vehicle.id == target_vehicle_id, Vehicle.code == target_vehicle_id))
    v_res = await db.execute(v_stmt)
    target_vehicle = v_res.scalars().first()
    if not target_vehicle:
        raise EntityNotFoundException("Vehicle", target_vehicle_id)

    target_route = None
    if target_vehicle and target_vehicle.current_route_id:
        r_stmt = select(Route).where(Route.workspace_id == ws_id, Route.id == target_vehicle.current_route_id)
        r_res = await db.execute(r_stmt)
        target_route = r_res.scalars().first()

    target_incident = None
    if req.incident_id:
        inc_stmt = select(Incident).where(Incident.workspace_id == ws_id, or_(Incident.id == req.incident_id, Incident.code == req.incident_id))
        inc_res = await db.execute(inc_stmt)
        target_incident = inc_res.scalars().first()
        if not target_incident:
            raise EntityNotFoundException("Incident", req.incident_id)
    elif target_vehicle:
        inc_conds = [
            Incident.affected_entity_id == target_vehicle.id,
            Incident.affected_entity_id == target_vehicle.code,
        ]
        if target_vehicle.current_route_id:
            inc_conds.append(Incident.affected_entity_id == target_vehicle.current_route_id)
        inc_stmt = select(Incident).where(Incident.workspace_id == ws_id, or_(*inc_conds)).order_by(Incident.created_at.desc())
        inc_res = await db.execute(inc_stmt)
        target_incident = inc_res.scalars().first()

    orders_count = 0
    total_order_value = 0.0
    if target_vehicle:
        ord_stmt = select(Order).where(Order.workspace_id == ws_id, or_(Order.vehicle_id == target_vehicle.id, Order.vehicle_code == target_vehicle.code))
        ord_res = await db.execute(ord_stmt)
        orders = ord_res.scalars().all()
        if orders:
            orders_count = len(orders)
            total_order_value = sum(o.total_cost for o in orders)
    
    if not target_route:
        raise NexusException(status_code=422, code="ROUTE_REQUIRED", message="The selected vehicle has no saved route. Assign a workspace route before estimating.")

    dist = target_route.distance_km
    dur = target_route.avg_duration_mins
    delay = target_incident.delay_minutes if target_incident else 0
    fuel_rate = req.variables.fuel_cost_per_km
    base_cost = round(dist * fuel_rate * 2.13, 2)

    base_snapshot = BaseMetricsSnapshot(
        totalDistanceKm=dist,
        avgDurationMins=dur,
        currentDelayMins=delay,
        ordersCount=orders_count,
        totalOrderValue=total_order_value,
        baseCostUsd=base_cost,
    )
    sim_output = run_deterministic_simulation(base_snapshot, req.variables)

    new_sim = Simulation(
        id=sim_id,
        code=sim_code,
        title=req.title,
        description=req.description,
        status="EVALUATED",
        incident_id=req.incident_id,
        base_snapshot_version=1,
        variables=req.variables.model_dump(),
        baseline_metrics={**base_snapshot.model_dump(), **base_snapshot.model_dump(by_alias=True)},
        simulated_metrics={**sim_output.model_dump(), **sim_output.model_dump(by_alias=True)},
        ai_briefing=None,
        applied_at=None,
        applied_by=None,
        workspace_id=ws_id,
    )
    db.add(new_sim)

    event = OperationalEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        workspace_id=ws_id,
        event_type="simulation.completed",
        severity="INFO",
        entity_type="SIMULATION",
        entity_id=sim_id,
        message=f"Planning estimate {sim_code} calculated from saved route data.",
        occurred_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(event)

    await db.commit()
    await db.refresh(new_sim)

    await broadcaster.broadcast("SIMULATION_EVALUATED", {
        "id": new_sim.id,
        "code": new_sim.code,
        "title": new_sim.title,
        "recommendationScore": None,
        "netTimeSavedMins": sim_output.netTimeSavedMins,
        "verdict": sim_output.verdict,
    })

    return SimulationRead(
        id=new_sim.id,
        code=new_sim.code,
        title=new_sim.title,
        description=new_sim.description,
        status=new_sim.status,
        incident_id=new_sim.incident_id,
        variables=new_sim.variables,
        baseline_metrics=new_sim.baseline_metrics,
        simulated_metrics=new_sim.simulated_metrics,
        ai_briefing=new_sim.ai_briefing,
        applied_at=new_sim.applied_at,
        applied_by=new_sim.applied_by,
        workspace_id=new_sim.workspace_id,
        created_at=new_sim.created_at.isoformat() if hasattr(new_sim.created_at, "isoformat") else str(new_sim.created_at),
    )

@router.post("/{sim_id}/run", response_model=SimulationRead)
async def run_simulation(
    sim_id: str,
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_workspace),
):
    """Re-evaluate / execute a simulation scenario in PostgreSQL."""
    stmt = select(Simulation).where(Simulation.workspace_id == principal.workspace_id, or_(Simulation.id == sim_id, Simulation.code == sim_id))
    result = await db.execute(stmt)
    sim = result.scalars().first()
    if not sim:
        raise EntityNotFoundException("Simulation", sim_id)

    # Re-run deterministic simulation engine with current variables
    base_snapshot = BaseMetricsSnapshot(**(sim.baseline_metrics or {}))
    vars_dict = sim.variables or {}
    sim_vars = SimulationVariables(**vars_dict) if vars_dict else SimulationVariables()
    sim_output = run_deterministic_simulation(base_snapshot, sim_vars)

    sim.status = "EVALUATED"
    sim.baseline_metrics = base_snapshot.model_dump()
    sim.simulated_metrics = sim_output.model_dump()
    sim.ai_briefing = None
    sim.version += 1

    event = OperationalEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        workspace_id=sim.workspace_id,
        event_type="simulation.completed",
        severity="INFO",
        entity_type="SIMULATION",
        entity_id=sim.id,
        message=f"Planning estimate {sim.code} recalculated from its saved baseline.",
        occurred_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(event)

    await db.commit()
    await db.refresh(sim)

    await broadcaster.broadcast("SIMULATION_EVALUATED", {
        "id": sim.id,
        "code": sim.code,
        "title": sim.title,
        "recommendationScore": None,
        "netTimeSavedMins": sim_output.netTimeSavedMins,
        "verdict": sim_output.verdict,
    })

    return SimulationRead(
        id=sim.id,
        code=sim.code,
        title=sim.title,
        description=sim.description,
        status=sim.status,
        incident_id=sim.incident_id,
        variables=sim.variables or {},
        baseline_metrics=sim.baseline_metrics or {},
        simulated_metrics=sim.simulated_metrics or {},
        ai_briefing=sim.ai_briefing,
        applied_at=sim.applied_at,
        applied_by=sim.applied_by,
        workspace_id=sim.workspace_id,
        created_at=sim.created_at.isoformat() if hasattr(sim.created_at, "isoformat") else str(sim.created_at),
    )

@router.post("/{sim_id}/apply-decision", response_model=SimulationRead)
async def apply_simulation_decision(
    sim_id: str,
    req: SimulationApplyDecision,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.APPLY_DECISION)),
):
    """Do not mutate live dispatch until a real dispatch integration is configured."""
    raise NexusException(
        status_code=409,
        code="DISPATCH_INTEGRATION_REQUIRED",
        message="This estimate cannot be applied to live operations because no dispatch integration is configured.",
        details={"simulationId": sim_id},
    )
