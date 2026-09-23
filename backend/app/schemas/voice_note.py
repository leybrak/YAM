import uuid
from datetime import datetime

from pydantic import BaseModel, Field

MAX_VOICE_NOTE_SECONDS = 30


class VoiceNoteCreate(BaseModel):
    storage_key: str
    duration_seconds: int = Field(gt=0, le=MAX_VOICE_NOTE_SECONDS)


class VoiceNoteRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    url: str
    duration_seconds: int
    created_at: datetime
