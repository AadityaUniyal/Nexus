import json
import logging
from typing import Dict, Any, Optional
import httpx
try:
    from groq import AsyncGroq
except ImportError:
    AsyncGroq = None
from app.core.config import settings
from app.voice.schemas import VoiceCommandRequest, VoiceCommandResponse, VoiceToolCall

logger = logging.getLogger("nexus.voice")

class VoiceAgentService:
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY
        self.groq_model = settings.GROQ_MODEL
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.gemini_model = settings.GEMINI_MODEL

        self.client = None
        if self.groq_api_key:
            try:
                self.client = AsyncGroq(api_key=self.groq_api_key)
            except Exception:
                self.client = None

    async def _call_gemini_voice(self, transcript: str, system_prompt: str) -> Optional[str]:
        """Secondary fallback LLM for conversational voice response via Google Gemini REST API."""
        if not self.gemini_api_key:
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_api_key}"
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": transcript}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 200,
            }
        }
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            text = parts[0]["text"].strip()
                            if text:
                                logger.info("Successfully generated voice response via Gemini fallback.")
                                return text
        except Exception as e:
            logger.warning(f"Gemini voice failover error: {e}")
        return None

    async def process_spoken_command(self, req: VoiceCommandRequest) -> VoiceCommandResponse:
        """Process spoken operator query using Groq tool calling with Gemini secondary failover."""
        fallback_speech = "NEXUS tactical dispatch standing by. Please state your command."
        
        if not req.transcript:
            return VoiceCommandResponse(
                speech_response=fallback_speech,
                action_type="STANDBY",
            )

        system_prompt = (
            "You are the NEXUS voice assistant. You cannot read live workspace data or execute operational changes. "
            "Never claim to have checked fleet status, moved a map, run a simulation, or changed dispatch. "
            "Explain this limitation clearly when asked for those actions. Keep responses concise."
        )

        candidate_models = [self.groq_model, "llama-3.3-70b-versatile"] if self.groq_model != "llama-3.3-70b-versatile" else ["llama-3.3-70b-versatile"]

        # 1. Try Groq Primary
        if self.client:
            for model_name in candidate_models:
                try:
                    response = await self.client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": req.transcript},
                        ],
                        temperature=0.2,
                        max_tokens=250,
                    )

                    msg = response.choices[0].message

                    # Direct conversation response without tools
                    content = msg.content.strip() if msg.content else fallback_speech
                    return VoiceCommandResponse(
                        speech_response=content,
                        action_type="CONVERSATION",
                        confidence=0.95,
                    )

                except Exception as e:
                    logger.warning(f"Groq voice completion error: {e}. Initiating Gemini fallback...")
                    break

        # 2. Try Gemini Secondary Fallback for conversation
        gemini_speech = await self._call_gemini_voice(req.transcript, system_prompt)
        if gemini_speech:
            return VoiceCommandResponse(
                speech_response=gemini_speech,
                action_type="CONVERSATION",
                confidence=0.90,
            )

        return VoiceCommandResponse(
            speech_response="Voice actions are unavailable until workspace-scoped command execution is configured. No operational change was made.",
            action_type="UNAVAILABLE",
        )

voice_agent_service = VoiceAgentService()
