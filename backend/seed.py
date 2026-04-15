import random
from datetime import date, datetime, timedelta, timezone

from database import Base, SessionLocal, engine
from models import BloodComponent, BloodGroup, BloodUnitStatus, RequestStatus, RequestUrgency, UserRole
from models.audit_log import AuditLog  # noqa: F401
from models.blood_request import BloodRequest
from models.blood_unit import BloodUnit
from models.donor import Donor
from models.hospital import Hospital
from models.user import User
from utils.security import hash_password


def create_users(db):
    users = [
        ("admin@bloodbank.com", "Admin@1234", "System Admin", UserRole.admin),
        ("hospital@city.com", "Hospital@1234", "City Hospital Staff", UserRole.hospital_staff),
        ("lab@bloodbank.com", "Lab@1234", "Lab Technician", UserRole.lab_technician),
        ("auditor@bloodbank.com", "Auditor@1234", "Compliance Auditor", UserRole.auditor),
    ]
    created = []
    for email, password, name, role in users:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, hashed_password=hash_password(password), full_name=name, role=role)
            db.add(user)
            db.flush()
        created.append(user)
    return created


def create_hospitals(db):
    seeds = [
        ("Apollo Hospital Dhanbad", "Plot No. 1, Mineral Road, Dhanbad, Jharkhand", "Dr. Rajesh Kumar", "+919876543210", "info@apollodhanbad.com"),
        ("Fortis C-Tech Hospital", "Govind Mitra Road, Dhanbad, Jharkhand", "Ms. Priya Sharma", "+919876543211", "contact@fortisdhanbad.com"),
        ("Prime Hospital Dhanbad", "Main Road, Katras, Dhanbad, Jharkhand", "Mr. Arun Singh", "+919876543212", "admin@primedhanbad.com"),
        ("City Medical Center", "Central Ward, Jharia, Dhanbad, Jharkhand", "Dr. Neha Verma", "+919876543213", "care@citymedicaldbd.com"),
    ]
    hospitals = []
    for item in seeds:
        h = db.query(Hospital).filter(Hospital.name == item[0]).first()
        if not h:
            h = Hospital(name=item[0], address=item[1], contact_person=item[2], phone_number=item[3], email=item[4])
            db.add(h)
            db.flush()
        hospitals.append(h)
    return hospitals


def create_donors(db, admin_id):
    groups = list(BloodGroup)
    indian_names = [
        "Rajesh Kumar", "Priya Sharma", "Arjun Singh", "Anisha Patel",
        "Vikram Reddy", "Deepa Gupta", "Sanjay Verma", "Neha Mishra",
        "Amit Joshi", "Ritu Desai"
    ]
    donors = []
    for i, name in enumerate(indian_names, 1):
        donor = db.query(Donor).filter(Donor.full_name == name).first()
        if not donor:
            donor = Donor(
                full_name=name,
                blood_group=random.choice(groups),
                age=random.randint(20, 55),
                phone_number=f"+9198765432{i:02d}",
                email=f"donor{i}@lifeflow.com",
                last_donation=date.today() - timedelta(days=random.randint(20, 150)),
                created_by=admin_id,
                is_eligible=True,
            )
            db.add(donor)
            db.flush()
        donors.append(donor)
    return donors


def create_blood_units(db, donors):
    if not donors:
        return 0

    all_units = db.query(BloodUnit).all()
    existing_codes = {unit.unit_code for unit in all_units}

    target_by_group = {blood_group: random.randint(20, 25) for blood_group in BloodGroup}
    group_counts = {blood_group: 0 for blood_group in BloodGroup}
    component_counts = {component: 0 for component in BloodComponent}
    status_counts = {status: 0 for status in BloodUnitStatus}

    for unit in all_units:
        group_counts[unit.blood_group] += 1
        component_counts[unit.component] += 1
        status_counts[unit.status] += 1

    storage_units = ["FRIDGE-A1", "FRIDGE-A2", "FRIDGE-B1", "FREEZER-C1"]
    serial = len(existing_codes) + 1
    created = 0

    group_tokens = {
        BloodGroup.A_POS: "G1",
        BloodGroup.A_NEG: "G2",
        BloodGroup.B_POS: "G3",
        BloodGroup.B_NEG: "G4",
        BloodGroup.AB_POS: "G5",
        BloodGroup.AB_NEG: "G6",
        BloodGroup.O_POS: "G7",
        BloodGroup.O_NEG: "G8",
    }

    def next_unit_code(blood_group: BloodGroup) -> str:
        nonlocal serial
        group_token = group_tokens[blood_group]
        while True:
            code = f"DMY-{date.today().strftime('%Y%m%d')}-{group_token}-{serial:04d}"
            serial += 1
            if code not in existing_codes:
                existing_codes.add(code)
                return code

    def expiry_for_component(component: BloodComponent, collection_date: date) -> date:
        if component in (BloodComponent.whole_blood, BloodComponent.packed_rbc):
            return collection_date + timedelta(days=35)
        if component == BloodComponent.plasma:
            return collection_date + timedelta(days=365)
        return collection_date + timedelta(days=5)

    for blood_group in BloodGroup:
        while group_counts[blood_group] < target_by_group[blood_group]:
            missing_components = [component for component, count in component_counts.items() if count == 0]
            component = missing_components[0] if missing_components else random.choice(list(BloodComponent))

            missing_statuses = [status for status, count in status_counts.items() if count == 0]
            if missing_statuses:
                status = missing_statuses[0]
            else:
                status = random.choices(
                    [
                        BloodUnitStatus.available,
                        BloodUnitStatus.reserved,
                        BloodUnitStatus.allocated,
                        BloodUnitStatus.expired,
                        BloodUnitStatus.quarantined,
                    ],
                    weights=[45, 20, 15, 10, 10],
                    k=1,
                )[0]

            if status == BloodUnitStatus.expired:
                expiry_date = date.today() - timedelta(days=random.randint(1, 30))
                collection_date = expiry_date - timedelta(days=random.randint(5, 35))
            else:
                collection_date = date.today() - timedelta(days=random.randint(0, 25))
                expiry_date = expiry_for_component(component, collection_date)
                if expiry_date <= date.today():
                    if component in (BloodComponent.whole_blood, BloodComponent.packed_rbc):
                        expiry_date = date.today() + timedelta(days=random.randint(2, 30))
                    elif component == BloodComponent.plasma:
                        expiry_date = date.today() + timedelta(days=random.randint(90, 365))
                    else:
                        expiry_date = date.today() + timedelta(days=random.randint(2, 5))

            if status == BloodUnitStatus.quarantined:
                cold_chain_ok = False
                cold_chain_score = round(random.uniform(0.1, 0.45), 2)
            else:
                cold_chain_ok = random.random() > 0.08
                cold_chain_score = round(random.uniform(0.8, 1.0), 2) if cold_chain_ok else round(random.uniform(0.4, 0.7), 2)

            unit = BloodUnit(
                unit_code=next_unit_code(blood_group),
                blood_group=blood_group,
                component=component,
                volume_ml=random.randint(350, 450),
                donor_id=random.choice(donors).id,
                collection_date=collection_date,
                expiry_date=expiry_date,
                status=status,
                storage_unit_id=random.choice(storage_units),
                cold_chain_ok=cold_chain_ok,
                cold_chain_score=cold_chain_score,
            )
            db.add(unit)

            group_counts[blood_group] += 1
            component_counts[component] += 1
            status_counts[status] += 1
            created += 1

    return created


