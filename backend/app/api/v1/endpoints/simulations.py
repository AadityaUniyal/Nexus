import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.models.simulations import Simulation, Decision
from app.models.operations import Vehicle, Route, Order
from app.models.incidents import Incident, IncidentTimeline
from app.models.system import AuditLog, OperationalEvent, EventOutbox
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
from app.auth.dependencies import require_permission
from app.auth.principal import PermissionEnum, RequestPrincipal

router = APIRouter(prefix="/simulations", tags=["Simulations"])

@router.post("/evaluate", response_model=SimulatedMetricsOutput)
async def evaluate_simulation_parameters(req: SimulationEvaluateRequest):
    """
    Authoritative backend physics engine evaluation endpoint.
    Computes aerodynamic drag, rolling resistance, SLA breach probability, and Pareto recommendation score.
    """
    return run_deterministic_simulation(req.base_metrics, req.variables)

INITIAL_SIMULATION_FIXTURE = {
    "id": "sim-901",
    "code": "SIM-SCENARIO-901",
    "title": "I-70 South Highway Bypass Simulation",
    "description": "Hypothetical reroute of Vehicle NX-104 via Denver I-70 South corridor to bypass Interstate 80 blizzard closure.",
    "status": "EVALUATED",
    "incident_id": "inc-8041",
    "variables": {
        "vehicleId": "v-104",
        "alternateRouteType": "I-70_SOUTH_DETOUR",
        "speedDeltaPct": 10.0,
        "fuelCostPerKm": 0.42,
        "priorityReordering": True,
    },
    "baseline_metrics": {
        "totalDistanceKm": 1620.0,
        "avgDurationMins": 940,
        "currentDelayMins": 180,
        "ordersCount": 14,
        "totalOrderValue": 45000.0,
        "baseCostUsd": 1450.0,
        "slaBreachRiskPct": 88.0,
    },
    "simulated_metrics": {
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
            "SLA breach probability reduced from 88.0% baseline down to 12.0% (PREDICTED).",
            "Reliability confidence indexed at 94% based on historical corridor telemetry.",
        ],
    },
    "ai_briefing": "Rerouting NX-104 via the I-70 South corridor recovers 135 minutes with minimal $80 operational fuel surcharge. Highly recommended to preserve AeroTech SLA compliance.",
    "applied_at": None,
    "applied_by": None,
    "workspace_id": "ws-continental-fleet-01",
}

