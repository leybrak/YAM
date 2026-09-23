import uuid

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class PhotoSticker(UUIDPKMixin, TimestampMixin, Base):
    """A decorative sticker stamped onto a photo, positioned as a
    percentage (0-100) of the photo's width/height so it stays put
    regardless of how large the photo renders."""

    __tablename__ = "photo_stickers"

    photo_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entry_photos.id"))
    sticker_type: Mapped[str] = mapped_column(String(20), nullable=False)
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    rotation: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    photo: Mapped["EntryPhoto"] = relationship("EntryPhoto", back_populates="stickers")  # noqa: F821
