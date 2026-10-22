"""Stage badges for checkpoint passes.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-22
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stage_badges",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.String(length=16), nullable=False, server_default="he-ru"),
        sa.Column("stage_id", sa.String(length=32), nullable=False),
        sa.Column("checkpoint_slug", sa.String(length=80), nullable=False),
        sa.Column("awarded_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "course_id", "stage_id", name="uq_stage_badge"),
    )


def downgrade() -> None:
    op.drop_table("stage_badges")
