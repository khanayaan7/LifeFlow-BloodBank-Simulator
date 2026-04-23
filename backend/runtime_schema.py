from sqlalchemy import text
from sqlalchemy.engine import Engine


def apply_runtime_schema_updates(engine: Engine) -> None:
    # Keep production data usable without full Alembic migrations.
    statements = [
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'donor';
            END IF;
        END
        $$;
        """,
        """
        CREATE TABLE IF NOT EXISTS blood_banks (
            id UUID PRIMARY KEY,
            name VARCHAR(120) UNIQUE NOT NULL,
            location VARCHAR(255) NOT NULL,
            code VARCHAR(40) UNIQUE NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """,
        "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS blood_bank_id UUID",
        "ALTER TABLE IF EXISTS donors ADD COLUMN IF NOT EXISTS donor_code VARCHAR(30)",
        "ALTER TABLE IF EXISTS donors ADD COLUMN IF NOT EXISTS user_id UUID",
        "ALTER TABLE IF EXISTS donors ADD COLUMN IF NOT EXISTS blood_bank_id UUID",
        "ALTER TABLE IF EXISTS donors ALTER COLUMN blood_group DROP NOT NULL",
        "ALTER TABLE IF EXISTS donors ALTER COLUMN age DROP NOT NULL",
        "ALTER TABLE IF EXISTS donors ALTER COLUMN created_by DROP NOT NULL",
        "ALTER TABLE IF EXISTS blood_units ADD COLUMN IF NOT EXISTS blood_bank_id UUID",
        "ALTER TABLE IF EXISTS blood_requests ADD COLUMN IF NOT EXISTS blood_bank_id UUID",
        "ALTER TABLE IF EXISTS blood_requests ADD COLUMN IF NOT EXISTS patient_name VARCHAR(120)",
        "ALTER TABLE IF EXISTS blood_requests ADD COLUMN IF NOT EXISTS patient_id VARCHAR(60)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_donors_donor_code ON donors (donor_code)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_donors_user_id ON donors (user_id) WHERE user_id IS NOT NULL",
    ]

    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))
