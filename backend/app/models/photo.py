import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class EntryPhoto(UUIDPKMixin, TimestampMixin, Base):
    """A photo uploaded by one of the two partners for a given entry."""

    __tablename__ = "entry_photos"

    entry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entries.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(500), nullable=True)
    taken_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    entry: Mapped["Entry"] = relationship("Entry", back_populates="photos")  # noqa: F821
    stickers: Mapped[list["PhotoSticker"]] = relationship(  # noqa: F821
        "PhotoSticker", back_populates="photo", cascade="all, delete-orphan"
    )
