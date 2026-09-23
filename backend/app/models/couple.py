import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class CoupleStatus(str, enum.Enum):
    PENDING = "pending"  # invite code generated, waiting for partner
    LINKED = "linked"  # both members joined


class Couple(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "couples"

    invite_code: Mapped[str] = mapped_column(String(12), unique=True, index=True, nullable=False)
    status: Mapped[CoupleStatus] = mapped_column(
        Enum(CoupleStatus, name="couple_status", values_callable=lambda e: [m.value for m in e]),
        default=CoupleStatus.PENDING,
        nullable=False,
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    linked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    members: Mapped[list["User"]] = relationship(  # noqa: F821
        "User", back_populates="couple", foreign_keys="User.couple_id"
    )
