from datetime import date, datetime, timedelta, timezone

from database import Base, SessionLocal, engine
from models import BloodComponent, BloodGroup, BloodUnitStatus, RequestStatus, RequestUrgency, UserRole
from models.audit_log import AuditLog
from models.blood_bank import BloodBank
from models.blood_request import BloodRequest, BloodRequestAllocation
from models.blood_unit import BloodUnit
from models.cold_chain_violation import ColdChainViolation
from models.donor import Donor
from models.hospital import Hospital
from models.temperature_log import TemperatureLog
from models.user import User
from runtime_schema import apply_runtime_schema_updates
from utils.donors import generate_donor_code, sync_donor_eligibility
from utils.security import hash_password

BLOOD_BANKS = [
    {
        "name": "LifeFlow Blood Bank - Bank More",
        "location": "Bank More, Dhanbad, Jharkhand",
        "code": "BANK_MORE",
    },
    {
        "name": "LifeFlow Blood Bank - City Center",
        "location": "City Center, Dhanbad, Jharkhand",
        "code": "CITY_CENTER",
    },
]

STAFF_USERS = [
    {
        "full_name": "Bank More Admin",
        "email": "admin.bankmore@lifeflow.com",
        "password": "BankMoreAdmin@1234",
        "role": UserRole.admin,
        "blood_bank_code": "BANK_MORE",
    },
    {
        "full_name": "Bank More Lab Technician",
        "email": "lab.bankmore@lifeflow.com",
        "password": "BankMoreLab@1234",
        "role": UserRole.lab_technician,
        "blood_bank_code": "BANK_MORE",
    },
    {
        "full_name": "Bank More Auditor",
        "email": "auditor.bankmore@lifeflow.com",
        "password": "BankMoreAudit@1234",
        "role": UserRole.auditor,
        "blood_bank_code": "BANK_MORE",
    },
    {
        "full_name": "City Center Admin",
        "email": "admin.citycenter@lifeflow.com",
        "password": "CityCenterAdmin@1234",
        "role": UserRole.admin,
        "blood_bank_code": "CITY_CENTER",
    },
    {
        "full_name": "City Center Lab Technician",
        "email": "lab.citycenter@lifeflow.com",
        "password": "CityCenterLab@1234",
        "role": UserRole.lab_technician,
        "blood_bank_code": "CITY_CENTER",
    },
    {
        "full_name": "City Center Auditor",
        "email": "auditor.citycenter@lifeflow.com",
        "password": "CityCenterAudit@1234",
        "role": UserRole.auditor,
        "blood_bank_code": "CITY_CENTER",
    },
]

HOSPITAL_STAFF = [
    {
        "name": "Asarfi Hospital Dhanbad",
        "address": "Baramuri, Dhanbad, Jharkhand",
        "contact_person": "Dr. Aman Verma",
        "phone_number": "+919800000101",
        "email": "staff.asarfi@dhanbad.com",
        "staff_name": "Asarfi Hospital Staff",
        "staff_password": "Asarfi@1234",
    },
    {
        "name": "PMCH Dhanbad",
        "address": "Saraidhela, Dhanbad, Jharkhand",
        "contact_person": "Dr. Neha Sinha",
        "phone_number": "+919800000102",
        "email": "staff.pmch@dhanbad.com",
        "staff_name": "PMCH Staff",
        "staff_password": "PMCH@1234",
    },
    {
        "name": "Jalan Hospital Dhanbad",
        "address": "Bank More, Dhanbad, Jharkhand",
        "contact_person": "Dr. Ritu Ghosh",
        "phone_number": "+919800000103",
        "email": "staff.jalan@dhanbad.com",
        "staff_name": "Jalan Hospital Staff",
        "staff_password": "Jalan@1234",
    },
]

