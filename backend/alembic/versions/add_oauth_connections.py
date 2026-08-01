"""add oauth connections

Revision ID: 7a0f8b9c0d1e
Revises: None
Create Date: 2026-08-01 12:00:00.000000

"""
from alembic import op
# pyrefly: ignore [missing-import]
import sqlalchemy as sa
# pyrefly: ignore [missing-import]
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = '7a0f8b9c0d1e'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # If the database is starting from scratch (no users table), create core tables
    if "users" not in tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("username", sa.String(length=50), unique=True, index=True, nullable=False),
            sa.Column("email", sa.String(length=100), unique=True, index=True, nullable=False),
            sa.Column("hashed_password", sa.String(length=255), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
    
    if "binders" not in tables:
        op.create_table(
            "binders",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("title", sa.String(length=100), index=True, nullable=False),
            sa.Column("description", sa.String(length=255), nullable=True),
            sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )

    if "pages" not in tables:
        op.create_table(
            "pages",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("binder_id", sa.Integer(), sa.ForeignKey("binders.id", ondelete="CASCADE"), nullable=False),
            sa.Column("page_number", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=100), nullable=True),
        )

    if "card_slots" not in tables:
        op.create_table(
            "card_slots",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("page_id", sa.Integer(), sa.ForeignKey("pages.id", ondelete="CASCADE"), nullable=False),
            sa.Column("slot_index", sa.Integer(), nullable=False),
            sa.Column("image_url", sa.String(length=255), nullable=True),
            sa.Column("tcg_id", sa.String(length=100), nullable=True),
            sa.Column("name", sa.String(length=100), nullable=True),
            sa.Column("set_name", sa.String(length=100), nullable=True),
            sa.Column("market_price", sa.Float(), nullable=True),
            sa.Column("last_pricing_update", sa.DateTime(timezone=True), nullable=True),
        )

    # Always create the new user_oauth_connections table if it does not exist
    if "user_oauth_connections" not in tables:
        op.create_table(
            "user_oauth_connections",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("provider", sa.String(length=50), nullable=False),
            sa.Column("provider_user_id", sa.String(length=100), nullable=False),
            sa.Column("provider_email", sa.String(length=100), nullable=True),
            sa.Column("provider_username", sa.String(length=100), nullable=True),
            sa.Column("access_token", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )


def downgrade() -> None:
    op.drop_table("user_oauth_connections")
