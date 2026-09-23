import uuid
from datetime import datetime

from pydantic import BaseModel, Field

STICKER_TYPES = {"heart", "coffee", "star", "ticket"}


class StickerCreate(BaseModel):
    sticker_type: str = Field(min_length=1, max_length=20)
    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)
    rotation: float = 0


class StickerRead(BaseModel):
    id: uuid.UUID
    sticker_type: str
    x: float
    y: float
    rotation: float
    created_at: datetime

    model_config = {"from_attributes": True}