def create_requests(db, hospitals, requester_id):
    if db.query(BloodRequest).count() >= 3:
        return
    for i in range(3):
        req = BloodRequest(
            hospital_id=hospitals[i % len(hospitals)].id,
            requested_by=requester_id,
            blood_group=random.choice(list(BloodGroup)),
            component=random.choice(list(BloodComponent)),
            units_needed=random.randint(1, 4),
            urgency=random.choice(list(RequestUrgency)),
            status=RequestStatus.pending,
            notes="Seeded request",
        )
        db.add(req)


def ensure_min_pending_requests(db, min_pending: int = 2) -> int:
    pending_count = db.query(BloodRequest).filter(BloodRequest.status == RequestStatus.pending).count()
    if pending_count >= min_pending:
        return 0

    requester = (
        db.query(User)
        .filter(User.role.in_([UserRole.hospital_staff, UserRole.admin]))
        .filter(User.is_active.is_(True))
        .order_by(User.created_at.asc())
        .first()
    )
    hospital = db.query(Hospital).filter(Hospital.is_active.is_(True)).order_by(Hospital.created_at.asc()).first()

    if not requester or not hospital:
        return 0

    available_units = (
        db.query(BloodUnit)
        .filter(BloodUnit.status == BloodUnitStatus.available)
        .all()
    )
    inventory_counts: dict[tuple[BloodGroup, BloodComponent], int] = {}
    for unit in available_units:
        key = (unit.blood_group, unit.component)
        inventory_counts[key] = inventory_counts.get(key, 0) + 1

    viable_pairs = [pair for pair, count in inventory_counts.items() if count >= 1]

    created = 0
    to_create = min_pending - pending_count
    for _ in range(to_create):
        if viable_pairs:
            blood_group, component = random.choice(viable_pairs)
            max_units = max(1, inventory_counts.get((blood_group, component), 1))
            units_needed = min(random.randint(1, 2), max_units)
        else:
            blood_group = random.choice(list(BloodGroup))
            component = random.choice(list(BloodComponent))
            units_needed = random.randint(1, 2)

        req = BloodRequest(
            hospital_id=hospital.id,
            requested_by=requester.id,
            blood_group=blood_group,
            component=component,
            units_needed=units_needed,
            urgency=random.choice(list(RequestUrgency)),
            status=RequestStatus.pending,
            notes="Auto-seeded pending request",
        )
        db.add(req)
        created += 1

    return created


def ensure_min_fulfilled_requests(db, min_fulfilled: int = 1) -> int:
    fulfilled_count = db.query(BloodRequest).filter(BloodRequest.status == RequestStatus.fulfilled).count()
    if fulfilled_count >= min_fulfilled:
        return 0

    requester = (
        db.query(User)
        .filter(User.role.in_([UserRole.hospital_staff, UserRole.admin]))
        .filter(User.is_active.is_(True))
        .order_by(User.created_at.asc())
        .first()
    )
    hospital = db.query(Hospital).filter(Hospital.is_active.is_(True)).order_by(Hospital.created_at.asc()).first()

    if not requester or not hospital:
        return 0

    created = 0
    to_create = min_fulfilled - fulfilled_count
    for _ in range(to_create):
        req = BloodRequest(
            hospital_id=hospital.id,
            requested_by=requester.id,
            blood_group=random.choice(list(BloodGroup)),
            component=random.choice(list(BloodComponent)),
            units_needed=random.randint(1, 2),
            urgency=random.choice(list(RequestUrgency)),
            status=RequestStatus.fulfilled,
            fulfilled_at=datetime.now(timezone.utc),
            notes="Auto-seeded fulfilled request",
        )
        db.add(req)
        created += 1

    return created


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        users = create_users(db)
        hospitals = create_hospitals(db)
        donors = create_donors(db, users[0].id)
        created_units = create_blood_units(db, donors)
        create_requests(db, hospitals, users[1].id)
        db.commit()
        print(f"Seed completed successfully (new blood units added: {created_units})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
