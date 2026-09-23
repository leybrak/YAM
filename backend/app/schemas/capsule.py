import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class CapsuleCreate(BaseModel):
    unlock_date: date
    title: str = Field(min_length=1, max_length=200)
    content_text: str | None = Field(default=None, max_length=4000)
    storage_key: str | None = None


class CapsuleRead(BaseModel):
    id: uuid.UUID
    created_by_user_id: uuid.UUID
    unlock_date: date
    title: str
    created_at: datetime
    is_open: bool
    # Set once someone has actually broken the seal (vs. just is_open being
    # true), so the frontend only plays the seal-break animation once.
    opened_at: datetime | None = None
    # Only populated once is_open is true
    content_text: str | None = None
    photo_url: str | None = None
