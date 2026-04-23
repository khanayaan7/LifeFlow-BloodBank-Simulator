from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models.blood_bank import BloodBank
from models.user import User
from schemas.blood_bank import BloodBankOut

router = APIRouter(tags=["blood_banks"])


@router.get("/", response_model=list[BloodBankOut])
def list_blood_banks(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(BloodBank).order_by(BloodBank.name.asc()).all()
