"""add_slug_to_prompts

Revision ID: 8c9d0e1f2a3b
Revises: 7a8b9c0d1e2f
Create Date: 2024-12-13 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from slugify import slugify
from sqlalchemy.orm import Session
from sqlalchemy import MetaData, Table, Column, Integer, String, select

# revision identifiers, used by Alembic
revision = '8c9d0e1f2a3b'
down_revision = '7a8b9c0d1e2f'
branch_labels = None
depends_on = None

def _generate_unique_slug(prompt_name: str, user_id: int, existing_slugs: dict) -> str:
    """Generate a unique slug for existing prompts."""
    base_slug = slugify(prompt_name)
    slug = base_slug
    counter = 1
    
    # Keep adding numbers until we find a unique slug for this user
    key = (user_id, slug)
    while key in existing_slugs:
        slug = f"{base_slug}-{counter}"
        key = (user_id, slug)
        counter += 1
    
    existing_slugs[key] = True
    return slug

def upgrade():
    # Create slug column allowing NULL initially
    op.add_column('prompts',
        sa.Column('slug', sa.String(), nullable=True)
    )
    
    # Get all existing prompts and generate slugs
    conn = op.get_bind()
    session = Session(bind=conn)
    metadata = MetaData()
    
    # Reflect the prompts table
    prompts_table = Table('prompts', metadata,
        Column('id', Integer, primary_key=True),
        Column('name', String),
        Column('user_id', Integer),
        Column('slug', String),
        extend_existing=True
    )
    metadata.reflect(only=['prompts'], bind=conn)
    
    # Get all existing prompts
    existing_slugs = {}
    prompts = session.execute(select(prompts_table)).fetchall()
    
    # Update each prompt with a unique slug
    for prompt in prompts:
        slug = _generate_unique_slug(prompt.name, prompt.user_id, existing_slugs)
        session.execute(
            prompts_table.update()
            .where(prompts_table.c.id == prompt.id)
            .values(slug=slug)
        )
    
    session.commit()
    
    # Now make the slug column non-nullable
    op.alter_column('prompts', 'slug',
        existing_type=sa.String(),
        nullable=False
    )
    
    # Add index and unique constraint
    op.create_index(op.f('ix_prompts_slug'), 'prompts', ['slug'])
    op.create_unique_constraint('uq_user_prompt_slug', 'prompts', ['user_id', 'slug'])

def downgrade():
    # Remove unique constraint first
    op.drop_constraint('uq_user_prompt_slug', 'prompts', type_='unique')
    
    # Remove index
    op.drop_index(op.f('ix_prompts_slug'), table_name='prompts')
    
    # Remove column
    op.drop_column('prompts', 'slug')