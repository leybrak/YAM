import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Favorite(UUIDPKMixin, TimestampMixin, Base):
    """Marks an entry as a favorite for a user — feeds the anniversary summary."""

    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("entry_id", "user_id", name="uq_favorite_entry_user"),)

    entry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entries.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
