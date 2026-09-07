"""Voice endpoints: synthesis, transcription, realtime session."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse

from app.core.errors import NotFoundError
from app.modules.auth.router_deps import get_current_user
from app.modules.voice import cache, service
from app.modules.voice.schemas import (
    RealtimeSessionRequest,
    RealtimeSessionResponse,
    SpeakRequest,
    SpeakResponse,
    TranscriptResponse,
)

router = APIRouter(prefix="/v1", tags=["voice"])

# Roughly ten minutes of speech. Past that it is not a question, and Whisper
# charges by the minute.
MAX_AUDIO_BYTES = 25 * 1024 * 1024


@router.post("/tts", response_model=SpeakResponse, summary="Synthesise speech")
async def speak(body: SpeakRequest, user_id: str = Depends(get_current_user)) -> SpeakResponse:
    return await service.speak(body)


@router.get(
    "/tts/audio/{name}",
    summary="Fetch synthesised audio",
    response_class=FileResponse,
)
def audio(name: str) -> FileResponse:
    """Serve a cached mp3.

    Deliberately unauthenticated: the browser fetches this from an `<audio>` tag,
    which sends no Authorization header. The name is a SHA-256 of the text, so it
    is unguessable, and `cache.path_for` rejects anything that is not a name this
    service could have written.
    """
    path = cache.path_for(name)
    if path is None or not path.exists():
        raise NotFoundError("That audio is no longer available.")
    return FileResponse(path, media_type="audio/mpeg")


@router.post("/transcribe", response_model=TranscriptResponse, summary="Transcribe speech")
async def transcribe(
    file: Annotated[UploadFile, File()],
    language: Annotated[str, Form()] = "",
    user_id: str = Depends(get_current_user),
) -> TranscriptResponse:
    audio_bytes = await file.read(MAX_AUDIO_BYTES + 1)
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise service.VoiceUnavailableError("That recording is too long to transcribe.")
    return await service.transcribe(audio_bytes, file.filename or "speech.webm", language or None)


@router.post(
    "/realtime-session",
    response_model=RealtimeSessionResponse,
    summary="Open a live voice consultation",
)
async def realtime_session(
    body: RealtimeSessionRequest, user_id: str = Depends(get_current_user)
) -> RealtimeSessionResponse:
    return await service.create_realtime_session(body)
