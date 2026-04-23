import random
import time
from datetime import datetime, timezone
import os

import requests
from requests.exceptions import ReadTimeout

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
STORAGE_UNITS_BY_BANK = {
    "BANK_MORE": ["BM-FRIDGE-1", "BM-FRIDGE-2", "BM-FRIDGE-3", "BM-FRIDGE-4"],
    "CITY_CENTER": ["CC-FRIDGE-1", "CC-FRIDGE-2", "CC-FRIDGE-3", "CC-FRIDGE-4"],
}
STORAGE_UNITS = [unit for units in STORAGE_UNITS_BY_BANK.values() for unit in units]
INTERVAL_SECONDS = 30
MIN_VIOLATION_SECONDS = int(os.getenv("MIN_VIOLATION_SECONDS", "60"))
MAX_VIOLATION_SECONDS = int(os.getenv("MAX_VIOLATION_SECONDS", "180"))
SAFE_MIN = 1.0
SAFE_MAX = 8.0
MAX_RETRIES = 2
RETRY_BACKOFF_SECONDS = 1

current_violation_unit_idx = -1
active_violation_unit = None
# Backward-compatible alias used by ad-hoc checks/scripts.
current_violation_unit = None
active_violation_ticks_remaining = 0


def _random_violation_ticks() -> int:
    min_ticks = max(1, MIN_VIOLATION_SECONDS // INTERVAL_SECONDS)
    max_ticks = max(min_ticks, MAX_VIOLATION_SECONDS // INTERVAL_SECONDS)
    return random.randint(min_ticks, max_ticks)


def schedule_violation():
    global current_violation_unit_idx, active_violation_unit, current_violation_unit, active_violation_ticks_remaining

    # Keep exactly one storage unit in violation, but randomize both the
    # violating fridge and how long it remains in violation before switching.
    if active_violation_ticks_remaining <= 0:
        candidates = [unit for unit in STORAGE_UNITS if unit != active_violation_unit] or STORAGE_UNITS
        active_violation_unit = random.choice(candidates)
        current_violation_unit = active_violation_unit
        current_violation_unit_idx = STORAGE_UNITS.index(active_violation_unit)
        active_violation_ticks_remaining = _random_violation_ticks()


def next_temp(unit: str) -> float:
    if unit == active_violation_unit:
        # Randomly produce either a cold or hot violation.
        if random.random() < 0.5:
            return round(random.uniform(-1.0, 0.9), 2)
        return round(random.uniform(8.1, 12.0), 2)

    return round(random.uniform(2.3, 5.7), 2)


def consume_violation_tick():
    global active_violation_ticks_remaining
    active_violation_ticks_remaining = max(0, active_violation_ticks_remaining - 1)


def post_reading(storage_unit_id: str, temperature_c: float):
    payload = {
        "storage_unit_id": storage_unit_id,
        "temperature_c": temperature_c,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(
                f"{BACKEND_URL}/temperature/ingest",
                json=payload,
                timeout=(3, 15),
            )
            response.raise_for_status()
            status = "OK" if SAFE_MIN <= temperature_c <= SAFE_MAX else "OUT OF RANGE"
            print(f"[{storage_unit_id}] Temp: {temperature_c}C -> {status}")
            return
        except ReadTimeout as exc:
            if attempt == MAX_RETRIES:
                print(f"[{storage_unit_id}] Failed to send reading: {exc}")
                return
            time.sleep(RETRY_BACKOFF_SECONDS * attempt)
        except Exception as exc:
            print(f"[{storage_unit_id}] Failed to send reading: {exc}")
            return

    
def main():
    print(f"Simulator target backend: {BACKEND_URL}")
    print(f"Generating readings every {INTERVAL_SECONDS}s for {len(STORAGE_UNITS)} fridges across 2 blood banks.")
    while True:
        schedule_violation()
        print(
            f"Active violation fridge: {active_violation_unit} "
            f"(switch in ~{active_violation_ticks_remaining * INTERVAL_SECONDS}s)"
        )
        for unit in STORAGE_UNITS:
            temp = next_temp(unit)
            post_reading(unit, temp)
        consume_violation_tick()
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
