import json
import joblib
import numpy as np
import gradio as gr

# Load artifacts
model = joblib.load("jetwing_scorer_v2.pkl")

with open("feature_columns_v2.json", "r") as f:
    metadata = json.load(f)

FEATURES = metadata["feature_columns"]
TOP_10_CUTOFF = metadata["top_10_pct_cutoff"]


def predict(
    recency_days,
    frequency_total,
    monetary_total,
    monetary_avg_per_stay,
    avg_length_of_stay,
    avg_lead_time_days,
    cancellation_ratio,
    direct_booking_ratio,
    is_repeated_guest,
    prev_completed_bookings,
    avg_special_requests,
    luxury_reserve_visits,
    premium_hotel_visits,
    luxury_affinity_ratio,
    eco_engagement_flag,
    avg_adr,
    high_season_preference,
    domestic_guest,
):
    features = np.array(
        [
            [
                recency_days,
                frequency_total,
                monetary_total,
                monetary_avg_per_stay,
                avg_length_of_stay,
                avg_lead_time_days,
                cancellation_ratio,
                direct_booking_ratio,
                is_repeated_guest,
                prev_completed_bookings,
                avg_special_requests,
                luxury_reserve_visits,
                premium_hotel_visits,
                luxury_affinity_ratio,
                eco_engagement_flag,
                avg_adr,
                high_season_preference,
                domestic_guest,
            ]
        ]
    )

    score = float(model.predict(features)[0])
    score = max(0, min(100, score))

    segment = "Top 10% Customer" if score >= TOP_10_CUTOFF else "Standard Customer"

    return {
        "score": round(score, 2),
        "segment": segment,
    }


demo = gr.Interface(
    fn=predict,
    inputs=[
        gr.Number(label="Recency Days"),
        gr.Number(label="Frequency Total"),
        gr.Number(label="Monetary Total"),
        gr.Number(label="Monetary Avg Per Stay"),
        gr.Number(label="Avg Length Of Stay"),
        gr.Number(label="Avg Lead Time Days"),
        gr.Number(label="Cancellation Ratio"),
        gr.Number(label="Direct Booking Ratio"),
        gr.Number(label="Is Repeated Guest"),
        gr.Number(label="Previous Completed Bookings"),
        gr.Number(label="Avg Special Requests"),
        gr.Number(label="Luxury Reserve Visits"),
        gr.Number(label="Premium Hotel Visits"),
        gr.Number(label="Luxury Affinity Ratio"),
        gr.Number(label="Eco Engagement Flag"),
        gr.Number(label="Avg ADR"),
        gr.Number(label="High Season Preference"),
        gr.Number(label="Domestic Guest"),
    ],
    outputs=gr.JSON(),
    title="Jetwing Customer Ranker",
    description="Predict customer ranking score (0-100)",
)

demo.launch()
