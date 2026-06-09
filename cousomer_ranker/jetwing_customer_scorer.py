"""
=============================================================================
  Jetwing Symphony PLC — Customer Scoring Model  v2.0
  Continuous Score Edition
=============================================================================

  Core change from v1
  ───────────────────
  v1 used MinMaxScaler on each RFM dimension independently. Because real
  booking data is heavily right-skewed (a few guests spend 10x the median),
  MinMaxScaler compresses 90% of customers into the middle of the range —
  producing clumped scores where the difference between a good and a great
  customer is only 3–4 points.

  v2 uses QuantileTransformer on every sub-dimension before weighting, then
  applies a final QuantileTransformer pass on the composite itself. This
  forces the final score to be uniformly spread across 0–100, meaning:

    · Every decile contains exactly 10% of customers
    · Score differences between customers are meaningful at every point
    · The top 10% cutoff is always score >= 90.0 (no moving threshold)
    · The model learns to predict a properly spread target — not a clump

  The trade-off: individual scores only have meaning RELATIVE to other
  customers in the same scoring run, not in absolute terms. A score of 75
  means "this customer is in the 75th percentile" — which is exactly what
  we want for ranking and filtering.

  Dataset : Hotel Booking Demand (Nuno Antonio et al., 2019)
  Kaggle  : https://www.kaggle.com/datasets/jessemostipak/hotel-booking-demand

  Usage
  ─────
  pip install pandas numpy scikit-learn xgboost matplotlib joblib scipy

  python jetwing_customer_scorer_v2.py --data hotel_bookings.csv
=============================================================================
"""

import argparse
import json
import os
import warnings
from datetime import datetime

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.preprocessing import QuantileTransformer
from xgboost import XGBRegressor

warnings.filterwarnings("ignore")

RANDOM_SEED = 42

# ─── RFM dimension weights (must sum to 1.0) ──────────────────────────────────
WEIGHT_RECENCY = 0.25  # How recently they stayed
WEIGHT_FREQUENCY = 0.35  # How often they stay
WEIGHT_MONETARY = 0.40  # How much they spend

# ─── Supplementary signal weights (applied as additive bonus) ─────────────────
WEIGHT_LOYALTY = 0.12  # Direct bookings + repeat guest flag
WEIGHT_ENGAGEMENT = 0.08  # Special requests + long stays + eco flag
WEIGHT_LUXURY_AFFIN = 0.05  # Resort/luxury property preference

# ─── Top-N% threshold ─────────────────────────────────────────────────────────
# Because scores are uniformly distributed, this is always a fixed cutoff.
TOP_PCT_THRESHOLD = 90.0  # score >= 90 → top 10%

MODEL_FEATURES = [
    "recency_days",
    "frequency_total",
    "monetary_total",
    "monetary_avg_per_stay",
    "avg_length_of_stay",
    "avg_lead_time_days",
    "cancellation_ratio",
    "direct_booking_ratio",
    "is_repeated_guest",
    "prev_completed_bookings",
    "avg_special_requests",
    "luxury_reserve_visits",
    "premium_hotel_visits",
    "luxury_affinity_ratio",
    "eco_engagement_flag",
    "avg_adr",
    "high_season_preference",
    "domestic_guest",
]


# ─────────────────────────────────────────────────────────────────────────────
#  STEP 1 — LOAD & CLEAN
# ─────────────────────────────────────────────────────────────────────────────


def load_and_clean(path: str) -> pd.DataFrame:
    print("\n[1/7] Loading and cleaning dataset...")
    df = pd.read_csv(path)
    print(f"      Raw shape: {df.shape}")

    df = df[(df["stays_in_weekend_nights"] + df["stays_in_week_nights"]) > 0]
    df = df[~((df["adr"] <= 0) & (df["is_canceled"] == 0))]
    df = df[df["adr"] < 5500]

    df["children"] = df["children"].fillna(0)
    df["country"] = df["country"].fillna("UNK")
    df["agent"] = df["agent"].fillna(0)
    df["company"] = df["company"].fillna(0)

    month_map = {
        "January": 1,
        "February": 2,
        "March": 3,
        "April": 4,
        "May": 5,
        "June": 6,
        "July": 7,
        "August": 8,
        "September": 9,
        "October": 10,
        "November": 11,
        "December": 12,
    }
    df["arrival_month_num"] = df["arrival_date_month"].map(month_map)
    df["arrival_date"] = pd.to_datetime(
        dict(
            year=df["arrival_date_year"],
            month=df["arrival_month_num"],
            day=df["arrival_date_day_of_month"],
        )
    )
    df["total_nights"] = df["stays_in_weekend_nights"] + df["stays_in_week_nights"]
    df["booking_value"] = df["adr"] * df["total_nights"]

    print(f"      Clean shape: {df.shape}")
    return df


