import os
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from models.blood_bank import BloodBank
from models.blood_unit import BloodUnit

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
try:
    results = db.query(BloodBank.name, BloodUnit.blood_group, func.count(BloodUnit.id)) \
        .join(BloodUnit, BloodBank.id == BloodUnit.blood_bank_id) \
        .group_by(BloodBank.name, BloodUnit.blood_group) \
        .order_by(BloodBank.name, BloodUnit.blood_group) \
        .all()
    
    summary = {}
    for bank_name, blood_group, count in results:
        if bank_name not in summary:
            summary[bank_name] = []
        summary[bank_name].append(f"{blood_group}: {count}")
    
    for bank, units in summary.items():
        print(f"{bank}: {', '.join(units)}")
finally:
    db.close()
