import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class NotificationType(str, enum.Enum):
    ENTRY_UNLOCKED = "entry_unlocked"


class Notification(UUIDPKMixin, TimestampMixin, Base):
    """An in-app notice for one user, e.g. 'your partner commented and the
    entry unlocked'. Delivered by polling, not push."""

    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    couple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("couples.id"))
    entry_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entries.id"), nullable=True
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
