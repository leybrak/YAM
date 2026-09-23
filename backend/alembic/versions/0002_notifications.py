"""notifications

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    notification_type = postgresql.ENUM("entry_unlocked", name="notification_type", create_type=False)
    notification_type.create(op.get_bind())

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("couple_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("couples.id"), nullable=False),
        sa.Column("entry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("entries.id"), nullable=True),
        sa.Column("type", notification_type, nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_notifications_user_unread", "notifications", ["user_id", "read_at"])


def downgrade() -> None:
    op.drop_index("ix_notifications_user_unread", table_name="notifications")
    op.drop_table("notifications")
    postgresql.ENUM(name="notification_type").drop(op.get_bind())
