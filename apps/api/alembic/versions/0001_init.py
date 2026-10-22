"""Initial schema.

Revision ID: 0001
Revises:
Create Date: 2026-10-22
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    from biti.models import Base

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    from biti.models import Base

    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
