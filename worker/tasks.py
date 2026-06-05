"""Background tasks: PMS ETL, feature refresh, and the customer scoring pipeline."""
import logging
from datetime import datetime, timezone

from celery import shared_task

import config
import scoring_model
from pms import get_adapter
from supabase_client import fetch_all, get_client

log = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


# ── nightly_pms_etl ──────────────────────────────────────────────────────────
@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def nightly_pms_etl(self):
    """Pull new/updated bookings from the PMS and upsert them into `bookings`."""
    sb = get_client()
    bookings = get_adapter().fetch_bookings()
    if not bookings:
        log.info("PMS ETL: no bookings returned (mock adapter or nothing new).")
        return {"upserted": 0}

    # Resolve lookup maps once.
    props = {p["property_code"]: p["property_id"] for p in fetch_all("properties", "property_code, property_id")}
    custs = {c["email"]: c["customer_id"] for c in fetch_all("customers", "email, customer_id")}

    rows = []
    for b in bookings:
        property_id = props.get(b.get("property_code"))
        customer_id = custs.get(b.get("customer_email"))
        if not property_id or not customer_id:
            log.warning("PMS ETL: skipping booking %s (unknown property/customer)", b.get("pms_reservation_id"))
            continue
        rows.append({**{k: v for k, v in b.items() if k not in ("property_code", "customer_email")},
                     "property_id": property_id, "customer_id": customer_id})

    if rows:
        sb.table("bookings").upsert(rows, on_conflict="pms_reservation_id").execute()
    return {"upserted": len(rows)}


# ── refresh_customer_features ────────────────────────────────────────────────
@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def refresh_customer_features(self):
    """Recompute customer_features via the DB function (single source of truth)."""
    sb = get_client()
    resp = sb.rpc("refresh_customer_features").execute()
    return {"affected": resp.data}


# ── score_customers ──────────────────────────────────────────────────────────
@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def score_customers(self, refresh_first: bool = True):
    """Batch-score every customer and write rows to customer_scores."""
    sb = get_client()

    run = (
        sb.table("scoring_runs")
        .insert({"triggered_by": "SCHEDULER", "model_version": config.MODEL_VERSION, "status": "RUNNING"})
        .execute()
        .data[0]
    )
    run_id = run["scoring_run_id"]

    try:
        if refresh_first:
            sb.rpc("refresh_customer_features").execute()

        features = fetch_all("customer_features")
        scored = 0

        for batch in _chunks(features, config.SCORING_BATCH_SIZE):
            scores = scoring_model.score_rows(batch)
            payload = [
                {
                    "customer_id": row["customer_id"],
                    "scoring_run_id": run_id,
                    "composite_score": round(float(score), 2),
                    "score_tier": scoring_model.tier_for(score),
                    "model_version": config.MODEL_VERSION,
                }
                for row, score in zip(batch, scores)
            ]
            if payload:
                sb.table("customer_scores").insert(payload).execute()
                scored += len(payload)

        sb.table("scoring_runs").update(
            {"status": "COMPLETED", "customers_scored": scored, "completed_at": _now()}
        ).eq("scoring_run_id", run_id).execute()

        log.info("Scored %s customers (model=%s)", scored, "huggingface" if scoring_model.using_model() else "local-heuristic")
        return {"run_id": run_id, "scored": scored, "model": config.MODEL_VERSION}

    except Exception as exc:  # noqa: BLE001 — record failure on the run, then re-raise for retry/DLQ
        sb.table("scoring_runs").update(
            {"status": "FAILED", "error_log": str(exc), "completed_at": _now()}
        ).eq("scoring_run_id", run_id).execute()
        raise
