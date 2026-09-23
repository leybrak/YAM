import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationRead(BaseModel):
    id: uuid.UUID
    type: NotificationType
    message: str
    entry_id: uuid.UUID | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UnreadCount(BaseModel):
    count: int
