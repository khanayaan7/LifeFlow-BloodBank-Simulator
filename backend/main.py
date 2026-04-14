import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, SessionLocal, engine
from routers import audit, auth, blood_requests, blood_units, dashboard, donors, hospitals, temperature, violations
from scheduler import start_scheduler, stop_scheduler
from seed import ensure_min_pending_requests

# Import all model modules so SQLAlchemy can discover them before create_all.
from models import audit_log, blood_request, blood_unit, cold_chain_violation, donor, hospital, temperature_log, user  # noqa: F401

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_min_pending_requests(db, min_pending=5)
        db.commit()
    finally:
        db.close()
    start_scheduler()
    yield
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
