import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class EntryVoiceNote(UUIDPKMixin, TimestampMixin, Base):
    """A short (<=30s) voice memo recorded in-browser for an entry."""

    __tablename__ = "entry_voice_notes"

    entry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entries.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)

    entry: Mapped["Entry"] = relationship("Entry", back_populates="voice_notes")  # noqa: F821
