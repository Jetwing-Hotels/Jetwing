"""Singleton Supabase service-role client + helpers."""
from typing import Any

from supabase import Client, create_client

import config

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
    return _client


def fetch_all(table: str, columns: str = "*", page_size: int = 1000) -> list[dict[str, Any]]:
    """Read an entire table with range pagination."""
    sb = get_client()
    rows: list[dict[str, Any]] = []
    start = 0
    while True:
        resp = sb.table(table).select(columns).range(start, start + page_size - 1).execute()
        batch = resp.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        start += page_size
    return rows
