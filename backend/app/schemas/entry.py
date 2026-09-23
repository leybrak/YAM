import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class EntryCreate(BaseModel):
    entry_date: date
    title: str | None = Field(default=None, max_length=200)
    location_name: str | None = Field(default=None, max_length=200)
    weather: str | None = Field(default=None, max_length=100)
    song: str | None = Field(default=None, max_length=200)


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


class PhotoCreate(BaseModel):
    storage_key: str
    caption: str | None = Field(default=None, max_length=500)
    taken_at: datetime | None = None


class EntryRead(BaseModel):
    """Shapes the blind-drop rule: the partner's comment/photos are withheld
    until both partners have left their own comment for this entry."""

    id: uuid.UUID
    entry_date: date
    title: str | None
    location_name: str | None
    weather: str | None
    song: str | None
    created_at: datetime
    is_unlocked: bool
    is_favorite: bool
    my_comment: CommentRead | None
    partner_comment: CommentRead | None
    my_photos: list[PhotoRead]
    partner_photos: list[PhotoRead]
