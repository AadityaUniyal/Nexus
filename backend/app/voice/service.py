import json
from typing import Dict, Any, Optional
from groq import AsyncGroq
from app.core.config import settings
from app.voice.schemas import VoiceCommandRequest, VoiceCommandResponse, VoiceToolCall
from app.voice.tools import VOICE_TOOLS_SPEC, execute_voice_tool

class VoiceAgentService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.client = None
        if self.api_key:
            try:
                self.client = AsyncGroq(api_key=self.api_key)
            except Exception:
                self.client = None

    async def process_spoken_command(self, req: VoiceCommandRequest) -> VoiceCommandResponse:
        """Process spoken operator query using Groq tool calling."""
        fallback_speech = "NEXUS tactical dispatch standing by. Please state your command."
        
        if not req.transcript:
            return VoiceCommandResponse(
                speech_response=fallback_speech,
                action_type="STANDBY",
            )

        system_prompt = (
            "You are the NEXUS Tactical Dispatch Voice Copilot. You assist logistics operations managers "
            "with fleet command, spatial navigation, What-If simulation modeling, and incident triage. "
            "Always call appropriate tools when the user requests a map movement, simulation run, or fleet query. "
            "Keep your verbal responses concise, crisp, and tactical (1-2 sentences maximum)."
        )

        candidate_models = [
            self.model,
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "llama3-70b-8192",
            "llama3-8b-8192",
        ]

        if self.client:
            for model_name in candidate_models:
                try:
                    response = await self.client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": req.transcript},
                        ],
                        tools=VOICE_TOOLS_SPEC,
                        tool_choice="auto",
                        temperature=0.2,
                        max_tokens=250,
                    )

                    msg = response.choices[0].message

                    # If tool calls were made by Groq
                    if msg.tool_calls and len(msg.tool_calls) > 0:
                        t_call = msg.tool_calls[0]
                        tool_name = t_call.function.name
                        tool_args = json.loads(t_call.function.arguments or "{}")
                        
                        tool_result = await execute_voice_tool(tool_name, tool_args)
                        
                        return VoiceCommandResponse(
                            speech_response=tool_result.get("speech", "Action executed."),
                            action_type=tool_result.get("action", "TOOL_EXECUTED"),
                            action_payload=tool_result,
                            tool_calls=[VoiceToolCall(name=tool_name, arguments=tool_args)],
                            confidence=0.99,
                        )

                    # Direct conversation response without tools
                    content = msg.content.strip() if msg.content else fallback_speech
                    return VoiceCommandResponse(
                        speech_response=content,
                        action_type="CONVERSATION",
                        confidence=0.95,
                    )

                except Exception:
                    continue

        # Deterministic regex / intent fallback
        t_low = req.transcript.lower()
        if "fly" in t_low or "map" in t_low or "chicago" in t_low or "dehradun" in t_low or "denver" in t_low:
            loc = "Dehradun" if "dehradun" in t_low else "Denver" if "denver" in t_low else "Chicago"
            res = await execute_voice_tool("map_fly_to", {"location_name": loc})
            return VoiceCommandResponse(
                speech_response=res["speech"],
                action_type=res["action"],
                action_payload=res,
            )
        elif "simulat" in t_low or "detour" in t_low:
            res = await execute_voice_tool("run_whatif_simulation", {"vehicle_code": "NX-104", "detour_route": "I-70_SOUTH_DETOUR"})
            return VoiceCommandResponse(
                speech_response=res["speech"],
                action_type=res["action"],
                action_payload=res,
            )

        return VoiceCommandResponse(
            speech_response=f"Tactical dispatch received: '{req.transcript}'. Standing by for operational confirmation.",
            action_type="ACKNOWLEDGED",
        )

voice_agent_service = VoiceAgentService()
