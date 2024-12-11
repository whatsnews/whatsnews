"""update_frequency_enum

Revision ID: 6b4b484104f1
Revises: 
Create Date: 2024-12-11 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = '6b4b484104f1'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create new enum type with safety check
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'updatefrequency_new') THEN
            CREATE TYPE updatefrequency_new AS ENUM ('30_minutes', 'hourly', 'daily');
        END IF;
    END
    $$;
    """)
    
    # Update existing data
    op.execute("""
        ALTER TABLE news 
        ALTER COLUMN frequency TYPE updatefrequency_new 
        USING (
            CASE frequency::text
                WHEN '10_minutes' THEN '30_minutes'::updatefrequency_new
                WHEN 'hourly' THEN 'hourly'::updatefrequency_new
                WHEN 'daily' THEN 'daily'::updatefrequency_new
            END
        );
    """)
    
    # Drop old type safely
    op.execute("""
    DO $$
    BEGIN
        DROP TYPE IF EXISTS updatefrequency;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END
    $$;
    """)
    
    # Rename new type to old name
    op.execute("ALTER TYPE updatefrequency_new RENAME TO updatefrequency;")

def downgrade():
    # Create old type with safety check
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'updatefrequency_old') THEN
            CREATE TYPE updatefrequency_old AS ENUM ('10_minutes', 'hourly', 'daily');
        END IF;
    END
    $$;
    """)
    
    # Update data back
    op.execute("""
        ALTER TABLE news 
        ALTER COLUMN frequency TYPE updatefrequency_old 
        USING (
            CASE frequency::text
                WHEN '30_minutes' THEN '10_minutes'::updatefrequency_old
                WHEN 'hourly' THEN 'hourly'::updatefrequency_old
                WHEN 'daily' THEN 'daily'::updatefrequency_old
            END
        );
    """)
    
    # Drop new type safely
    op.execute("""
    DO $$
    BEGIN
        DROP TYPE IF EXISTS updatefrequency;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END
    $$;
    """)
    
    # Rename old type back
    op.execute("ALTER TYPE updatefrequency_old RENAME TO updatefrequency;")