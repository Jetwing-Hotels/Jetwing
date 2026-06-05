"""Environment configuration for the Jetwing scoring/ETL worker."""
import os

from dotenv import load_dotenv

load_dotenv()

# ── Infra ────────────────────────────────────────────────────────────────────
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# ── Supabase (service role — bypasses RLS, this is the SYSTEM identity) ───────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# ── HuggingFace scoring model ────────────────────────────────────────────────
# If HF_SCORING_ENDPOINT is unset, the worker falls back to a local RFM heuristic
# so the pipeline is runnable before the model is deployed.
HF_SCORING_ENDPOINT = os.environ.get("HF_SCORING_ENDPOINT")  # e.g. https://xxxx.endpoints.huggingface.cloud
HF_API_TOKEN = os.environ.get("HF_API_TOKEN")
MODEL_VERSION = os.environ.get("HF_MODEL_VERSION", "heuristic-v1")

# ── PMS (Property Management System) ──────────────────────────────────────────
PMS_BASE_URL = os.environ.get("PMS_BASE_URL")
PMS_API_KEY = os.environ.get("PMS_API_KEY")

# ── Tuning ───────────────────────────────────────────────────────────────────
SCORING_BATCH_SIZE = int(os.environ.get("SCORING_BATCH_SIZE", "500"))
TIMEZONE = os.environ.get("WORKER_TIMEZONE", "Asia/Colombo")