# ─────────────────────────────────────────────────────────────────────────────
#  STEP 2 — SIMULATE GUEST IDs  (remove when using real PMS data)
# ─────────────────────────────────────────────────────────────────────────────


def simulate_guest_ids(df: pd.DataFrame) -> pd.DataFrame:
    print("\n[2/7] Simulating guest IDs...")
    df["_fp"] = (
        df["country"].astype(str)
        + "|"
        + df["adults"].astype(str)
        + "|"
        + df["children"].astype(str)
        + "|"
        + df["market_segment"].astype(str)
        + "|"
        + df["distribution_channel"].astype(str)
        + "|"
        + df["is_repeated_guest"].astype(str)
        + "|"
        + (df["agent"] // 10 * 10).astype(str)
    )
    fp_to_id = {fp: idx for idx, fp in enumerate(df["_fp"].unique(), start=1)}
    df["guest_id"] = df["_fp"].map(fp_to_id)
    df.drop(columns=["_fp"], inplace=True)
    n_multi = df.groupby("guest_id").size()
    print(f"      Unique guests   : {df['guest_id'].nunique():,}")
    print(f"      Avg bookings    : {n_multi.mean():.2f}")
    return df


# ─────────────────────────────────────────────────────────────────────────────
#  STEP 3 — FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────────────────────


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    print("\n[3/7] Engineering guest-level features...")

    REF = df["arrival_date"].max() + pd.Timedelta(days=1)
    g = df.groupby("guest_id")
    completed = df[df["is_canceled"] == 0]

    features = pd.DataFrame(index=df["guest_id"].unique())
    features.index.name = "guest_id"

    # RFM
    last_stay = completed.groupby("guest_id")["arrival_date"].max()
    features["recency_days"] = (REF - last_stay).dt.days.reindex(
        features.index, fill_value=9999
    )
    freq = completed.groupby("guest_id").size()
    features["frequency_total"] = freq.reindex(features.index, fill_value=0)
    mon = completed.groupby("guest_id")["booking_value"].sum()
    features["monetary_total"] = mon.reindex(features.index, fill_value=0)
    features["monetary_avg_per_stay"] = np.where(
        features["frequency_total"] > 0,
        features["monetary_total"] / features["frequency_total"],
        0,
    )

    # Behaviour
    features["avg_length_of_stay"] = (
        completed.groupby("guest_id")["total_nights"]
        .mean()
        .reindex(features.index, fill_value=0)
    )
    features["avg_lead_time_days"] = (
        g["lead_time"].mean().reindex(features.index, fill_value=0)
    )

    total_bookings = g.size()
    cancelled = g["is_canceled"].sum()
    features["cancellation_ratio"] = (cancelled / total_bookings).reindex(
        features.index, fill_value=0
    )

    df["_is_direct"] = (
        df["distribution_channel"].isin(["Direct", "Corporate"]).astype(int)
    )
    features["direct_booking_ratio"] = (
        df.groupby("guest_id")["_is_direct"]
        .mean()
        .reindex(features.index, fill_value=0)
    )

    features["is_repeated_guest"] = (
        g["is_repeated_guest"].max().reindex(features.index, fill_value=0)
    )
    features["prev_completed_bookings"] = (
        g["previous_bookings_not_canceled"].max().reindex(features.index, fill_value=0)
    )
    features["avg_special_requests"] = (
        g["total_of_special_requests"].mean().reindex(features.index, fill_value=0)
    )

    resort = completed[completed["hotel"] == "Resort Hotel"].groupby("guest_id").size()
    city = completed[completed["hotel"] == "City Hotel"].groupby("guest_id").size()
    features["luxury_reserve_visits"] = resort.reindex(features.index, fill_value=0)
    features["premium_hotel_visits"] = city.reindex(features.index, fill_value=0)
    features["luxury_affinity_ratio"] = features["luxury_reserve_visits"] / (
        features["luxury_reserve_visits"] + features["premium_hotel_visits"] + 1e-9
    )

    features["eco_engagement_flag"] = (
        (features["direct_booking_ratio"] > 0.5)
        & (features["luxury_reserve_visits"] > 0)
        & (features["avg_special_requests"] >= 1)
    ).astype(int)

    features["avg_adr"] = (
        completed.groupby("guest_id")["adr"]
        .mean()
        .reindex(features.index, fill_value=0)
    )

    peak_months = {12, 1, 2, 3, 4}
    completed_copy = completed.copy()
    completed_copy["_is_peak"] = (
        completed_copy["arrival_month_num"].isin(peak_months).astype(int)
    )
    peak_pref = completed_copy.groupby("guest_id")["_is_peak"].mean()
    features["high_season_preference"] = (
        peak_pref.reindex(features.index, fill_value=0) >= 0.5
    ).astype(int)

    most_common_country = g["country"].agg(
        lambda x: x.mode()[0] if len(x) > 0 else "UNK"
    )
    features["domestic_guest"] = (
        most_common_country.reindex(features.index, fill_value="UNK") == "PRT"
    ).astype(int)

    df.drop(columns=["_is_direct"], inplace=True, errors="ignore")
    features = features.reset_index().fillna(0)
    print(f"      Feature matrix shape: {features.shape}")
    return features


# ─────────────────────────────────────────────────────────────────────────────
#  STEP 4 — BUILD CONTINUOUS COMPOSITE SCORE (0–100, uniformly distributed)
# ─────────────────────────────────────────────────────────────────────────────


def build_continuous_scores(features: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Produces a composite score that is:

      (a) Properly continuous  — no discrete jumps or tier cliffs
      (b) Uniformly spread     — every 10-point band contains ~10% of customers
      (c) Stable               — the same customer will score similarly across
                                 monthly scoring runs if their behaviour hasn't
                                 changed (we save the fitted transformers and
                                 reuse them at inference time)

    Pipeline per dimension:
      raw feature  →  log1p (compress skew)  →  QuantileTransformer (uniform)
                   →  weighted sum  →  penalty  →  final QuantileTransformer
                   →  ×100  =  score in [0, 100]

    The final QuantileTransformer is what guarantees uniform spread.
    It is saved to disk so that new customers scored at inference time
    are placed on the same scale as the training population.
    """
    print("\n[4/7] Building continuous composite scores...")

    # Only score guests who completed at least one stay
    active = features[features["frequency_total"] > 0].copy()
    print(f"      Scoreable guests: {len(active):,}")

    # ── Helper: fit a uniform QuantileTransformer and transform ───────────────
    def qt_scale(
        values: np.ndarray, n_q: int = 1000
    ) -> tuple[np.ndarray, QuantileTransformer]:
        """Fit QT on values, return scaled [0,1] array + fitted transformer."""
        n_q = min(n_q, len(values))
        qt = QuantileTransformer(
            n_quantiles=n_q,
            output_distribution="uniform",
            random_state=RANDOM_SEED,
        )
        scaled = qt.fit_transform(values.reshape(-1, 1)).flatten()
        return scaled, qt

    transformers = {}  # save every fitted transformer for inference

    # ── Recency: invert (lower days → higher score) ───────────────────────────
    # Cap at 730 days so extreme outliers don't distort the distribution
    recency_capped = active["recency_days"].clip(upper=730).values
    r_scaled, transformers["recency"] = qt_scale(recency_capped)
    recency_score = 1.0 - r_scaled  # invert: recent = high score

    # ── Frequency: log-compress then quantile-scale ───────────────────────────
    freq_log = np.log1p(active["frequency_total"].values)
    frequency_score, transformers["frequency"] = qt_scale(freq_log)

    # ── Monetary: log-compress then quantile-scale ────────────────────────────
    monetary_log = np.log1p(active["monetary_total"].values)
    monetary_score, transformers["monetary"] = qt_scale(monetary_log)

    # ── Weighted RFM base ─────────────────────────────────────────────────────
    base_score = (
        WEIGHT_RECENCY * recency_score
        + WEIGHT_FREQUENCY * frequency_score
        + WEIGHT_MONETARY * monetary_score
    )

    # ── Loyalty bonus: direct bookings, repeat flag, prior history ────────────
    loyalty_raw = (
        active["is_repeated_guest"].values * 0.45
        + active["direct_booking_ratio"].values * 0.35
        + np.log1p(active["prev_completed_bookings"].values)
        / (np.log1p(active["prev_completed_bookings"].values.max()) + 1e-9)
        * 0.20
    )
    loyalty_score, transformers["loyalty"] = qt_scale(loyalty_raw)

    # ── Engagement bonus: special requests, long stays, eco flag ─────────────
    engagement_raw = (
        active["avg_special_requests"].values * 0.45
        + (
            active["avg_length_of_stay"].values
            / (active["avg_length_of_stay"].values.max() + 1e-9)
        )
        * 0.35
        + active["eco_engagement_flag"].values * 0.20
    )
    engagement_score, transformers["engagement"] = qt_scale(engagement_raw)

    # ── Luxury affinity bonus ─────────────────────────────────────────────────
    luxury_score, transformers["luxury"] = qt_scale(
        active["luxury_affinity_ratio"].values
    )

    # ── Combined supplementary bonus [0, 1] ───────────────────────────────────
    bonus = (
        WEIGHT_LOYALTY * loyalty_score
        + WEIGHT_ENGAGEMENT * engagement_score
        + WEIGHT_LUXURY_AFFIN * luxury_score
    )

    # ── Raw composite: base amplified by bonus ────────────────────────────────
    raw_composite = base_score * (1.0 + bonus)

    # ── Cancellation penalty: up to –15 points of effective composite ─────────
    # We apply it BEFORE the final quantile transform so heavy cancellers
    # are genuinely pushed down the ranking, not just penalised on paper
    cancel_penalty = active["cancellation_ratio"].values * 0.15
    penalised = np.clip(raw_composite - cancel_penalty * raw_composite, 0, None)

    # ── Final quantile transform → guarantees uniform spread 0–1 ─────────────
    # This is the key step: after this, exactly 10% of customers have
    # a score >= 0.9, exactly 50% >= 0.5, etc. — regardless of input skew.
    final_scaled, transformers["final"] = qt_scale(penalised)
    composite_score = final_scaled * 100.0  # → [0, 100]

    active = active.copy()
    active["recency_score"] = recency_score
    active["frequency_score"] = frequency_score
    active["monetary_score"] = monetary_score
    active["loyalty_score"] = loyalty_score
    active["engagement_score"] = engagement_score
    active["luxury_score"] = luxury_score
    active["base_score"] = base_score
    active["bonus_score"] = bonus
    active["composite_score"] = composite_score

    # ── Percentile rank (redundant with uniform score, but useful for display) ─
    # Because the final QT guarantees uniformity, composite_score IS the
    # percentile rank (score 75 → 75th percentile). We store it explicitly.
    active["percentile_rank"] = composite_score.round(2)

    # ── Top-10% flag ──────────────────────────────────────────────────────────
    # With a uniform distribution this is always score >= 90.0 — no threshold
    # tuning required across different datasets or retraining runs.
    active["top_10_pct"] = active["composite_score"] >= TOP_PCT_THRESHOLD

    # ── Merge zero-stay guests back with score = 0 ────────────────────────────
    scored = features.merge(
        active[
            [
                "guest_id",
                "recency_score",
                "frequency_score",
                "monetary_score",
                "loyalty_score",
                "engagement_score",
                "luxury_score",
                "base_score",
                "composite_score",
                "percentile_rank",
                "top_10_pct",
            ]
        ],
        on="guest_id",
        how="left",
    )
    scored[["composite_score", "percentile_rank"]] = scored[
        ["composite_score", "percentile_rank"]
    ].fillna(0)
    scored["top_10_pct"] = scored["top_10_pct"].fillna(False)

    # ── Diagnostics ───────────────────────────────────────────────────────────
    cs = active["composite_score"]
    print(f"\n      Score distribution (active guests only):")
    print(f"        Min    : {cs.min():.2f}")
    print(f"        Max    : {cs.max():.2f}")
    print(f"        Mean   : {cs.mean():.2f}  (expect ~50.0 with uniform dist)")
    print(f"        Std    : {cs.std():.2f}   (expect ~28.9 with uniform dist)")
    deciles = np.percentile(cs, np.arange(10, 100, 10))
    print(f"        Deciles: {[round(d, 1) for d in deciles]}")
    print(f"        Top 10% cutoff : >= {TOP_PCT_THRESHOLD}")
    print(f"        Top 10% count  : {active['top_10_pct'].sum():,} / {len(active):,}")

    return scored, transformers


# ─────────────────────────────────────────────────────────────────────────────
#  STEP 5 — TRAIN XGBOOST REGRESSOR
#  Target: composite_score (uniformly distributed 0–100)
# ─────────────────────────────────────────────────────────────────────────────


def train_model(scored: pd.DataFrame):
    print("\n[5/7] Training XGBoost regressor...")

    train_df = scored[scored["frequency_total"] > 0].copy()
    X = train_df[MODEL_FEATURES]
    y = train_df["composite_score"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED
    )

    model = XGBRegressor(
        n_estimators=600,
        learning_rate=0.04,
        max_depth=5,
        min_child_weight=5,
        subsample=0.75,
        colsample_bytree=0.75,
        gamma=0.15,
        reg_alpha=0.2,
        reg_lambda=1.5,
        objective="reg:squarederror",
        eval_metric="rmse",
        early_stopping_rounds=40,
        random_state=RANDOM_SEED,
        n_jobs=-1,
        verbosity=0,
    )

    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
    print(f"      Best iteration : {model.best_iteration}")

    # ── Cross-validation ──────────────────────────────────────────────────────
    cv_model = XGBRegressor(
        n_estimators=model.best_iteration,
        learning_rate=0.04,
        max_depth=5,
        min_child_weight=5,
        subsample=0.75,
        colsample_bytree=0.75,
        gamma=0.15,
        reg_alpha=0.2,
        reg_lambda=1.5,
        objective="reg:squarederror",
        random_state=RANDOM_SEED,
        n_jobs=-1,
        verbosity=0,
    )
    kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
    cv_r2 = cross_val_score(cv_model, X, y, cv=kf, scoring="r2")
    cv_mae = cross_val_score(cv_model, X, y, cv=kf, scoring="neg_mean_absolute_error")
    print(f"      5-Fold CV R²   : {cv_r2.mean():.4f} ± {cv_r2.std():.4f}")
    print(f"      5-Fold CV MAE  : {(-cv_mae).mean():.4f} ± {(-cv_mae).std():.4f}")

    y_pred = np.clip(model.predict(X_test), 0, 100)
    print(f"      Test R²        : {r2_score(y_test, y_pred):.4f}")
    print(f"      Test MAE       : {mean_absolute_error(y_test, y_pred):.4f}")

    return model, X_test, y_test, y_pred, train_df


# ─────────────────────────────────────────────────────────────────────────────
#  STEP 6 — VISUALISE
# ─────────────────────────────────────────────────────────────────────────────


def visualise(model, scored, X_test, y_test, y_pred, train_df, out_dir):
    print("\n[6/7] Generating evaluation plots...")
    os.makedirs(out_dir, exist_ok=True)

    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    fig.suptitle(
        "Jetwing Symphony — Continuous Customer Scoring Model (v2)",
        fontsize=15,
        fontweight="bold",
        color="#1B5E20",
    )

    active = train_df[train_df["frequency_total"] > 0]

    # ── Plot 1: Score histogram — should look flat/uniform ────────────────────
    ax = axes[0, 0]
    ax.hist(
        active["composite_score"],
        bins=50,
        color="#558B2F",
        edgecolor="white",
        linewidth=0.4,
    )
    # Add top-10% shading
    ax.axvspan(
        TOP_PCT_THRESHOLD,
        100,
        alpha=0.25,
        color="#FFA000",
        label=f"Top 10% (≥ {TOP_PCT_THRESHOLD})",
    )
    ax.axvline(TOP_PCT_THRESHOLD, color="#FFA000", linestyle="--", linewidth=1.5)
    ax.set_title("Score Distribution (uniform = good)", fontweight="bold")
    ax.set_xlabel("Composite Score (0–100)")
    ax.set_ylabel("Count")
    ax.legend()
    n_top = (active["composite_score"] >= TOP_PCT_THRESHOLD).sum()
    ax.text(
        91,
        ax.get_ylim()[1] * 0.85,
        f"Top 10%\nn={n_top:,}",
        fontsize=9,
        color="#E65100",
        fontweight="bold",
    )

    # ── Plot 2: Predicted vs Actual ───────────────────────────────────────────
    ax = axes[0, 1]
    ax.scatter(y_test, y_pred, alpha=0.25, s=8, color="#2E7D32")
    mn, mx = 0, 100
    ax.plot([mn, mx], [mn, mx], "r--", linewidth=1.5, label="Perfect fit")
    r2 = r2_score(y_test, y_pred)
    ax.set_title(f"Predicted vs Actual  (R² = {r2:.3f})", fontweight="bold")
    ax.set_xlabel("Actual Score")
    ax.set_ylabel("Predicted Score")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.legend()

    # ── Plot 3: Residuals ─────────────────────────────────────────────────────
    ax = axes[0, 2]
    residuals = y_pred - y_test
    ax.hist(residuals, bins=50, color="#558B2F", edgecolor="white", linewidth=0.4)
    ax.axvline(0, color="red", linestyle="--", linewidth=1.5)
    mae_val = mean_absolute_error(y_test, y_pred)
    ax.set_title("Residuals (Predicted − Actual)", fontweight="bold")
    ax.set_xlabel("Residual")
    ax.set_ylabel("Count")
    ax.text(
        0.05,
        0.92,
        f"MAE = {mae_val:.2f}",
        transform=ax.transAxes,
        fontsize=10,
        color="red",
    )

    # ── Plot 4: Feature importances ───────────────────────────────────────────
    ax = axes[1, 0]
    importances = pd.Series(
        model.feature_importances_, index=MODEL_FEATURES
    ).sort_values()
    colors_bar = [
        "#1B5E20" if v > importances.median() else "#A5D6A7" for v in importances
    ]
    importances.plot(kind="barh", ax=ax, color=colors_bar)
    ax.set_title("Feature Importance (XGBoost Gain)", fontweight="bold")
    ax.set_xlabel("Importance")

    # ── Plot 5: Score decile counts — should be uniform ───────────────────────
    ax = axes[1, 1]
    bins = np.arange(0, 101, 10)
    counts, _ = np.histogram(active["composite_score"], bins=bins)
    bar_colors = ["#FFA000" if b >= TOP_PCT_THRESHOLD else "#558B2F" for b in bins[:-1]]
    bars = ax.bar(
        bins[:-1],
        counts,
        width=9.5,
        align="edge",
        color=bar_colors,
        edgecolor="white",
        linewidth=0.5,
    )
    ax.axvline(
        TOP_PCT_THRESHOLD,
        color="#E65100",
        linestyle="--",
        linewidth=1.5,
        label=f"Top 10% cutoff (≥{TOP_PCT_THRESHOLD})",
    )
    ax.set_title(
        "Customers per Score Decile\n(uniform = each bar ≈ same height)",
        fontweight="bold",
    )
    ax.set_xlabel("Score Band")
    ax.set_ylabel("Customer Count")
    ax.legend(fontsize=8)
    # Annotate each bar with %
    total = counts.sum()
    for bar, cnt in zip(bars, counts):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + total * 0.003,
            f"{cnt / total * 100:.1f}%",
            ha="center",
            va="bottom",
            fontsize=7,
        )

    # ── Plot 6: Sub-score contributions for top vs rest ───────────────────────
    ax = axes[1, 2]
    top = active[active["top_10_pct"] == True]
    rest = active[active["top_10_pct"] == False]
    dims = [
        "recency_score",
        "frequency_score",
        "monetary_score",
        "loyalty_score",
        "engagement_score",
    ]
    labels = ["Recency", "Frequency", "Monetary", "Loyalty", "Engagement"]
    x = np.arange(len(dims))
    w = 0.38
    ax.bar(
        x - w / 2,
        [top[d].mean() for d in dims],
        w,
        label="Top 10%",
        color="#1B5E20",
        alpha=0.85,
    )
    ax.bar(
        x + w / 2,
        [rest[d].mean() for d in dims],
        w,
        label="Rest 90%",
        color="#A5D6A7",
        alpha=0.85,
    )
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=9)
    ax.set_ylim(0, 1.15)
    ax.set_title("Avg Sub-Scores: Top 10% vs Rest", fontweight="bold")
    ax.set_ylabel("Normalised Score (0–1)")
    ax.legend()

    plt.tight_layout()
    path = os.path.join(out_dir, "model_evaluation_v2.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"      Saved: {path}")


# ─────────────────────────────────────────────────────────────────────────────
#  STEP 7 — SAVE ARTEFACTS
# ─────────────────────────────────────────────────────────────────────────────


def save_artefacts(model, transformers, scored, out_dir):
    print("\n[7/7] Saving artefacts...")
    os.makedirs(out_dir, exist_ok=True)

    # Model
    model_path = os.path.join(out_dir, "jetwing_scorer_v2.pkl")
    joblib.dump(model, model_path)

    # Fitted transformers (CRITICAL — needed at inference time to place new
    # customers on the same scale as the training population)
    transformers_path = os.path.join(out_dir, "jetwing_transformers_v2.pkl")
    joblib.dump(transformers, transformers_path)

    # Metadata
    active = scored[scored["frequency_total"] > 0]
    meta = {
        "model_version": "2.0",
        "feature_columns": MODEL_FEATURES,
        "score_range": [0, 100],
        "score_type": "uniform_continuous_percentile",
        "top_10_pct_cutoff": TOP_PCT_THRESHOLD,
        "score_interpretation": (
            "Score = percentile rank among all scoreable customers. "
            "Score 75 means this customer is better than 75% of the database. "
            "Score >= 90 = top 10%."
        ),
        "rfm_weights": {
            "recency": WEIGHT_RECENCY,
            "frequency": WEIGHT_FREQUENCY,
            "monetary": WEIGHT_MONETARY,
        },
        "bonus_weights": {
            "loyalty": WEIGHT_LOYALTY,
            "engagement": WEIGHT_ENGAGEMENT,
            "luxury_affinity": WEIGHT_LUXURY_AFFIN,
        },
        "n_active_customers": int(len(active)),
        "top_10_pct_count": int(active["top_10_pct"].sum()),
        "score_mean": round(float(active["composite_score"].mean()), 2),
        "score_std": round(float(active["composite_score"].std()), 2),
        "trained_on": "Hotel Booking Demand (Kaggle — jessemostipak)",
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
    meta_path = os.path.join(out_dir, "feature_columns_v2.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    # Sample predictions CSV
    sample = active.sample(min(1000, len(active)), random_state=RANDOM_SEED).copy()
    sample["predicted_score"] = np.clip(model.predict(sample[MODEL_FEATURES]), 0, 100)
    sample["in_top_10_pct"] = sample["composite_score"] >= TOP_PCT_THRESHOLD
    out_cols = (
        ["guest_id"]
        + MODEL_FEATURES
        + [
            "composite_score",
            "percentile_rank",
            "top_10_pct",
            "predicted_score",
            "in_top_10_pct",
        ]
    )
    out_cols = [c for c in out_cols if c in sample.columns]
    sample_path = os.path.join(out_dir, "sample_predictions_v2.csv")
    sample[out_cols].sort_values("composite_score", ascending=False).to_csv(
        sample_path, index=False
    )

    # HuggingFace handler
    handler_code = f'''"""
HuggingFace Inference Handler — Jetwing Symphony Customer Scorer v2
====================================================================
Continuous uniform scoring — score = percentile rank (0–100).
Top 10% is always score >= {TOP_PCT_THRESHOLD}.

Upload alongside: jetwing_scorer_v2.pkl, jetwing_transformers_v2.pkl,
                  feature_columns_v2.json

POST body:
  {{"inputs": [[f1, f2, ..., f18], ...]}}   # one array per customer
  Feature order: {MODEL_FEATURES}

Response:
  {{"scores": [87.3, 45.1, 12.7, ...]}}
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
        base = {WEIGHT_RECENCY}*r_s + {WEIGHT_FREQUENCY}*f_s + {WEIGHT_MONETARY}*m_s

        loyalty_raw = arr[:,8]*0.45 + arr[:,7]*0.35 + (
            np.log1p(arr[:,9]) /
            (np.log1p(arr[:,9]).max() + 1e-9)) * 0.20
        l_s = self.transformers["loyalty"].transform(
                loyalty_raw.reshape(-1,1)).flatten()

        engagement_raw = arr[:,10]*0.45 + (arr[:,4]/(arr[:,4].max()+1e-9))*0.35 + arr[:,14]*0.20
        e_s = self.transformers["engagement"].transform(
                engagement_raw.reshape(-1,1)).flatten()

        lux_s = self.transformers["luxury"].transform(arr[:,13].reshape(-1,1)).flatten()

        bonus = {WEIGHT_LOYALTY}*l_s + {WEIGHT_ENGAGEMENT}*e_s + {WEIGHT_LUXURY_AFFIN}*lux_s
        raw   = base * (1.0 + bonus)
        cancel_penalty = arr[:,6] * 0.15
        penalised = np.clip(raw - cancel_penalty * raw, 0, None)
        final = self.transformers["final"].transform(penalised.reshape(-1,1)).flatten()
        return np.clip(final * 100.0, 0, 100)

    def __call__(self, data: dict) -> dict:
        inputs = data.get("inputs", [])
        if not inputs:
            return {{"scores": [], "error": "No inputs"}}
        arr = np.array(inputs, dtype=np.float32)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
        scores = self._apply_transforms(arr).round(2).tolist()
        return {{
            "scores": scores,
            "top_10_pct": [s >= self.cutoff for s in scores]
        }}
'''
    handler_path = os.path.join(out_dir, "handler_v2.py")
    with open(handler_path, "w") as f:
        f.write(handler_code)

    print(f"      Model        : {model_path}")
    print(f"      Transformers : {transformers_path}  ← NEW: needed at inference")
    print(f"      Metadata     : {meta_path}")
    print(f"      Samples      : {sample_path}")
    print(f"      HF handler   : {handler_path}")
    return model_path


# ─────────────────────────────────────────────────────────────────────────────
#  AUDIENCE SELECTOR  (used by the Celery campaign service)
# ─────────────────────────────────────────────────────────────────────────────


def get_top_pct_audience(
    scored: pd.DataFrame,
    top_pct: float = 10.0,
    property_affinity: str = None,  # "luxury" | "premium" | None
    domestic_only: bool = False,
) -> pd.DataFrame:
    """
    Returns the top N% of scoreable customers as a filtered DataFrame,
    sorted by composite_score descending.

    Because scores are uniformly distributed:
      top 10% → composite_score >= 90.0  (always)
      top 20% → composite_score >= 80.0  (always)
      top  5% → composite_score >= 95.0  (always)

    In your Celery campaign service, this maps to:
      SELECT * FROM customer_scores cs
      JOIN customers c ON c.customer_id = cs.customer_id
      WHERE cs.composite_score >= (100 - :top_pct)
        AND c.marketing_opt_in = TRUE
      ORDER BY cs.composite_score DESC;
    """
    cutoff = 100.0 - top_pct
    active = scored[scored["frequency_total"] > 0].copy()
    audience = active[active["composite_score"] >= cutoff].copy()

    if property_affinity == "luxury":
        audience = audience[audience["luxury_affinity_ratio"] > 0.5]
    elif property_affinity == "premium":
        audience = audience[audience["luxury_affinity_ratio"] <= 0.5]

    if domestic_only:
        audience = audience[audience["domestic_guest"] == 1]

    return audience.sort_values("composite_score", ascending=False).reset_index(
        drop=True
    )


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="hotel_bookings.csv")
    parser.add_argument("--out", default="model_output_v2")
    args = parser.parse_args()

    print("=" * 65)
    print("  Jetwing Symphony — Customer Scoring Model v2.0")
    print("  Continuous Uniform Score Edition")
    print("=" * 65)

    df = load_and_clean(args.data)
    df = simulate_guest_ids(df)
    features = engineer_features(df)
    scored, transformers = build_continuous_scores(features)
    model, X_test, y_test, y_pred, train_df = train_model(scored)
    visualise(model, scored, X_test, y_test, y_pred, train_df, out_dir=args.out)
    save_artefacts(model, transformers, scored, out_dir=args.out)

    # ── Final audience demo ───────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  Audience Segmentation (using get_top_pct_audience)")
    print("=" * 65)
    for pct in [5, 10, 15, 20]:
        aud = get_top_pct_audience(scored, top_pct=pct)
        cutoff = 100.0 - pct
        print(f"  Top {pct:2d}%  (score >= {cutoff:.0f})  →  {len(aud):,} customers")

    # Jetwing-specific: split by property affinity
    print()
    top10 = get_top_pct_audience(scored, top_pct=10)
    lux = get_top_pct_audience(scored, top_pct=10, property_affinity="luxury")
    prem = get_top_pct_audience(scored, top_pct=10, property_affinity="premium")
    print(f"  Top 10% — Luxury Reserve affinity  :  {len(lux):,} customers")
    print(f"  Top 10% — Premium Hotel affinity   :  {len(prem):,} customers")

    print("\n  Top 5 Campaign Targets:")
    show_cols = [
        "guest_id",
        "composite_score",
        "recency_days",
        "frequency_total",
        "monetary_total",
        "direct_booking_ratio",
    ]
    show_cols = [c for c in show_cols if c in top10.columns]
    print(top10.head(5)[show_cols].to_string(index=False))
    print("=" * 65)
    print("  Done. SQL equivalent for your campaign service:")
    print("    SELECT * FROM customer_scores")
    print("    WHERE composite_score >= 90.0")
    print("      AND marketing_opt_in = TRUE")
    print("    ORDER BY composite_score DESC;")
    print("=" * 65)


if __name__ == "__main__":
    main()
