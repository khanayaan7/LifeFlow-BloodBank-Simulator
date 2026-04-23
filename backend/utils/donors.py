from datetime import date, timedelta
from uuid import uuid4

from models.donor import Donor

DONATION_COOLDOWN_DAYS = 90


def generate_donor_code() -> str:
    return f"DNR-{uuid4().hex[:8].upper()}"


def donor_is_eligible(last_donation: date | None, today: date | None = None) -> bool:
    if last_donation is None:
        return True
    current_day = today or date.today()
    return (current_day - last_donation) >= timedelta(days=DONATION_COOLDOWN_DAYS)


def sync_donor_eligibility(donor: Donor, today: date | None = None) -> Donor:
    donor.is_eligible = donor_is_eligible(donor.last_donation, today=today)
    return donor
