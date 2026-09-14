"""Add period_rashifal table

Revision ID: 7c59af6a0001
Revises: 6f7b97291ee8
Create Date: 2026-09-14 14:06:01.315840

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '7c59af6a0001'
down_revision: Union[str, Sequence[str], None] = '6f7b97291ee8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('period_rashifal',
    sa.Column('id', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
    sa.Column('start_date', sqlmodel.sql.sqltypes.AutoString(length=16), nullable=False),
    sa.Column('span', sqlmodel.sql.sqltypes.AutoString(length=16), nullable=False),
    sa.Column('language', sqlmodel.sql.sqltypes.AutoString(length=8), nullable=False),
    sa.Column('content_json', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('astrology_data_json', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('model', sqlmodel.sql.sqltypes.AutoString(length=128), nullable=False),
    sa.Column('prompt_version', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('start_date', 'span', 'language', name='uq_period_rashifal_start_span_lang')
    )
    with op.batch_alter_table('period_rashifal', schema=None) as batch_op:
        batch_op.create_index('idx_period_rashifal_start_span', ['start_date', 'span'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('period_rashifal', schema=None) as batch_op:
        batch_op.drop_index('idx_period_rashifal_start_span')

    op.drop_table('period_rashifal')
