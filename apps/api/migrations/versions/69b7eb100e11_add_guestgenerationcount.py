"""Add GuestGenerationCount

Revision ID: 69b7eb100e11
Revises: 7c59af6a0001
Create Date: 2026-09-14 14:41:02.677903

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '69b7eb100e11'
down_revision: Union[str, Sequence[str], None] = '7c59af6a0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('guest_generation_count',
    sa.Column('date', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False),
    sa.Column('count', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('date')
    )


def downgrade() -> None:
    op.drop_table('guest_generation_count')
