"""Celery application + Beat schedule for the Jetwing scoring/ETL worker."""
from celery import Celery
from celery.schedules import crontab

import config

app = Celery("jetwing", broker=config.REDIS_URL, backend=config.REDIS_URL)

app.conf.update(
    timezone=config.TIMEZONE,
    enable_utc=False,
    task_track_started=True,
    task_acks_late=True,                 # redeliver if a worker dies mid-task
    task_reject_on_worker_lost=True,
    broker_connection_retry_on_startup=True,
    task_default_retry_delay=30,
    result_expires=3600,
)

# Register tasks (shared_task definitions bind to this default app).
import tasks  # noqa: E402,F401

# ── Beat schedule (mirrors the plan; times are in TIMEZONE = Asia/Colombo) ────
app.conf.beat_schedule = {
    "nightly-pms-etl": {           # 00:30 — pull bookings from PMS
        "task": "tasks.nightly_pms_etl",
        "schedule": crontab(hour=0, minute=30),
    },
    "refresh-customer-features": {  # 02:00 — recompute feature vectors
        "task": "tasks.refresh_customer_features",
        "schedule": crontab(hour=2, minute=0),
    },
    "score-customers": {            # 03:00 — batch score → customer_scores
        "task": "tasks.score_customers",
        "schedule": crontab(hour=3, minute=0),
    },
}

# NOTE: monthly offer generation + expire_stale_offers are handled by Supabase
# pg_cron / pg_net (see supabase/scheduled_jobs.sql), not this worker. If you run
# refresh-customer-features here, disable the pg_cron one to avoid double work.
