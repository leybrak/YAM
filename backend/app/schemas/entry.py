import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.decoration import DecorationRead
from app.schemas.sticker import StickerRead
from app.schemas.voice_note import VoiceNoteRead


class EntryCreate(BaseModel):
    entry_date: date
    title: str | None = Field(default=None, max_length=200)
    location_name: str | None = Field(default=None, max_length=200)
    weather: str | None = Field(default=None, max_length=100)
    song: str | None = Field(default=None, max_length=200)
    song_url: str | None = Field(default=None, max_length=500)
    # Optional: seals the whole entry (own content included) until this
    # moment — a time capsule built into a regular memory.
    unlock_at: datetime | None = None


class EntryCommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class CommentRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PhotoRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    url: str
    caption: str | None
    taken_at: datetime | None
    created_at: datetime
    stickers: list[StickerRead] = []


class PhotoCreate(BaseModel):
    storage_key: str
    caption: str | None = Field(default=None, max_length=500)
    taken_at: datetime | None = None


class EntryRead(BaseModel):
    """Shapes the blind-drop rule: the partner's comment/photos are withheld
    until both partners have left their own comment for this entry.
    `partner_has_commented` is exposed pre-reveal only as a boolean (never
    the text itself) so the UI can show a sealed/blurred teaser card.

    When `is_time_locked` is true (an `unlock_at` in the future, or not yet
    broken past that point), everything below is withheld — even the
    author's own content — until POST /break-seal succeeds."""

    id: uuid.UUID
    entry_date: date
    title: str | None
    location_name: str | None
    weather: str | None
    song: str | None
    song_url: str | None
    created_at: datetime
    unlock_at: datetime | None
    is_time_locked: bool
    is_unlocked: bool
    is_favorite: bool
    partner_has_commented: bool
    my_comment: CommentRead | None
    partner_comment: CommentRead | None
    my_photos: list[PhotoRead]
    partner_photos: list[PhotoRead]
    my_voice_notes: list[VoiceNoteRead]
    partner_voice_notes: list[VoiceNoteRead]
    decorations: list[DecorationRead]
