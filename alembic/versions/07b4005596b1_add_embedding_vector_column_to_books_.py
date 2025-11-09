"""Add embedding vector column to books table

Revision ID: 07b4005596b1
Revises: 5429349a2b34
Create Date: 2025-11-09 17:24:23.842723

"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision = '07b4005596b1'
down_revision = '5429349a2b34'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    # Add embedding column
    op.add_column('books', sa.Column('embedding', Vector(768), nullable=True))

    # Create index for cosine similarity search
    # Using ivfflat index for faster approximate nearest neighbor search
    op.execute("""
        CREATE INDEX IF NOT EXISTS books_embedding_idx
        ON books
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """)


def downgrade() -> None:
    # Drop index
    op.execute('DROP INDEX IF EXISTS books_embedding_idx')

    # Drop column
    op.drop_column('books', 'embedding')

    # Note: Not dropping the vector extension as other tables might use it
