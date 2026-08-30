"""
NEXUS Tactical Voice Bot using native Pipecat AI Framework.
Integrates Pipecat pipeline frames with Groq LLaMA-3.3-70B tool calling for freight and spatial dispatch.
"""

import os
import asyncio
from typing import Dict, Any, Optional
from loguru import logger

from pipecat.pipeline.pipeline import Pipeline
from pipecat.frames.frames import (
    Frame,
    TextFrame,
    LLMFullResponseStartFrame,
    LLMFullResponseEndFrame,
    EndFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from app.core.config import settings
from app.voice.tools import execute_voice_tool
from app.voice.service import voice_agent_service
from app.voice.schemas import VoiceCommandRequest

class NexusDispatchProcessor(FrameProcessor):
    """Pipecat FrameProcessor that routes operator voice text frames into NEXUS tools."""

    def __init__(self):
        super().__init__()

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TextFrame):
            logger.info(f"[Pipecat Voice Frame Received]: {frame.text}")
            
            req = VoiceCommandRequest(transcript=frame.text)
            resp = await voice_agent_service.process_spoken_command(req)
            
            # Emit processed text frame forward in the pipeline
            await self.push_frame(LLMFullResponseStartFrame())
            await self.push_frame(TextFrame(text=resp.speech_response))
            await self.push_frame(LLMFullResponseEndFrame())
        else:
            await self.push_frame(frame, direction)

async def run_pipecat_session(input_text: str) -> str:
    """Run a single Pipecat frame processor execution."""
    processor = NexusDispatchProcessor()
    pipeline = Pipeline([processor])
    
    # Process text frame directly through Pipecat Frame Processor
    await processor.process_frame(TextFrame(text=input_text), FrameDirection.DOWNSTREAM)
    await processor.process_frame(EndFrame(), FrameDirection.DOWNSTREAM)
    
    req = VoiceCommandRequest(transcript=input_text)
    res = await voice_agent_service.process_spoken_command(req)
    return res.speech_response

if __name__ == "__main__":
    test_phrase = "NEXUS, simulate an I-70 detour for vehicle NX-104"
    output = asyncio.run(run_pipecat_session(test_phrase))
    print(f"Pipecat Output: {output}")
