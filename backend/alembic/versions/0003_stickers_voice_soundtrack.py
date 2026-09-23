"""stickers, voice notes, soundtrack link

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("entries", sa.Column("song_url", sa.String(500), nullable=True))

    op.create_table(
        "photo_stickers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "photo_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("entry_photos.id"), nullable=False
        ),
        sa.Column("sticker_type", sa.String(20), nullable=False),
        sa.Column("x", sa.Float, nullable=False),
        sa.Column("y", sa.Float, nullable=False),
        sa.Column("rotation", sa.Float, nullable=False, server_default="0"),
    )

    op.create_table(
        "entry_voice_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("entry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("entries.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False),
        sa.Column("duration_seconds", sa.Integer, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("entry_voice_notes")
    op.drop_table("photo_stickers")
    op.drop_column("entries", "song_url")
