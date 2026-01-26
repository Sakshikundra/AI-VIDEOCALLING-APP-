import asyncio
import os
import logging
from uuid import uuid4
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ================================
# Vision Agents (UPDATED IMPORTS)
# ================================
from vision_agents.core import agents
from vision_agents.plugins import getstream, gemini
from vision_agents.core.edge.types import User

# ================================
# Events
# ================================
from vision_agents.core.events import (
    CallSessionParticipantJoinedEvent,
    CallSessionParticipantLeftEvent,
    CallSessionStartedEvent,
    CallSessionEndedEvent,
    PluginErrorEvent,
)

from vision_agents.core.llm.events import (
    RealtimeUserSpeechTranscriptionEvent,
    LLMResponseChunkEvent,
)

# ================================
# Setup
# ================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("meeting-assistant")

load_dotenv()

# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

meeting_agents = {}

# ================================
# Agent
# ================================
async def start_agent(call_id: str):
    logger.info(f"🚀 Starting Meeting Assistant for call: {call_id}")

    agent = agents.Agent(
        edge=getstream.Edge(),
        agent_user=User(
            id="meeting-assistant-bot",
            name="Meeting Assistant",
        ),
        instructions="""
You are a meeting transcription bot.

CRITICAL RULES:
1. NEVER speak unless someone says "Hey Assistant"
2. NEVER respond to normal conversation
3. ONLY answer questions starting with "Hey Assistant"

Your job:
- Transcribe everything
- Stay silent
- Answer ONLY when triggered
""",
        llm=gemini.Realtime(fps=0),
    )

    meeting_agents[call_id] = {
        "agent": agent,
        "is_active": False,
        "transcript": []
    }

    # ================================
    # Events
    # ================================
    @agent.events.subscribe
    async def on_session_started(event: CallSessionStartedEvent):
        meeting_agents[call_id]["is_active"] = True
        logger.info(f"🎙️ Meeting {call_id} started")

    @agent.events.subscribe
    async def on_participant_joined(event: CallSessionParticipantJoinedEvent):
        if event.participant.user.id != "meeting-assistant-bot":
            logger.info(f"👤 Joined: {event.participant.user.name}")

    @agent.events.subscribe
    async def on_participant_left(event: CallSessionParticipantLeftEvent):
        if event.participant.user.id != "meeting-assistant-bot":
            logger.info(f"👋 Left: {event.participant.user.name}")

    @agent.events.subscribe
    async def on_transcript(event: RealtimeUserSpeechTranscriptionEvent):
        if not event.text:
            return

        text = event.text.strip()
        speaker = getattr(event, "participant_id", "Unknown")

        meeting_agents[call_id]["transcript"].append(
            {"speaker": speaker, "text": text}
        )

        logger.info(f"📝 [{speaker}] {text}")

        if text.lower().startswith("hey assistant"):
            question = text[len("hey assistant"):].strip()
            if not question:
                return

            context = "\n".join(
                f"[{e['speaker']}] {e['text']}"
                for e in meeting_agents[call_id]["transcript"]
            )

            prompt = f"""
MEETING TRANSCRIPT:
{context}

QUESTION:
{question}

Answer ONLY using the transcript.
Be short and factual.
"""

            await agent.simple_response(prompt)

    @agent.events.subscribe
    async def on_llm_response(event: LLMResponseChunkEvent):
        if event.delta:
            logger.info(f"🤖 {event.delta}")

    @agent.events.subscribe
    async def on_session_ended(event: CallSessionEndedEvent):
        meeting_agents[call_id]["is_active"] = False
        logger.info(f"🛑 Meeting {call_id} ended")

    @agent.events.subscribe
    async def on_error(event: PluginErrorEvent):
        logger.error(f"❌ Plugin error: {event.error_message}")

    # ================================
    # Start Agent
    # ================================
    try:
        await agent.create_user()
        call = agent.edge.client.video.call("default", call_id)
        logger.info(f"✅ Joining call {call_id}...")
        
        async with agent.join(call):
            logger.info(f"🎧 Assistant ACTIVE for {call_id}")
            await agent.finish()
            
        logger.info(f"✅ Agent finished for {call_id}")
    except Exception as e:
        logger.error(f"❌ Error starting agent: {e}")
        if call_id in meeting_agents:
            del meeting_agents[call_id]

# ================================
# API Endpoints
# ================================

@app.post("/start-assistant")
async def start_assistant_endpoint(request: dict):
    """Start the meeting assistant for a call"""
    try:
        call_id = request.get("call_id")
        if not call_id:
            return JSONResponse({"error": "call_id is required"}, status_code=400)
        
        # Start the agent in the background
        asyncio.create_task(start_agent(call_id))
        
        return JSONResponse({
            "status": "success",
            "message": f"Meeting assistant started for call {call_id}"
        })
    except Exception as e:
        logger.error(f"Error starting assistant: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/transcript/{call_id}")
async def get_transcript(call_id: str):
    """Get the transcript for a call"""
    try:
        if call_id not in meeting_agents:
            return JSONResponse({"transcript": []})
        
        transcript = meeting_agents[call_id].get("transcript", [])
        return JSONResponse({"transcript": transcript})
    except Exception as e:
        logger.error(f"Error getting transcript: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/status/{call_id}")
async def get_status(call_id: str):
    """Get the status of a meeting"""
    try:
        if call_id not in meeting_agents:
            return JSONResponse({"status": "not_found"})
        
        is_active = meeting_agents[call_id].get("is_active", False)
        return JSONResponse({
            "call_id": call_id,
            "is_active": is_active,
            "status": "active" if is_active else "inactive"
        })
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.on_event("startup")
async def startup_event():
    logger.info("✨ Meeting Assistant Backend Started")

# ================================
# Main
# ================================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
