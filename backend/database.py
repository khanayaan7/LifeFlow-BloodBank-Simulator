import os
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not configured")

engine_kwargs = {"pool_pre_ping": True}

if DATABASE_URL.startswith("postgresql"):
    # Fail fast when the remote DB is unreachable so API startup can enter
    # degraded mode quickly instead of blocking for long DNS/IP retries.
    connect_timeout = int(os.getenv("DATABASE_CONNECT_TIMEOUT", "2"))
    engine_kwargs["connect_args"] = {"connect_timeout": connect_timeout}

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
