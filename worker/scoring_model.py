"""
Customer scoring — wired to the deployed model:
  HiruniAyesha/jetwing-customer-ranker  (handler_v2 / feature_columns_v2.json)

⚠️  FEATURE CONTRACT — must match the model's feature_columns_v2.json EXACTLY.
The model's handler sends RAW values and applies its own log1p + QuantileTransformer
internally, so we send raw numbers (do NOT pre-transform here). 18 features, in order:

  idx  feature                  source (customer_features) / derivation
  ──────────────────────────────────────────────────────────────────────────────
   0   recency_days             recency_days
   1   frequency_total          frequency_total
   2   monetary_total           monetary_total_lkr
   3   monetary_avg_per_stay    monetary_avg_per_stay_lkr
   4   avg_length_of_stay       avg_length_of_stay
   5   avg_lead_time_days       avg_lead_time_days
   6   cancellation_ratio       cancellation_ratio
   7   direct_booking_ratio     direct_booking_ratio
   8   is_repeated_guest        1 if frequency_total > 1 else 0
   9   prev_completed_bookings  frequency_total
  10   avg_special_requests     0.0   (not tracked in customer_features yet)
  11   luxury_reserve_visits    luxury_reserve_visits
  12   premium_hotel_visits     premium_hotel_visits
  13   luxury_affinity_ratio    luxury / (luxury + premium)   (0 if none)
  14   eco_engagement_flag      0 / 1
  15   avg_adr                  monetary_avg_per_stay_lkr / max(1, avg_length_of_stay)
  16   high_season_preference   0 / 1
  17   domestic_guest           0 / 1

Endpoint I/O (HuggingFace Inference Endpoint, custom handler):
  POST {"inputs": [[...18 floats...], ...]}
   ->  {"scores": [87.3, ...], "top_10_pct": [true, ...]}   # scores are 0–100 percentiles
"""
import requests

import config

# Names in the model's order — for reference / logging only (vector is built below).
FEATURE_ORDER = [
    "recency_days", "frequency_total", "monetary_total", "monetary_avg_per_stay",
    "avg_length_of_stay", "avg_lead_time_days", "cancellation_ratio", "direct_booking_ratio",
    "is_repeated_guest", "prev_completed_bookings", "avg_special_requests",
    "luxury_reserve_visits", "premium_hotel_visits", "luxury_affinity_ratio",
    "eco_engagement_flag", "avg_adr", "high_season_preference", "domestic_guest",
]


def _f(v, default=0.0) -> float:
    try:
        return float(v) if v is not None else default
    except (TypeError, ValueError):
        return default


def build_vector(row: dict) -> list[float]:
    """Build the 18 raw features in the model's exact order from a customer_features row."""
    freq = _f(row.get("frequency_total"))
    lux = _f(row.get("luxury_reserve_visits"))
    prem = _f(row.get("premium_hotel_visits"))
    mon_avg = _f(row.get("monetary_avg_per_stay_lkr"))
    los = _f(row.get("avg_length_of_stay"))

    luxury_affinity = lux / (lux + prem) if (lux + prem) > 0 else 0.0
    avg_adr = mon_avg / los if los >= 1 else mon_avg

    return [
        _f(row.get("recency_days")),                 # 0
        freq,                                        # 1
        _f(row.get("monetary_total_lkr")),           # 2
        mon_avg,                                     # 3
        los,                                         # 4
        _f(row.get("avg_lead_time_days")),           # 5
        _f(row.get("cancellation_ratio")),           # 6
        _f(row.get("direct_booking_ratio")),         # 7
        1.0 if freq > 1 else 0.0,                    # 8  is_repeated_guest
        freq,                                        # 9  prev_completed_bookings
        0.0,                                         # 10 avg_special_requests (not tracked)
        lux,                                         # 11
        prem,                                        # 12
        luxury_affinity,                             # 13
        1.0 if row.get("eco_engagement_flag") else 0.0,   # 14
        avg_adr,                                     # 15
        1.0 if row.get("high_season_preference") else 0.0,  # 16
        1.0 if row.get("domestic_guest") else 0.0,   # 17
    ]


def tier_for(score: float) -> str:
    # Model score is a 0–100 percentile rank (top 10% ≥ 90).
    if score >= 80:
        return "Platinum"
    if score >= 60:
        return "Gold"
    if score >= 40:
        return "Silver"
    return "Standard"


# ── HuggingFace inference (split-on-failure to isolate bad records) ───────────
def _hf_call(vectors: list[list[float]]) -> list[float]:
    resp = requests.post(
        config.HF_SCORING_ENDPOINT,
        headers={"Authorization": f"Bearer {config.HF_API_TOKEN}", "Content-Type": "application/json"},
        json={"inputs": vectors},
        timeout=60,
    )
    resp.raise_for_status()
    scores = resp.json()["scores"]  # the handler also returns "top_10_pct"; we only need scores
    if len(scores) != len(vectors):
        raise ValueError(f"endpoint returned {len(scores)} scores for {len(vectors)} inputs")
    return [float(s) for s in scores]


def _hf_safe(vectors: list[list[float]]) -> list[float]:
    try:
        return _hf_call(vectors)
    except Exception:
        if len(vectors) <= 1:
            return [0.0] * len(vectors)
        mid = len(vectors) // 2
        return _hf_safe(vectors[:mid]) + _hf_safe(vectors[mid:])


# ── Local fallback (used only until the endpoint URL is set) ──────────────────
def _local(row: dict) -> float:
    rec = _f(row.get("recency_days"))
    freq = _f(row.get("frequency_total"))
    mon = _f(row.get("monetary_total_lkr"))
    r = 30.0 if rec < 90 else 18.0 if rec < 270 else 6.0
    f = min(30.0, freq * 8.0)
    m = min(40.0, (mon / 1_000_000.0) * 8.0)
    return max(0.0, min(100.0, r + f + m))


def score_rows(rows: list[dict]) -> list[float]:
    """Score customer_features rows. Uses the HF model if configured, else local heuristic."""
    if config.HF_SCORING_ENDPOINT and config.HF_API_TOKEN:
        return _hf_safe([build_vector(r) for r in rows])
    return [_local(r) for r in rows]


def using_model() -> bool:
    return bool(config.HF_SCORING_ENDPOINT and config.HF_API_TOKEN)
