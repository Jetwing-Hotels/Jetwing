# Jetwing Scoring & ETL Worker (Celery)

Background pipeline for **Module B** of the Guest Intelligence Layer:
- `nightly_pms_etl` — pulls bookings from the PMS into `bookings` (00:30)
- `refresh_customer_features` — recomputes feature vectors via the DB function (02:00)
- `score_customers` — batch-scores every customer via the HuggingFace model and writes `customer_scores` (03:00)

It authenticates to Supabase with the **service-role key** (the `SYSTEM` identity → bypasses RLS). Until the ML model is deployed, scoring falls back to a local RFM heuristic so the pipeline runs end-to-end today.

## Run it

```bash
cd worker
cp .env.example .env          # fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
docker compose up --build     # starts redis + worker + beat (+ flower on :5555)
```

Trigger a scoring run immediately (instead of waiting for 03:00):

```bash
docker compose exec worker python -c "import tasks; print(tasks.score_customers.delay().id)"
# or run synchronously:
docker compose exec worker python -c "import tasks; print(tasks.score_customers.run())"
```

Local (no Docker):

```bash
pip install -r requirements.txt
celery -A celery_app worker --loglevel=info        # terminal 1
celery -A celery_app beat   --loglevel=info        # terminal 2 (needs a Redis running)
```

## Reliability (per the plan)
- Tasks use exponential backoff, **max 3 retries** (`autoretry_for=(Exception,)`).
- HF batch calls **split in half on failure** to isolate bad records (`scoring_model._hf_safe`).
- `task_acks_late` + `task_reject_on_worker_lost` redeliver work if a worker dies.
- Failures are written to `scoring_runs.error_log` and re-raised so Celery can retry / dead-letter.

---

# 🤖 The scoring model (integrated)

The worker is wired to **[`HiruniAyesha/jetwing-customer-ranker`](https://huggingface.co/HiruniAyesha/jetwing-customer-ranker)** (`handler_v2`). The model scores customers as a **0–100 percentile rank** (mean 50; top 10% ≥ 90) using its own internal `log1p` + QuantileTransformer pipeline — so the worker sends **raw** feature values.

### Feature contract (matches `feature_columns_v2.json` and `scoring_model.build_vector()`)
18 raw features, in this exact order. The handler indexes them positionally, so order is load-bearing.

| idx | feature | from `customer_features` / derivation |
| --- | --- | --- |
| 0 | recency_days | recency_days |
| 1 | frequency_total | frequency_total |
| 2 | monetary_total | monetary_total_lkr |
| 3 | monetary_avg_per_stay | monetary_avg_per_stay_lkr |
| 4 | avg_length_of_stay | avg_length_of_stay |
| 5 | avg_lead_time_days | avg_lead_time_days |
| 6 | cancellation_ratio | cancellation_ratio |
| 7 | direct_booking_ratio | direct_booking_ratio |
| 8 | is_repeated_guest | `1 if frequency_total > 1` |
| 9 | prev_completed_bookings | frequency_total |
| 10 | avg_special_requests | `0.0` (not tracked yet) |
| 11 | luxury_reserve_visits | luxury_reserve_visits |
| 12 | premium_hotel_visits | premium_hotel_visits |
| 13 | luxury_affinity_ratio | `luxury / (luxury + premium)` |
| 14 | eco_engagement_flag | 0/1 |
| 15 | avg_adr | `monetary_avg_per_stay_lkr / max(1, avg_length_of_stay)` |
| 16 | high_season_preference | 0/1 |
| 17 | domestic_guest | 0/1 |

> Five fields (`is_repeated_guest`, `prev_completed_bookings`, `avg_special_requests`, `luxury_affinity_ratio`, `avg_adr`) aren't stored directly, so the worker derives them. To improve fidelity later, add real `avg_special_requests` and `avg_adr` columns to `customer_features` (compute them in `refresh_customer_features()`), then update `build_vector()`.

### Endpoint I/O
```
POST  { "inputs": [[...18 floats...], ...] }
200   { "scores": [87.3, ...], "top_10_pct": [true, ...] }   # worker uses "scores"
```

### Deploy + connect (3 steps)
1. On the model page → **Deploy → Inference Endpoints** → create a **Dedicated** endpoint (the custom `handler_v2.py` runs there; the serverless API won't, since there's no standard pipeline). Copy the endpoint URL.
2. Put the values in `worker/.env`:
   ```
   HF_SCORING_ENDPOINT=https://xxxx.endpoints.huggingface.cloud
   HF_API_TOKEN=hf_...
   HF_MODEL_VERSION=jetwing-customer-ranker-v2
   ```
3. `docker compose restart worker beat` — `score_customers` now batches real vectors to the endpoint and writes tiers (Platinum ≥80, Gold ≥60, Silver ≥40, else Standard) into `customer_scores`. No code change needed.

Until step 2 is done, scoring uses the local RFM heuristic so the pipeline still runs.
