import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, SessionLocal, engine
from routers import audit, auth, blood_banks, blood_requests, blood_units, dashboard, donors, hospitals, temperature, violations
from runtime_schema import apply_runtime_schema_updates
from scheduler import start_scheduler, stop_scheduler
from seed import ensure_dhanbad_hospitals_and_staff, ensure_min_fulfilled_requests, ensure_min_pending_requests

# Import all model modules so SQLAlchemy can discover them before create_all.
from models import audit_log, blood_bank, blood_request, blood_unit, cold_chain_violation, donor, hospital, temperature_log, user  # noqa: F401

load_dotenv()
logger = logging.getLogger(__name__)


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_ready = True
    scheduler_started = False

    try:
        apply_runtime_schema_updates(engine)
        Base.metadata.create_all(bind=engine)
    except Exception:
        db_ready = False
        logger.exception("Database initialization failed; starting API in degraded mode")

    # Keep API startup fast and predictable. Seeding can be enabled explicitly
    # by setting STARTUP_SEED_ENABLED=1.
    if db_ready and _env_bool("STARTUP_SEED_ENABLED", default=False):
        db = SessionLocal()
        try:
            ensure_dhanbad_hospitals_and_staff(db)
            ensure_min_pending_requests(db, min_pending=5)
            ensure_min_fulfilled_requests(db, min_fulfilled_per_blood_bank=6)
            db.commit()
            logger.info("Startup seeding completed")
        except Exception:
            db.rollback()
            logger.exception("Startup seeding failed; continuing without startup seed data")
        finally:
            db.close()
    elif not db_ready:
        logger.warning("Startup seeding skipped because database is unavailable")
    else:
        logger.info("Startup seeding skipped (set STARTUP_SEED_ENABLED=1 to enable)")

    if db_ready:
        try:
            start_scheduler()
            scheduler_started = True
        except Exception:
            logger.exception("Failed to start scheduler")
    else:
        logger.warning("Scheduler not started because database is unavailable")

    yield

    if scheduler_started:
        stop_scheduler()


app = FastAPI(title="Blood Bank API", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(blood_banks.router, prefix="/blood-banks")
app.include_router(donors.router, prefix="/donors")
app.include_router(blood_units.router, prefix="/blood-units")
app.include_router(hospitals.router, prefix="/hospitals")
app.include_router(blood_requests.router, prefix="/requests")
app.include_router(temperature.router, prefix="/temperature")
app.include_router(violations.router, prefix="/violations")
app.include_router(dashboard.router, prefix="/dashboard")
app.include_router(audit.router, prefix="/audit")


@app.get("/")
def root():
    return {"status": "Blood Bank API running"}
