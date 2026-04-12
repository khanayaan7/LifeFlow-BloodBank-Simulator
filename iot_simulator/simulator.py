import random
import time
from datetime import datetime, timezone

import requests

BACKEND_URL = "http://localhost:8000"
STORAGE_UNITS = ["FRIDGE-A1", "FRIDGE-A2", "FRIDGE-B1", "FREEZER-C1"]
INTERVAL_SECONDS = 30
VIOLATION_EVERY_SECONDS = 120
VIOLATION_TICKS = max(1, VIOLATION_EVERY_SECONDS // INTERVAL_SECONDS)

current_violation_unit_idx = -1
active_violation_unit = None
active_violation_ticks_remaining = 0


def schedule_violation():
    global current_violation_unit_idx, active_violation_unit, active_violation_ticks_remaining

    # Keep exactly one storage unit in violation during each 2-minute window.
    if active_violation_ticks_remaining <= 0:
        current_violation_unit_idx = (current_violation_unit_idx + 1) % len(STORAGE_UNITS)
        active_violation_unit = STORAGE_UNITS[current_violation_unit_idx]
        active_violation_ticks_remaining = VIOLATION_TICKS


def next_temp(unit: str) -> float:
    if unit == active_violation_unit:
        return round(random.uniform(8.0, 12.0), 2)

    return round(random.uniform(2.5, 5.5), 2)


def consume_violation_tick():
    global active_violation_ticks_remaining
    active_violation_ticks_remaining = max(0, active_violation_ticks_remaining - 1)


def post_reading(storage_unit_id: str, temperature_c: float):
    payload = {
        "storage_unit_id": storage_unit_id,
        "temperature_c": temperature_c,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        response = requests.post(f"{BACKEND_URL}/temperature/ingest", json=payload, timeout=10)
        response.raise_for_status()
        status = "OK" if 2.0 <= temperature_c <= 6.0 else "OUT OF RANGE"
        print(f"[{storage_unit_id}] Temp: {temperature_c}C -> {status}")
    except Exception as exc:
        print(f"[{storage_unit_id}] Failed to send reading: {exc}")

    
def main():
    while True:
        schedule_violation()
        for unit in STORAGE_UNITS:
            temp = next_temp(unit)
            post_reading(unit, temp)
        consume_violation_tick()
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
