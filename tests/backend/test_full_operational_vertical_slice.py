import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import async_session_factory
from sqlalchemy import select
from app.models.operations import Vehicle
from app.models.incidents import Incident
from app.models.simulations import Simulation, Decision
from app.models.system import AuditLog
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_full_operational_vertical_slice_integration():
    """
    Test complete vertical integration:
    1. Real Health check
    2. Vehicle query from PostgreSQL
    3. Incident creation with timeline & event
    4. Deterministic simulation execution & persistence
    5. Transactional decision apply: vehicle state update, incident advance, decision record & audit log
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check verifies real DB connectivity
        h_res = await client.get("/health/ready")
        assert h_res.status_code == 200
        h_data = h_res.json()
        assert h_data["status"] in ["READY", "DEGRADED"]
        assert "database" in h_data

        # 2. Query vehicles from DB
        v_res = await client.get("/api/v1/operations/vehicles")
        assert v_res.status_code == 200
        vehicles = v_res.json()
        assert len(vehicles) > 0
        v104 = next((v for v in vehicles if "104" in v["code"]), vehicles[0])
        target_veh_code = v104["code"]

        # 3. Create a real incident in PostgreSQL
        inc_payload = {
            "title": "Severe Snowfall on Mountain Corridor",
            "summary": "Sudden 4-inch accumulation causing 60-minute holding pattern.",
            "severity": "CRITICAL",
            "affected_entity_type": "VEHICLE",
            "affected_entity_id": v104["id"],
            "affected_entity_name": f"Vehicle {target_veh_code}",
            "delay_minutes": 120,
            "cost_estimate": 8500.0,
            "root_cause": "Corridor meteorological sensor alert",
            "ai_analysis": "Reroute via bypass recommended.",
        }
        inc_res = await client.post("/api/v1/incidents", json=inc_payload)
        assert inc_res.status_code == 201
        inc_data = inc_res.json()
        assert inc_data["status"] == "DETECTED"
        assert len(inc_data["timeline"]) >= 1
        created_inc_id = inc_data["id"]

        # 4. Run deterministic simulation
        sim_payload = {
            "title": f"Bypass Detour for {target_veh_code}",
            "description": "Simulation evaluating I-70 South Highway corridor.",
            "incident_id": created_inc_id,
            "variables": {
                "vehicleId": v104["id"],
                "alternateRouteType": "I-70_SOUTH_DETOUR",
                "speedDeltaPct": 10.0,
                "fuelCostPerKm": 0.42,
                "priorityReordering": True,
            },
        }
        sim_res = await client.post("/api/v1/simulations", json=sim_payload)
        assert sim_res.status_code == 201
        sim_data = sim_res.json()
        sim_metrics = sim_data.get("simulated_metrics") or sim_data.get("simulatedMetrics") or {}
        time_saved = sim_metrics.get("net_time_saved_mins") or sim_metrics.get("netTimeSavedMins", 0)
        rec_score = sim_metrics.get("recommendation_score") or sim_metrics.get("recommendationScore", 0)
        assert time_saved > 0
        assert rec_score >= 80
        created_sim_id = sim_data["id"]

        # 5. Apply the decision transactionally
        apply_payload = {
            "actor_name": "Marcus Vance",
            "notes": "Authorized emergency bypass reroute.",
        }
        dispatch_token = create_access_token(
            subject="usr-marcus-vance",
            extra_claims={"email": "marcus.vance@nexus.continental", "name": "Marcus Vance", "role": "OPERATIONS_MANAGER"}
        )
        apply_res = await client.post(
            f"/api/v1/simulations/{created_sim_id}/apply-decision",
            json=apply_payload,
            headers={"Authorization": f"Bearer {dispatch_token}"}
        )
        assert apply_res.status_code == 200
        applied_sim = apply_res.json()
        assert applied_sim["status"] == "APPLIED"
        assert (applied_sim.get("applied_by") or applied_sim.get("appliedBy")) == "Marcus Vance"

        # Verify DB states directly using SQLAlchemy
        async with async_session_factory() as session:
            # Check vehicle was updated
            veh_db = (await session.execute(
                select(Vehicle).where(Vehicle.id == v104["id"])
            )).scalars().first()
            assert veh_db is not None
            assert veh_db.status == "IN_TRANSIT"
            assert "I-70" in veh_db.current_route_name or "REROUTED" in veh_db.current_route_name

            # Check decision was persisted
            dec_db = (await session.execute(
                select(Decision).where(Decision.simulation_id == created_sim_id)
            )).scalars().first()
            assert dec_db is not None
            assert dec_db.applied_by == "Marcus Vance"

            # Check audit log was written
            audit_db = (await session.execute(
                select(AuditLog).where(AuditLog.entity_id == created_sim_id)
            )).scalars().first()
            assert audit_db is not None
            assert audit_db.action == "DECISION_APPLIED"

            # Check incident was advanced
            inc_db = (await session.execute(
                select(Incident).where(Incident.id == created_inc_id)
            )).scalars().first()
            assert inc_db is not None
            assert inc_db.status == "ACTION_APPLIED"