DONOR_ACCOUNTS = [
    {
        "full_name": "Riya Sen",
        "email": "donor.riya@lifeflow.com",
        "phone_number": "+919700000201",
        "password": "RiyaDonor@1234",
        "blood_group": BloodGroup.O_POS,
        "age": 28,
        "blood_bank_code": "CITY_CENTER",
    },
    {
        "full_name": "Arjun Kumar",
        "email": "donor.arjun@lifeflow.com",
        "phone_number": "+919700000202",
        "password": "ArjunDonor@1234",
        "blood_group": BloodGroup.A_POS,
        "age": 31,
        "blood_bank_code": "BANK_MORE",
    },
    {
        "full_name": "Meera Das",
        "email": "donor.meera@lifeflow.com",
        "phone_number": "+919700000203",
        "password": "MeeraDonor@1234",
        "blood_group": BloodGroup.B_POS,
        "age": 34,
        "blood_bank_code": "BANK_MORE",
    },
    {
        "full_name": "Kabir Roy",
        "email": "donor.kabir@lifeflow.com",
        "phone_number": "+919700000204",
        "password": "KabirDonor@1234",
        "blood_group": BloodGroup.AB_POS,
        "age": 29,
        "blood_bank_code": "CITY_CENTER",
    },
    {
        "full_name": "Naina Paul",
        "email": "donor.naina@lifeflow.com",
        "phone_number": "+919700000205",
        "password": "NainaDonor@1234",
        "blood_group": BloodGroup.O_NEG,
        "age": 26,
        "blood_bank_code": "CITY_CENTER",
    },
    {
        "full_name": "Vikram Sharma",
        "email": "donor.vikram@lifeflow.com",
        "phone_number": "+919700000206",
        "password": "VikramDonor@1234",
        "blood_group": BloodGroup.B_NEG,
        "age": 38,
        "blood_bank_code": "BANK_MORE",
    },
]

DONATION_BLUEPRINTS = [
    {
        "unit_code": "CC-20260401-001",
        "donor_email": "donor.riya@lifeflow.com",
        "blood_bank_code": "CITY_CENTER",
        "blood_group": BloodGroup.O_POS,
        "component": BloodComponent.whole_blood,
        "volume_ml": 450,
        "collection_date": date(2026, 4, 1),
        "expiry_date": date(2026, 5, 6),
        "status": BloodUnitStatus.allocated,
        "storage_unit_id": "CC-FRIDGE-1",
        "cold_chain_ok": True,
    },
    {
        "unit_code": "CC-20260401-002",
        "donor_email": "donor.riya@lifeflow.com",
        "blood_bank_code": "CITY_CENTER",
        "blood_group": BloodGroup.O_POS,
        "component": BloodComponent.packed_rbc,
        "volume_ml": 350,
        "collection_date": date(2026, 4, 1),
        "expiry_date": date(2026, 5, 6),
        "status": BloodUnitStatus.available,
        "storage_unit_id": "CC-FRIDGE-1",
        "cold_chain_ok": True,
    },
    {
        "unit_code": "BM-20260318-001",
        "donor_email": "donor.arjun@lifeflow.com",
        "blood_bank_code": "BANK_MORE",
        "blood_group": BloodGroup.A_POS,
        "component": BloodComponent.whole_blood,
        "volume_ml": 450,
        "collection_date": date(2026, 3, 18),
        "expiry_date": date(2026, 4, 22),
        "status": BloodUnitStatus.allocated,
        "storage_unit_id": "BM-FRIDGE-2",
        "cold_chain_ok": True,
    },
    {
        "unit_code": "BM-20260318-002",
        "donor_email": "donor.arjun@lifeflow.com",
        "blood_bank_code": "BANK_MORE",
        "blood_group": BloodGroup.A_POS,
        "component": BloodComponent.plasma,
        "volume_ml": 300,
        "collection_date": date(2026, 3, 18),
        "expiry_date": date(2027, 3, 18),
        "status": BloodUnitStatus.available,
        "storage_unit_id": "BM-FRIDGE-2",
        "cold_chain_ok": True,
    },
    {
        "unit_code": "BM-20260110-003",
        "donor_email": "donor.meera@lifeflow.com",
        "blood_bank_code": "BANK_MORE",
        "blood_group": BloodGroup.B_POS,
        "component": BloodComponent.whole_blood,
        "volume_ml": 420,
        "collection_date": date(2026, 1, 10),
        "expiry_date": date(2026, 2, 14),
        "status": BloodUnitStatus.expired,
        "storage_unit_id": "BM-FRIDGE-1",
        "cold_chain_ok": True,
    },
    {
        "unit_code": "BM-20260402-001",
        "donor_email": "donor.meera@lifeflow.com",
        "blood_bank_code": "BANK_MORE",
        "blood_group": BloodGroup.B_POS,
        "component": BloodComponent.packed_rbc,
        "volume_ml": 360,
        "collection_date": date(2026, 4, 2),
        "expiry_date": date(2026, 5, 7),
        "status": BloodUnitStatus.available,
        "storage_unit_id": "BM-FRIDGE-1",
        "cold_chain_ok": True,
    },
    {
        "unit_code": "CC-20260310-003",
        "donor_email": "donor.kabir@lifeflow.com",
        "blood_bank_code": "CITY_CENTER",
        "blood_group": BloodGroup.AB_POS,
        "component": BloodComponent.plasma,
        "volume_ml": 280,
        "collection_date": date(2026, 3, 10),
        "expiry_date": date(2027, 3, 10),
        "status": BloodUnitStatus.allocated,
        "storage_unit_id": "CC-FRIDGE-3",
        "cold_chain_ok": True,
    },
    {
        "unit_code": "CC-20260310-004",
        "donor_email": "donor.kabir@lifeflow.com",
        "blood_bank_code": "CITY_CENTER",
        "blood_group": BloodGroup.AB_POS,
        "component": BloodComponent.platelets,
        "volume_ml": 250,
        "collection_date": date(2026, 3, 10),
        "expiry_date": date(2026, 3, 15),
        "status": BloodUnitStatus.expired,
        "storage_unit_id": "CC-FRIDGE-3",
        "cold_chain_ok": True,
    },
    {
        "unit_code": "CC-20260405-001",
        "donor_email": "donor.naina@lifeflow.com",
        "blood_bank_code": "CITY_CENTER",
        "blood_group": BloodGroup.O_NEG,
        "component": BloodComponent.whole_blood,
        "volume_ml": 450,
        "collection_date": date(2026, 4, 5),
        "expiry_date": date(2026, 5, 10),
        "status": BloodUnitStatus.available,
        "storage_unit_id": "CC-FRIDGE-2",
        "cold_chain_ok": True,
    },
    {
        "unit_code": "BM-20260305-001",
        "donor_email": "donor.vikram@lifeflow.com",
        "blood_bank_code": "BANK_MORE",
        "blood_group": BloodGroup.B_NEG,
        "component": BloodComponent.whole_blood,
        "volume_ml": 430,
        "collection_date": date(2026, 3, 5),
        "expiry_date": date(2026, 4, 9),
        "status": BloodUnitStatus.allocated,
        "storage_unit_id": "BM-FRIDGE-3",
        "cold_chain_ok": True,
    },
    {
        "unit_code": "BM-20260305-002",
        "donor_email": "donor.vikram@lifeflow.com",
        "blood_bank_code": "BANK_MORE",
        "blood_group": BloodGroup.B_NEG,
        "component": BloodComponent.plasma,
        "volume_ml": 310,
        "collection_date": date(2026, 3, 5),
        "expiry_date": date(2027, 3, 5),
        "status": BloodUnitStatus.quarantined,
        "storage_unit_id": "BM-FRIDGE-4",
        "cold_chain_ok": False,
    },
]

