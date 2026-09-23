import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Entry(UUIDPKMixin, TimestampMixin, Base):
    """A single shared moment/day, owned by the couple (not by one user)."""

    __tablename__ = "entries"

    couple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("couples.id"))
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    location_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    weather: Mapped[str | None] = mapped_column(String(100), nullable=True)
    song: Mapped[str | None] = mapped_column(String(200), nullable=True)
    song_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    photos: Mapped[list["EntryPhoto"]] = relationship(  # noqa: F821
        "EntryPhoto", back_populates="entry", cascade="all, delete-orphan"
    )
    comments: Mapped[list["EntryComment"]] = relationship(  # noqa: F821
        "EntryComment", back_populates="entry", cascade="all, delete-orphan"
    )
    voice_notes: Mapped[list["EntryVoiceNote"]] = relationship(  # noqa: F821
        "EntryVoiceNote", back_populates="entry", cascade="all, delete-orphan"
    )

    @property
    def is_unlocked(self) -> bool:
        """Blind-drop reveal: unlocked once both partners have left their comment."""
        commenters = {c.user_id for c in self.comments}
        return len(commenters) >= 2