@router.get("", response_model=List[SimulationRead])
async def list_simulations(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all executed What-If simulation scenarios directly from PostgreSQL."""
    ws = workspace_id or "ws-continental-fleet-01"
    stmt = select(Simulation).where(Simulation.workspace_id == ws).order_by(Simulation.created_at.desc())

    result = await db.execute(stmt)
    sims = result.scalars().all()

    if not sims:
        # Seed initial scenario if empty
        s = Simulation(**{**INITIAL_SIMULATION_FIXTURE, "workspace_id": ws})
        db.add(s)
        await db.commit()
        result = await db.execute(select(Simulation).where(Simulation.workspace_id == ws).order_by(Simulation.created_at.desc()))
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
async def get_simulation(sim_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve scenario details with comparative metrics from PostgreSQL."""
    stmt = select(Simulation).where(or_(Simulation.id == sim_id, Simulation.code == sim_id))
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
async def create_simulation(req: SimulationCreate, db: AsyncSession = Depends(get_db)):
    """Evaluate and store a new deterministic What-If simulation scenario in PostgreSQL."""
    sim_id = f"sim-{uuid.uuid4().hex[:8]}"
    sim_code = f"SIM-{int(datetime.now().timestamp()) % 10000}"
    ws_id = req.workspace_id or "ws-continental-fleet-01"

    # Dynamically query target Vehicle, Route, Incident, and Orders from PostgreSQL
    target_vehicle = None
    target_vehicle_id = (req.variables.vehicle_id if req.variables else None) or "v-104"
    if target_vehicle_id:
        v_stmt = select(Vehicle).where(or_(Vehicle.id == target_vehicle_id, Vehicle.code == target_vehicle_id))
        v_res = await db.execute(v_stmt)
        target_vehicle = v_res.scalars().first()

    target_route = None
    if target_vehicle and target_vehicle.current_route_id:
        r_stmt = select(Route).where(Route.id == target_vehicle.current_route_id)
        r_res = await db.execute(r_stmt)
        target_route = r_res.scalars().first()

    target_incident = None
    if req.incident_id:
        inc_stmt = select(Incident).where(or_(Incident.id == req.incident_id, Incident.code == req.incident_id))
        inc_res = await db.execute(inc_stmt)
        target_incident = inc_res.scalars().first()
    elif target_vehicle:
        inc_conds = [
            Incident.affected_entity_id == target_vehicle.id,
            Incident.affected_entity_id == target_vehicle.code,
        ]
        if target_vehicle.current_route_id:
            inc_conds.append(Incident.affected_entity_id == target_vehicle.current_route_id)
        inc_stmt = select(Incident).where(or_(*inc_conds)).order_by(Incident.created_at.desc())
        inc_res = await db.execute(inc_stmt)
        target_incident = inc_res.scalars().first()

    orders_count = 0
    total_order_value = 0.0
    if target_vehicle:
        ord_stmt = select(Order).where(or_(Order.vehicle_id == target_vehicle.id, Order.vehicle_code == target_vehicle.code))
        ord_res = await db.execute(ord_stmt)
        orders = ord_res.scalars().all()
        if orders:
            orders_count = len(orders)
            total_order_value = sum(o.total_cost for o in orders)
    
    if orders_count == 0:
        ws_orders = (await db.execute(select(Order).where(Order.workspace_id == ws_id).limit(20))).scalars().all()
        if ws_orders:
            orders_count = len(ws_orders)
            total_order_value = sum(o.total_cost for o in ws_orders)

    if not target_route:
        target_route = (await db.execute(select(Route).where(Route.workspace_id == ws_id).limit(1))).scalars().first()

    dist = target_route.distance_km if target_route else 1250.0
    dur = target_route.avg_duration_mins if target_route else 750
    delay = target_incident.delay_minutes if target_incident else 0
    fuel_rate = req.variables.fuel_cost_per_km if req.variables and req.variables.fuel_cost_per_km else 0.42
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
        ai_briefing=f"Simulation {req.title} completed: {sim_output.verdict} with {sim_output.recommendation_score}% recommendation score.",
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
        message=f"Simulation scenario {sim_code} evaluated with {sim_output.recommendation_score}% confidence score.",
        occurred_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(event)

    await db.commit()
    await db.refresh(new_sim)

    await broadcaster.broadcast("SIMULATION_EVALUATED", {
        "id": new_sim.id,
        "code": new_sim.code,
        "title": new_sim.title,
        "recommendationScore": sim_output.recommendationScore,
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
    db: AsyncSession = Depends(get_db)
):
    """Re-evaluate / execute a simulation scenario in PostgreSQL."""
    stmt = select(Simulation).where(or_(Simulation.id == sim_id, Simulation.code == sim_id))
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
    sim.ai_briefing = f"Simulation {sim.title} evaluated: {sim_output.verdict} with {sim_output.recommendationScore}% recommendation score."
    sim.version += 1

    event = OperationalEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        workspace_id=sim.workspace_id,
        event_type="simulation.completed",
        severity="INFO",
        entity_type="SIMULATION",
        entity_id=sim.id,
        message=f"Simulation scenario {sim.code} re-run evaluated with {sim_output.recommendationScore}% confidence score.",
        occurred_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(event)

    await db.commit()
    await db.refresh(sim)

    await broadcaster.broadcast("SIMULATION_EVALUATED", {
        "id": sim.id,
        "code": sim.code,
        "title": sim.title,
        "recommendationScore": sim_output.recommendationScore,
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
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.APPLY_DECISION)),
):
    """
    Transactionally apply a validated simulation scenario to live fleet dispatch in PostgreSQL.
    Enforces ACID consistency: updates vehicle route/status, advances incident timeline,
    records Decision, writes AuditLog, publishes EventOutbox, and broadcasts via SSE.
    """
    stmt = select(Simulation).where(or_(Simulation.id == sim_id, Simulation.code == sim_id))
    result = await db.execute(stmt)
    sim = result.scalars().first()
    if not sim:
        raise EntityNotFoundException("Simulation", sim_id)

    if sim.status == "APPLIED":
        # Already applied, idempotent return
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

    now_iso = datetime.now(timezone.utc).isoformat()
    actor_name = req.actor_name or "Sarah Chen"

    # 1. Update Simulation State
    sim.status = "APPLIED"
    sim.applied_at = now_iso
    sim.applied_by = actor_name
    sim.version += 1

    # 2. Update Target Vehicle in PostgreSQL
    target_vehicle_id = (sim.variables or {}).get("vehicleId") or "v-104"
    detour_type = (sim.variables or {}).get("alternateRouteType") or "I-70_SOUTH_DETOUR"
    veh_stmt = select(Vehicle).where(
        or_(
            Vehicle.id == target_vehicle_id,
            Vehicle.code.ilike(f"%{target_vehicle_id}%"),
            Vehicle.code.ilike("%104%")
        )
    )
    veh_res = await db.execute(veh_stmt)
    vehicle = veh_res.scalars().first()
    if vehicle:
        vehicle.status = "IN_TRANSIT"
        vehicle.current_route_name = f"I-70 South Bypass ({detour_type.replace('_', ' ')})"
        vehicle.speed_kmh = 78.5
        vehicle.health_score = 96
        vehicle.version += 1

    # 3. Advance / Resolve Associated Incident in PostgreSQL (only if linked)
    incident = None
    if sim.incident_id:
        inc_res = await db.execute(
            select(Incident).where(or_(Incident.id == sim.incident_id, Incident.code == sim.incident_id))
        )
        incident = inc_res.scalars().first()
    if incident:
        incident.status = "ACTION_APPLIED"
        incident.delay_minutes = (sim.simulated_metrics or {}).get("projectedDelayMins", 45)
        incident.version += 1
        new_tl = IncidentTimeline(
            id=f"tl-{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            status="ACTION_APPLIED",
            note=f"Decision applied from scenario {sim.code}: Detour activated via I-70. Delay reduced to {incident.delay_minutes} mins.",
            actor_name=actor_name,
        )
        db.add(new_tl)

    # 4. Create Decision Record in PostgreSQL
    decision_id = f"dec-{uuid.uuid4().hex[:8]}"
    decision = Decision(
        id=decision_id,
        simulation_id=sim.id,
        incident_id=incident.id if incident else sim.incident_id,
        workspace_id=sim.workspace_id,
        applied_by=actor_name,
        applied_at=now_iso,
        impact_summary=f"Scenario {sim.code} applied. Recovered {(sim.simulated_metrics or {}).get('netTimeSavedMins', 135)} mins delay with ${(sim.simulated_metrics or {}).get('costDeltaUsd', 80):.2f} surcharge.",
        changes_json={
            "simulationCode": sim.code,
            "vehicleId": vehicle.id if vehicle else target_vehicle_id,
            "incidentId": incident.id if incident else sim.incident_id,
            "predictedMetrics": sim.simulated_metrics,
        },
    )
    db.add(decision)

    # 5. Create Audit Log Entry
    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        workspace_id=sim.workspace_id,
        actor_id="usr-sarah-104",
        actor_name=actor_name,
        action="DECISION_APPLIED",
        entity_type="SIMULATION",
        entity_id=sim.id,
        details=f"Operational state transactionally updated from simulation {sim.code} by {actor_name}.",
        metadata_json={
            "decisionId": decision_id,
            "simulationCode": sim.code,
            "appliedAt": now_iso,
        },
    )
    db.add(audit)

    # 6. Create Operational Event & Transactional Outbox
    event = OperationalEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        workspace_id=sim.workspace_id,
        event_type="decision.applied",
        severity="SUCCESS",
        entity_type="SIMULATION",
        entity_id=sim.id,
        message=f"Decision {sim.code} applied by {actor_name}: Reroute detour live.",
        occurred_at=now_iso,
    )
    db.add(event)

    outbox = EventOutbox(
        id=f"out-{uuid.uuid4().hex[:8]}",
        workspace_id=sim.workspace_id,
        event_type="decision.applied",
        aggregate_type="SIMULATION",
        aggregate_id=sim.id,
        payload={
            "decisionId": decision_id,
            "simulationCode": sim.code,
            "actorName": actor_name,
            "appliedAt": now_iso,
            "netTimeSavedMins": (sim.simulated_metrics or {}).get("netTimeSavedMins", 135),
            "costDeltaUsd": (sim.simulated_metrics or {}).get("costDeltaUsd", 80),
        },
    )
    db.add(outbox)

    # 7. Commit Database Transaction
    await db.commit()
    await db.refresh(sim)

    # 8. Broadcast Live Realtime SSE Event
    await broadcaster.broadcast("DECISION_APPLIED", {
        "simulationId": sim.id,
        "simulationCode": sim.code,
        "decisionId": decision_id,
        "actorName": actor_name,
        "appliedAt": now_iso,
        "vehicleId": vehicle.id if vehicle else target_vehicle_id,
        "incidentId": incident.id if incident else sim.incident_id,
        "netTimeSavedMins": (sim.simulated_metrics or {}).get("netTimeSavedMins", 135),
        "costDeltaUsd": (sim.simulated_metrics or {}).get("costDeltaUsd", 80),
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