REQUEST_BLUEPRINTS = [
    {
        "hospital_email": "staff.asarfi@dhanbad.com",
        "blood_bank_code": "CITY_CENTER",
        "blood_group": BloodGroup.O_POS,
        "component": BloodComponent.whole_blood,
        "units_needed": 1,
        "patient_name": "Aman Tiwari",
        "patient_id": "PT-CC-1001",
        "urgency": RequestUrgency.emergency,
        "status": RequestStatus.fulfilled,
        "notes": "Emergency trauma case",
        "fulfilled_at": datetime(2026, 4, 2, 10, 30, tzinfo=timezone.utc),
        "unit_codes": ["CC-20260401-001"],
    },
    {
        "hospital_email": "staff.pmch@dhanbad.com",
        "blood_bank_code": "BANK_MORE",
        "blood_group": BloodGroup.A_POS,
        "component": BloodComponent.whole_blood,
        "units_needed": 1,
        "patient_name": "Neha Kumari",
        "patient_id": "PT-BM-1002",
        "urgency": RequestUrgency.urgent,
        "status": RequestStatus.fulfilled,
        "notes": "Orthopedic surgery support",
        "fulfilled_at": datetime(2026, 3, 19, 8, 45, tzinfo=timezone.utc),
        "unit_codes": ["BM-20260318-001"],
    },
    {
        "hospital_email": "staff.jalan@dhanbad.com",
        "blood_bank_code": "CITY_CENTER",
        "blood_group": BloodGroup.AB_POS,
        "component": BloodComponent.plasma,
        "units_needed": 1,
        "patient_name": "Raghav Sethi",
        "patient_id": "PT-CC-1003",
        "urgency": RequestUrgency.routine,
        "status": RequestStatus.fulfilled,
        "notes": "Liver support therapy",
        "fulfilled_at": datetime(2026, 3, 11, 12, 0, tzinfo=timezone.utc),
        "unit_codes": ["CC-20260310-003"],
    },
    {
        "hospital_email": "staff.asarfi@dhanbad.com",
        "blood_bank_code": "BANK_MORE",
        "blood_group": BloodGroup.B_NEG,
        "component": BloodComponent.whole_blood,
        "units_needed": 1,
        "patient_name": "Pooja Rani",
        "patient_id": "PT-BM-1004",
        "urgency": RequestUrgency.emergency,
        "status": RequestStatus.fulfilled,
        "notes": "Postpartum hemorrhage support",
        "fulfilled_at": datetime(2026, 3, 6, 16, 20, tzinfo=timezone.utc),
        "unit_codes": ["BM-20260305-001"],
    },
    {
        "hospital_email": "staff.pmch@dhanbad.com",
        "blood_bank_code": "CITY_CENTER",
        "blood_group": BloodGroup.O_NEG,
        "component": BloodComponent.whole_blood,
        "units_needed": 2,
        "patient_name": "Sana Ali",
        "patient_id": "PT-CC-2001",
        "urgency": RequestUrgency.urgent,
        "status": RequestStatus.pending,
        "notes": "Reserved for scheduled surgery",
        "fulfilled_at": None,
        "unit_codes": [],
    },
    {
        "hospital_email": "staff.jalan@dhanbad.com",
        "blood_bank_code": "BANK_MORE",
        "blood_group": BloodGroup.B_POS,
        "component": BloodComponent.packed_rbc,
        "units_needed": 1,
        "patient_name": "Ishaan Ghosh",
        "patient_id": "PT-BM-2002",
        "urgency": RequestUrgency.routine,
        "status": RequestStatus.pending,
        "notes": "Oncology support request",
        "fulfilled_at": None,
        "unit_codes": [],
    },
]


