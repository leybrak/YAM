"""time-sealed entries (unlock_at) and page-level sticker decorations

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("entries", sa.Column("unlock_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("entries", sa.Column("sealed_opened_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "entry_decorations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("entry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("entries.id"), nullable=False),
        sa.Column("sticker_type", sa.String(20), nullable=False),
        sa.Column("x", sa.Float, nullable=False),
        sa.Column("y", sa.Float, nullable=False),
        sa.Column("rotation", sa.Float, nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_table("entry_decorations")
    op.drop_column("entries", "sealed_opened_at")
    op.drop_column("entries", "unlock_at")
