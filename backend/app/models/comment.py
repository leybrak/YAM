import uuid

from sqlalchemy import ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class EntryComment(UUIDPKMixin, TimestampMixin, Base):
    """'Lo que más me gustó hoy' — one per user per entry, hidden until both exist."""

    __tablename__ = "entry_comments"
    __table_args__ = (UniqueConstraint("entry_id", "user_id", name="uq_comment_entry_user"),)

    entry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entries.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    text: Mapped[str] = mapped_column(Text, nullable=False)

    entry: Mapped["Entry"] = relationship("Entry", back_populates="comments")  # noqa: F821
