"""
HuggingFace Inference Handler — Jetwing Symphony Customer Scorer v2
====================================================================
Continuous uniform scoring — score = percentile rank (0–100).
Top 10% is always score >= 90.0.

Upload alongside: jetwing_scorer_v2.pkl, jetwing_transformers_v2.pkl,
                  feature_columns_v2.json

POST body:
  {"inputs": [[f1, f2, ..., f18], ...]}   # one array per customer
  Feature order: ['recency_days', 'frequency_total', 'monetary_total', 'monetary_avg_per_stay', 'avg_length_of_stay', 'avg_lead_time_days', 'cancellation_ratio', 'direct_booking_ratio', 'is_repeated_guest', 'prev_completed_bookings', 'avg_special_requests', 'luxury_reserve_visits', 'premium_hotel_visits', 'luxury_affinity_ratio', 'eco_engagement_flag', 'avg_adr', 'high_season_preference', 'domestic_guest']

Response:
  {"scores": [87.3, 45.1, 12.7, ...]}
"""
import json, numpy as np, joblib
from pathlib import Path

class EndpointHandler:
    def __init__(self, path=""):
        p = Path(path)
        self.model        = joblib.load(p / "jetwing_scorer_v2.pkl")
        self.transformers = joblib.load(p / "jetwing_transformers_v2.pkl")
        with open(p / "feature_columns_v2.json") as f:
            meta = json.load(f)
        self.features  = meta["feature_columns"]
        self.cutoff    = meta["top_10_pct_cutoff"]

    def _apply_transforms(self, arr):
        """
        Replicate the training-time feature transforms using saved QTs.
        This ensures new customers are scored on the SAME scale as training.
        """
        recency_capped = arr[:, 0].clip(0, 730)
        r_s = 1.0 - self.transformers["recency"].transform(
                recency_capped.reshape(-1,1)).flatten()
        f_s = self.transformers["frequency"].transform(
                np.log1p(arr[:, 1]).reshape(-1,1)).flatten()
        m_s = self.transformers["monetary"].transform(
                np.log1p(arr[:, 2]).reshape(-1,1)).flatten()
        base = 0.25*r_s + 0.35*f_s + 0.4*m_s

        loyalty_raw = arr[:,8]*0.45 + arr[:,7]*0.35 + (
            np.log1p(arr[:,9]) /
            (np.log1p(arr[:,9]).max() + 1e-9)) * 0.20
        l_s = self.transformers["loyalty"].transform(
                loyalty_raw.reshape(-1,1)).flatten()

        engagement_raw = arr[:,10]*0.45 + (arr[:,4]/(arr[:,4].max()+1e-9))*0.35 + arr[:,14]*0.20
        e_s = self.transformers["engagement"].transform(
                engagement_raw.reshape(-1,1)).flatten()

        lux_s = self.transformers["luxury"].transform(arr[:,13].reshape(-1,1)).flatten()

        bonus = 0.12*l_s + 0.08*e_s + 0.05*lux_s
        raw   = base * (1.0 + bonus)
        cancel_penalty = arr[:,6] * 0.15
        penalised = np.clip(raw - cancel_penalty * raw, 0, None)
        final = self.transformers["final"].transform(penalised.reshape(-1,1)).flatten()
        return np.clip(final * 100.0, 0, 100)

    def __call__(self, data: dict) -> dict:
        inputs = data.get("inputs", [])
        if not inputs:
            return {"scores": [], "error": "No inputs"}
        arr = np.array(inputs, dtype=np.float32)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
        scores = self._apply_transforms(arr).round(2).tolist()
        return {
            "scores": scores,
            "top_10_pct": [s >= self.cutoff for s in scores]
        }
