import uuid

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class EntryDecoration(UUIDPKMixin, TimestampMixin, Base):
    """A sticker stamped directly on the notebook-paper background of an
    entry (as opposed to PhotoSticker, which sits on a specific photo)."""

    __tablename__ = "entry_decorations"

    entry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entries.id"))
    sticker_type: Mapped[str] = mapped_column(String(20), nullable=False)
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    rotation: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    entry: Mapped["Entry"] = relationship("Entry", back_populates="decorations")  # noqa: F821