def reset_demo_data(db):
    db.query(AuditLog).delete(synchronize_session=False)
    db.query(ColdChainViolation).delete(synchronize_session=False)
    db.query(TemperatureLog).delete(synchronize_session=False)
    db.query(BloodRequestAllocation).delete(synchronize_session=False)
    db.query(BloodRequest).delete(synchronize_session=False)
    db.query(BloodUnit).delete(synchronize_session=False)
    db.query(Donor).delete(synchronize_session=False)
    db.query(Hospital).delete(synchronize_session=False)
    db.query(User).delete(synchronize_session=False)
    db.query(BloodBank).delete(synchronize_session=False)
    db.commit()


def create_blood_banks(db):
    blood_banks = {}
    for item in BLOOD_BANKS:
        bank = BloodBank(name=item["name"], location=item["location"], code=item["code"])
        db.add(bank)
        db.flush()
        blood_banks[item["code"]] = bank
    return blood_banks


def create_users(db, blood_banks):
    users = {}
    for item in STAFF_USERS:
        user = User(
            email=item["email"],
            hashed_password=hash_password(item["password"]),
            full_name=item["full_name"],
            role=item["role"],
            phone_number=None,
            blood_bank_id=blood_banks[item["blood_bank_code"]].id,
            is_active=True,
        )
        db.add(user)
        db.flush()
        users[item["email"]] = user

    for item in HOSPITAL_STAFF:
        user = User(
            email=item["email"],
            hashed_password=hash_password(item["staff_password"]),
            full_name=item["staff_name"],
            role=UserRole.hospital_staff,
            phone_number=item["phone_number"],
            blood_bank_id=None,
            is_active=True,
        )
        db.add(user)
        db.flush()
        users[item["email"]] = user

    return users


def create_hospitals(db):
    hospitals = {}
    for item in HOSPITAL_STAFF:
        hospital = Hospital(
            name=item["name"],
            address=item["address"],
            contact_person=item["contact_person"],
            phone_number=item["phone_number"],
            email=item["email"],
            is_active=True,
        )
        db.add(hospital)
        db.flush()
        hospitals[item["email"]] = hospital
    return hospitals


