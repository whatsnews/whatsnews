# alembic/versions/7a8b9c0d1e2f_add_visibility_to_prompts.py
"""add_visibility_to_prompts

Revision ID: 7a8b9c0d1e2f
Revises: 638fab0c4db8
Create Date: 2024-12-13 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = '7a8b9c0d1e2f'
down_revision = '638fab0c4db8'
branch_labels = None
depends_on = None

def upgrade():
    # Create VisibilityType enum
    visibility_type = sa.Enum('PRIVATE', 'INTERNAL', 'PUBLIC', name='visibilitytype')
    visibility_type.create(op.get_bind())

    # Add visibility column with default value
    op.add_column('prompts',
        sa.Column('visibility', 
                  sa.Enum('PRIVATE', 'INTERNAL', 'PUBLIC', name='visibilitytype'),
                  nullable=False,
                  server_default='PRIVATE')
    )

def downgrade():
    # Remove visibility column
    op.drop_column('prompts', 'visibility')
    
    # Drop the enum type
    visibility_type = sa.Enum(name='visibilitytype')
    visibility_type.drop(op.get_bind())