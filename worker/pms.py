"""
PMS (Property Management System) adapter.

The plan's `nightly_pms_etl` pulls new/updated bookings from the hotel PMS into
the `bookings` table. There is no PMS in this environment, so the default adapter
is a no-op. Implement `fetch_bookings()` against your real PMS API and the ETL
task will upsert whatever it returns.

Each returned booking dict should map to the `bookings` table columns. At minimum:
  pms_reservation_id (unique), customer_email, property_code, booking_channel,
  booking_date, check_in_date, check_out_date, length_of_stay, room_type,
  adults, total_room_revenue_lkr, total_revenue_lkr
The ETL resolves customer_id (by email) and property_id (by property_code).
"""
from datetime import datetime

import config


class PMSAdapter:
    def fetch_bookings(self, since: datetime | None = None) -> list[dict]:
        raise NotImplementedError


class MockPMSAdapter(PMSAdapter):
    """No-op adapter — returns nothing. Replace with a real implementation."""

    def fetch_bookings(self, since: datetime | None = None) -> list[dict]:
        return []


# Example of a real adapter shape (left commented — wire to your PMS):
#
# import requests
# class JetwingPMSAdapter(PMSAdapter):
#     def fetch_bookings(self, since=None):
#         params = {"updated_since": since.isoformat()} if since else {}
#         r = requests.get(f"{config.PMS_BASE_URL}/reservations",
#                          headers={"Authorization": f"Bearer {config.PMS_API_KEY}"},
#                          params=params, timeout=60)
#         r.raise_for_status()
#         return [_map(res) for res in r.json()["reservations"]]


def get_adapter() -> PMSAdapter:
    # Switch to your real adapter once PMS_BASE_URL/PMS_API_KEY are configured.
    if config.PMS_BASE_URL and config.PMS_API_KEY:
        # return JetwingPMSAdapter()
        pass
    return MockPMSAdapter()
