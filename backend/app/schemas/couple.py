import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.couple import CoupleStatus
from app.schemas.user import UserRead


class CoupleInvite(BaseModel):
    invite_code: str
    status: CoupleStatus


class CoupleJoin(BaseModel):
    invite_code: str = Field(min_length=4, max_length=12)


class CoupleRead(BaseModel):
    id: uuid.UUID
    status: CoupleStatus
    invite_code: str
    linked_at: datetime | None
    members: list[UserRead]

    model_config = {"from_attributes": True}
