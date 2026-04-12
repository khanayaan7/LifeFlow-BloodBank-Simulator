# LifeFlow Blood Bank Simulator

LifeFlow is a full-stack blood bank management and monitoring system built for inventory control, emergency request handling, and cold-chain safety tracking.

The project is split into three services:
- backend: FastAPI API for users, donors, blood units, requests, dashboard metrics, temperature ingest, violations, and audit logs
- frontend: React dashboard for role-based operations and monitoring
- iot_simulator: Python script that sends periodic storage temperature readings to simulate real IoT devices

## Why This Project

Blood banks need high reliability in three areas:
- Availability: right blood components in stock when needed
- Allocation: matching requests to compatible inventory quickly
- Safety: preserving cold-chain quality and reacting to storage violations

LifeFlow models all three in one workflow.

## Core Capabilities

- Authentication with JWT and role-based access
- Donor, hospital, and blood inventory management
- Blood request lifecycle handling (pending, fulfilled, etc.)
- Allocation and inventory health visibility via dashboard stats
- Temperature ingestion from simulated storage units
- Automatic cold-chain violation checks and alerts
- Scheduled jobs for periodic checks and expired-unit handling
- Audit logging for operational traceability

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Pydantic, APScheduler, python-jose
- Database: PostgreSQL (configured through DATABASE_URL)
- Frontend: React, Tailwind CSS, Axios, Recharts
- Simulator: Python + requests

## Repository Layout

```
blood-bank/
  backend/          # API, models, routers, business services, scheduler, seed script
  frontend/         # React client app
  iot_simulator/    # Temperature simulation client
```

## High-Level Architecture

1. Frontend calls backend REST APIs.
2. Backend stores and queries data using SQLAlchemy.
3. IoT simulator posts temperature readings to backend.
4. Violation checker marks out-of-range storage conditions.
5. Scheduler runs periodic jobs for violations and expiry processing.
6. Dashboard and audit endpoints expose operational intelligence.

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+
- PostgreSQL 13+

## Environment Variables

Create a backend .env file with at least:

```env
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=replace_with_strong_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:3000
```

Optional service variables (if alert integrations are enabled in your setup):
- SendGrid credentials
- Twilio credentials

For frontend, optionally set:

```env
REACT_APP_API_URL=http://localhost:8000
```

Note: `.env` files are already ignored by `.gitignore`.

## Local Setup

### 1. Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend default URL: http://localhost:8000

### 2. Start Frontend

```bash
cd frontend
npm install
npm start
```

Frontend default URL: http://localhost:3000

### 3. Start IoT Simulator

```bash
cd iot_simulator
pip install -r requirements.txt
python simulator.py
```

The simulator posts to `http://localhost:8000/temperature/ingest` every 30 seconds and intentionally creates periodic out-of-range events.

## Database Initialization and Seed Data

Tables are auto-created on backend startup.

To populate sample users, donors, hospitals, units, and requests:

```bash
cd backend
python seed.py
```

Sample users created by the seed script:
- admin@bloodbank.com
- hospital@city.com
- lab@bloodbank.com
- auditor@bloodbank.com

## API Route Groups

Base backend URL: `http://localhost:8000`

- `/auth`: register, login, current user
- `/donors`: donor CRUD and eligibility-related operations
- `/blood-units`: blood inventory operations
- `/hospitals`: hospital management
- `/requests`: blood request lifecycle
- `/temperature`: ingest, latest values, history, storage units
- `/violations`: cold-chain violation records and resolution flows
- `/dashboard`: summary stats and recent activity
- `/audit`: audit trail retrieval

Root health endpoint:

```http
GET /
```

Expected response:

```json
{"status":"Blood Bank API running"}
```

## Scheduler Behavior

On backend startup, APScheduler starts two jobs:
- Violation check job every 5 minutes
- Expiry processing job daily at 00:00

## Frontend Highlights

- Protected routes with token handling
- Auto-logout and redirect to login on HTTP 401
- Dashboard cards and charts for operational metrics
- Views for donors, hospitals, units, requests, violations, temperature logs, and audit logs

## Security Notes

- Do not commit `.env` files or credentials
- Use a strong `JWT_SECRET` in non-dev environments
- Restrict `CORS_ORIGINS` to trusted frontend hosts

## Troubleshooting

- Backend fails with `DATABASE_URL is not configured`
  - Ensure backend `.env` exists and includes `DATABASE_URL`

- Frontend cannot reach backend
  - Check backend is running at expected host/port
  - Set `REACT_APP_API_URL` if not using `http://localhost:8000`

- Simulator reports request failures
  - Start backend before launching simulator
  - Verify `/temperature/ingest` is reachable

## Future Enhancements

- Add Docker Compose for one-command local startup
- Add automated tests and CI checks
- Add API docs screenshots and demo walkthrough
