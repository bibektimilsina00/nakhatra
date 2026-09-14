"""add_chart_key_to_chat_sessions

Revision ID: 6f7b97291ee8
Revises: b82c4e6f1a30
Create Date: 2026-09-14 11:47:29.365631

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '6f7b97291ee8'
down_revision: Union[str, Sequence[str], None] = 'b82c4e6f1a30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    with op.batch_alter_table('chat_sessions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('chart_key', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True))
        batch_op.create_index('idx_chat_sessions_chart_key', ['chart_key'], unique=False)

def downgrade() -> None:
    with op.batch_alter_table('chat_sessions', schema=None) as batch_op:
        batch_op.drop_index('idx_chat_sessions_chart_key')
        batch_op.drop_column('chart_key')
