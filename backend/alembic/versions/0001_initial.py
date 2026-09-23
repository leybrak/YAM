"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    couple_status = postgresql.ENUM("pending", "linked", name="couple_status", create_type=False)
    couple_status.create(op.get_bind())

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("couple_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "couples",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("invite_code", sa.String(12), nullable=False),
        sa.Column("status", couple_status, nullable=False, server_default="pending"),
        sa.Column("creator_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("linked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_couples_invite_code", "couples", ["invite_code"], unique=True)

    op.create_foreign_key(
        "fk_users_couple_id", "users", "couples", ["couple_id"], ["id"]
    )

    op.create_table(
        "entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("couple_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("couples.id"), nullable=False),
        sa.Column("entry_date", sa.Date, nullable=False),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("location_name", sa.String(200), nullable=True),
        sa.Column("weather", sa.String(100), nullable=True),
        sa.Column("song", sa.String(200), nullable=True),
    )

    op.create_table(
        "entry_comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("entry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("entries.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.UniqueConstraint("entry_id", "user_id", name="uq_comment_entry_user"),
    )

    op.create_table(
        "entry_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("entry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("entries.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False),
        sa.Column("caption", sa.String(500), nullable=True),
        sa.Column("taken_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "time_capsules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("couple_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("couples.id"), nullable=False),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("unlock_date", sa.Date, nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content_text", sa.Text, nullable=True),
        sa.Column("storage_key", sa.String(500), nullable=True),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "favorites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("entry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("entries.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.UniqueConstraint("entry_id", "user_id", name="uq_favorite_entry_user"),
    )


def downgrade() -> None:
    op.drop_table("favorites")
    op.drop_table("time_capsules")
    op.drop_table("entry_photos")
    op.drop_table("entry_comments")
    op.drop_table("entries")
    op.drop_constraint("fk_users_couple_id", "users", type_="foreignkey")
    op.drop_index("ix_couples_invite_code", table_name="couples")
    op.drop_table("couples")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    postgresql.ENUM(name="couple_status").drop(op.get_bind())
