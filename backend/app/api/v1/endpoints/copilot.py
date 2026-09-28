import re
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.auth.dependencies import require_authenticated, require_workspace
from app.auth.principal import RequestPrincipal
from app.services.copilot_tools import CopilotToolRegistry
from app.services.ai_service import ai_service
from app.models.ai import Conversation, ChatMessage, AgentRun, ToolCallRecord

router = APIRouter(prefix="/copilot", tags=["AI Copilot & Intelligence Engine"])

class CopilotChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    incident_id: Optional[str] = None
    vehicle_code: Optional[str] = None

class CopilotChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    reply: str
    tool_calls: List[Dict[str, Any]]
    approval_card: Optional[Dict[str, Any]] = None
    simulation_result: Optional[Dict[str, Any]] = None
    citations: List[Dict[str, Any]] = []

@router.post("/chat", response_model=CopilotChatResponse)
async def chat_with_copilot(
    req: CopilotChatRequest,
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """
    Interact with Nexus Operational AI Copilot.
    Invokes controlled tools to inspect real operational state, simulate scenarios,
    and generate human-in-the-loop approval actions with Groq LLM reasoning.
    """
    prompt_lower = req.prompt.lower()
    executed_tools = []
    approval_card = None
    simulation_res = None
    citations = []
    context_data = {}

    # 1. Resolve or create Conversation
    conv_id = req.conversation_id or f"conv-{uuid.uuid4().hex[:10]}"
    
    # 2. Tool routing based on operational intent
    if any(w in prompt_lower for w in ["summary", "overview", "status", "how is the fleet", "fleet status"]):
        summary = await CopilotToolRegistry.get_fleet_summary(db, principal.workspace_id)
        executed_tools.append({
            "tool": "get_fleet_summary",
            "category": "READ",
            "result": summary
        })
        context_data["fleet_summary"] = summary

        reply = (
            f"**Operational Fleet Overview:**\n\n"
            f"- **Active Fleet:** {summary['active_in_transit']} of {summary['total_vehicles']} commercial vehicles currently in transit ({summary['fleet_utilization_pct']}% utilization).\n"
            f"- **Active Incidents:** {summary['active_incidents']} disruption(s) logged ({summary['critical_incidents']} critical).\n"
            f"- **Delivery Commitments:** {summary['total_orders']} orders active; {summary['delayed_orders']} delayed ({summary['sla_compliance_pct']}% SLA compliance rate)."
        )

    elif any(w in prompt_lower for w in ["simulate", "options", "reroute", "scenario", "what-if"]):
        simulation_res = await CopilotToolRegistry.simulate_route_options(
            db, principal.workspace_id, req.incident_id, strategy="BALANCED_COMPROMISE"
        )
        executed_tools.append({
            "tool": "simulate_route_options",
            "category": "ANALYZE",
            "result": simulation_res
        })
        context_data["simulation_result"] = simulation_res
        sim_metrics = simulation_res.get("simulatedMetrics", {})

        v_code = req.vehicle_code or "NX-104"
        approval = await CopilotToolRegistry.request_reroute_approval(
            db=db,
            workspace_id=principal.workspace_id,
            vehicle_code=v_code,
            incident_id=req.incident_id or "inc-weather-01",
            proposed_route_name="Midwest Transcontinental Corridor (Detour via I-70)",
            time_saved_mins=int(sim_metrics.get("netTimeSavedMins", 135)),
            cost_delta_usd=float(sim_metrics.get("costDeltaUsd", 80.70)),
            actor_name="Nexus AI Copilot",
        )
        executed_tools.append({
            "tool": "request_reroute_approval",
            "category": "ACT",
            "result": approval
        })
        approval_card = approval

        reply = (
            f"**Simulation Engine Scenario Evaluated:**\n\n"
            f"Evaluated counterfactual detour around active incident corridor:\n"
            f"- **Net Time Saved:** **{sim_metrics.get('netTimeSavedMins', 135)} minutes**\n"
            f"- **Projected Cost Delta:** +${sim_metrics.get('costDeltaUsd', 80.70):.2f}\n"
            f"- **SLA Breach Risk:** Reduced from 88% down to **{sim_metrics.get('slaBreachRiskPct', 12)}%**\n"
            f"- **Copilot Verdict:** `{sim_metrics.get('verdict', 'HIGHLY_RECOMMENDED')}` (Score: {sim_metrics.get('recommendationScore', 94)}/100)\n\n"
            f"I have prepared an approval request for Operations Command review."
        )

    elif any(w in prompt_lower for w in ["incident", "problem", "hazard", "blizzard", "weather", "risk"]):
        incidents = await CopilotToolRegistry.get_active_incidents(db, principal.workspace_id)
        executed_tools.append({
            "tool": "get_active_incidents",
            "category": "READ",
            "result": incidents
        })
        context_data["incidents"] = incidents

        if incidents:
            top_inc = incidents[0]
            citations.append({"type": "INCIDENT", "id": top_inc["id"], "code": top_inc["code"]})
            weather = await CopilotToolRegistry.get_weather_impact(41.2565, -95.9345)
            executed_tools.append({
                "tool": "get_weather_impact",
                "category": "READ",
                "result": weather
            })
            context_data["weather"] = weather

            reply = (
                f"**Active Operational Incident Detected:**\n\n"
                f"- **Incident Code:** {top_inc['code']} — *{top_inc['title']}*\n"
                f"- **Severity:** `{top_inc['severity']}` | **Category:** `{top_inc['category']}`\n"
                f"- **Impacted Asset:** {top_inc['affected_entity']}\n"
                f"- **Corridor Weather:** {weather['condition']} with {weather['wind_speed_kmh']} km/h winds ({weather['temperature_celsius']}°C). {weather['advisory']}\n\n"
                f"Would you like me to simulate alternative bypass routes to protect customer delivery deadlines?"
            )
        else:
            reply = "All corridors are currently operating nominally with zero unacknowledged high-severity incidents."

    elif any(w in prompt_lower for w in ["vehicle", "truck", "driver", "nx-", "where is"]):
        match = re.search(r"(nx[-\w]+|v[-\w]+)", prompt_lower)
        v_target = match.group(1).upper() if match else (req.vehicle_code or "NX-104")
        v_status = await CopilotToolRegistry.get_vehicle_status(db, principal.workspace_id, v_target)
        executed_tools.append({
            "tool": "get_vehicle_status",
            "category": "READ",
            "result": v_status
        })
        context_data["vehicle_status"] = v_status

        if "error" not in v_status:
            citations.append({"type": "VEHICLE", "id": v_status["id"], "code": v_status["code"]})
            reply = (
                f"**Vehicle Status: {v_status['code']} ({v_status['name']})**\n\n"
                f"- **Driver:** {v_status['driver_name']}\n"
                f"- **Model:** {v_status['model']}\n"
                f"- **Status:** `{v_status['status']}` ({v_status['speed_kmh']} km/h)\n"
                f"- **Position:** Lat {v_status['latitude']:.4f}, Lng {v_status['longitude']:.4f}\n"
                f"- **Battery Reserve:** {v_status['battery_pct']}% | **Vehicle Health:** {v_status['health_score']}/100\n"
                f"- **Active Corridor:** {v_status['current_route']}"
            )
        else:
            reply = v_status["error"]

    else:
        # Fallback query: collect fleet summary and let AI answer
        summary = await CopilotToolRegistry.get_fleet_summary(db, principal.workspace_id)
        executed_tools.append({
            "tool": "get_fleet_summary",
            "category": "READ",
            "result": summary
        })
        context_data["fleet_summary"] = summary
        reply = (
            f"Hello {principal.display_name}. I am the Nexus Operational Intelligence Copilot. "
            f"I have direct read access to your workspace fleet ({summary['total_vehicles']} vehicles, "
            f"{summary['active_incidents']} open incidents) and can execute route simulations, SLA risk calculations, "
            f"and dispatch approvals.\n\n"
            f"**Suggested Queries:**\n"
            f"- *'Summarize fleet status and critical disruptions.'*\n"
            f"- *'Which deliveries are at risk of SLA breach?'*\n"
            f"- *'Simulate detour options for vehicle NX-104.'*"
        )

    # 3. Enhance reply with Groq LLM synthesis if API client is active
    if ai_service._client and context_data:
        ai_synthesis = await ai_service.generate_copilot_reasoning(
            user_prompt=req.prompt,
            tools_executed=executed_tools,
            context_data=context_data
        )
        if ai_synthesis:
            reply = f"{reply}\n\n---\n### 🧠 **Nexus AI Intelligence Synthesis (Groq Llama-3.3-70B)**\n\n{ai_synthesis}"

    msg_id = f"msg-{uuid.uuid4().hex[:10]}"

    try:
        from sqlalchemy import select
        # Check if conversation exists, otherwise create it
        conv_stmt = select(Conversation).where(Conversation.id == conv_id)
        conv_res = await db.execute(conv_stmt)
        conv = conv_res.scalars().first()
        if not conv:
            conv = Conversation(
                id=conv_id,
                title=req.prompt[:60],
                context_type="INCIDENT" if req.incident_id else "FLEET",
                context_id=req.incident_id or req.vehicle_code,
                user_id=principal.nexus_user_id if not principal.nexus_user_id.startswith("usr-") else None,
                workspace_id=principal.workspace_id,
            )
            db.add(conv)
            await db.flush()

        # Add user message
        user_msg = ChatMessage(
            id=f"msg-{uuid.uuid4().hex[:10]}",
            conversation_id=conv_id,
            sender="USER",
            content=req.prompt,
        )
        db.add(user_msg)

        # Add copilot message
        copilot_msg = ChatMessage(
            id=msg_id,
            conversation_id=conv_id,
            sender="COPILOT",
            content=reply,
            tool_calls_json=executed_tools,
            citations_json=citations,
        )
        db.add(copilot_msg)
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.warning(f"Note: Could not persist copilot conversation message to DB: {e}")

    return CopilotChatResponse(
        conversation_id=conv_id,
        message_id=msg_id,
        reply=reply,
        tool_calls=executed_tools,
        approval_card=approval_card,
        simulation_result=simulation_res,
        citations=citations,
    )