def create_donors(db, users, blood_banks):
    donors = {}
    for item in DONOR_ACCOUNTS:
        user = User(
            email=item["email"],
            hashed_password=hash_password(item["password"]),
            full_name=item["full_name"],
            role=UserRole.donor,
            phone_number=item["phone_number"],
            blood_bank_id=None,
            is_active=True,
        )
        db.add(user)
        db.flush()

        donor = Donor(
            donor_code=generate_donor_code(),
            user_id=user.id,
            full_name=item["full_name"],
            blood_group=item["blood_group"],
            age=item["age"],
            phone_number=item["phone_number"],
            email=item["email"],
            last_donation=None,
            is_eligible=True,
            created_by=None,
            blood_bank_id=blood_banks[item["blood_bank_code"]].id,
        )
        db.add(donor)
        db.flush()
        users[item["email"]] = user
        donors[item["email"]] = donor
    return donors


def create_blood_units(db, blood_banks, donors):
    units = {}
    for item in DONATION_BLUEPRINTS:
        donor = donors[item["donor_email"]]
        unit = BloodUnit(
            unit_code=item["unit_code"],
            blood_group=item["blood_group"],
            component=item["component"],
            volume_ml=item["volume_ml"],
            blood_bank_id=blood_banks[item["blood_bank_code"]].id,
            donor_id=donor.id,
            collection_date=item["collection_date"],
            expiry_date=item["expiry_date"],
            status=item["status"],
            storage_unit_id=item["storage_unit_id"],
            cold_chain_ok=item["cold_chain_ok"],
            cold_chain_score=1.0 if item["cold_chain_ok"] else 0.35,
        )
        db.add(unit)
        db.flush()
        units[item["unit_code"]] = unit

        if donor.last_donation is None or item["collection_date"] > donor.last_donation:
            donor.last_donation = item["collection_date"]
            sync_donor_eligibility(donor, today=item["collection_date"])

    for donor in donors.values():
        sync_donor_eligibility(donor, today=date.today())

    return units


def create_requests(db, blood_banks, hospitals, users, units):
    for item in REQUEST_BLUEPRINTS:
        hospital = hospitals[item["hospital_email"]]
        requester = users[item["hospital_email"]]
        request = BloodRequest(
            hospital_id=hospital.id,
            blood_bank_id=blood_banks[item["blood_bank_code"]].id,
            requested_by=requester.id,
            blood_group=item["blood_group"],
            component=item["component"],
            units_needed=item["units_needed"],
            patient_name=item["patient_name"],
            patient_id=item["patient_id"],
            urgency=item["urgency"],
            status=item["status"],
            notes=item["notes"],
            fulfilled_at=item["fulfilled_at"],
        )
        db.add(request)
        db.flush()

        for score, unit_code in enumerate(item["unit_codes"], start=1):
            unit = units[unit_code]
            unit.status = BloodUnitStatus.allocated
            allocation = BloodRequestAllocation(
                request_id=request.id,
                blood_unit_id=unit.id,
                allocated_at=item["fulfilled_at"] or datetime.now(timezone.utc),
                allocation_score=1.0 - (score * 0.05),
            )
            db.add(allocation)


def seed_demo_data(db):
    reset_demo_data(db)
    blood_banks = create_blood_banks(db)
    users = create_users(db, blood_banks)
    hospitals = create_hospitals(db)
    donors = create_donors(db, users, blood_banks)
    units = create_blood_units(db, blood_banks, donors)
    create_requests(db, blood_banks, hospitals, users, units)
    db.commit()
    return blood_banks, users, donors, units


def ensure_dhanbad_hospitals_and_staff(db) -> None:
    if db.query(BloodBank).count() == 0 or db.query(User).count() == 0:
        seed_demo_data(db)


def ensure_min_pending_requests(db, min_pending: int = 2) -> int:
    pending = db.query(BloodRequest).filter(BloodRequest.status == RequestStatus.pending).count()
    return max(pending, min_pending)


def ensure_min_fulfilled_requests(db, min_fulfilled_per_blood_bank: int = 2) -> int:
    fulfilled = db.query(BloodRequest).filter(BloodRequest.status == RequestStatus.fulfilled).count()
    return max(fulfilled, min_fulfilled_per_blood_bank)


def main():
    apply_runtime_schema_updates(engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
        donor_rows = db.query(Donor).count()
        unit_rows = db.query(BloodUnit).count()
        request_rows = db.query(BloodRequest).count()
        print(
            "Seed completed successfully "
            f"(donors={donor_rows}, blood_units={unit_rows}, requests={request_rows})"
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
