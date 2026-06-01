/**
 * API Routes Configuration
 * This file explains the API structure for the JetMind application
 */

/*
PRICING API ROUTES:
================

GET /api/pricing/recommendations
- Returns AI-generated rate recommendations for all properties
- Query params: propertyId, dateRange, roomType
- Response: { recommendations: PricingRecommendation[] }

POST /api/pricing/apply-rate
- Applies a recommended rate to a room type
- Body: { propertyId, roomType, rate, startDate, endDate }
- Response: { success: boolean, message: string }

GET /api/pricing/elasticity
- Returns price elasticity curve for a property
- Query params: propertyId, roomType, basePrice
- Response: { elasticityData: ElasticityPoint[] }

GET /api/pricing/channel-analysis
- Analyzes channel performance and profitability
- Query params: propertyId, dateRange
- Response: { channels: ChannelMetrics[] }


FORECASTING API ROUTES:
======================

GET /api/forecasting/demand
- Predicts occupancy and demand for 7/30/60/90 days
- Query params: propertyId, horizon (7|30|60|90)
- Response: { forecasts: ForecastOutput[] }

GET /api/forecasting/anomalies
- Detects unusual demand patterns
- Query params: propertyId, dateRange
- Response: { anomalies: Anomaly[] }

GET /api/forecasting/revenue-projection
- Projects revenue based on occupancy forecasts
- Query params: propertyId, numberofRooms, avgADR
- Response: { projections: RevenueProjection[] }

POST /api/forecasting/alerts
- Configures demand alert thresholds
- Body: { propertyId, thresholds: AlertThreshold[] }
- Response: { success: boolean }


GUEST INTELLIGENCE API ROUTES:
==============================

GET /api/guests/profiles
- Returns all guest profiles with segmentation
- Query params: tier, limit, offset
- Response: { guests: GuestProfile[], total: number }

GET /api/guests/profile/:guestId
- Returns detailed guest profile and history
- Response: { profile: GuestProfile, recommendations: string[] }

GET /api/guests/segmentation
- Analyzes guest segments and behaviors
- Query params: metric (tier|spending|loyalty|churn)
- Response: { segments: GuestSegment[] }

POST /api/guests/feedback/sentiment
- Analyzes sentiment from reviews and feedback
- Body: { reviews: Review[], source: string }
- Response: { sentiment: SentimentAnalysis }

GET /api/guests/lifetime-value
- Calculates LTV metrics
- Query params: propertyId, dateRange
- Response: { metrics: LTVMetrics }


SUSTAINABILITY API ROUTES:
==========================

GET /api/sustainability/metrics
- Returns current ESG metrics and scores
- Query params: propertyId, granularity (daily|monthly|yearly)
- Response: { metrics: SustainabilityMetrics }

POST /api/sustainability/log-resources
- Logs resource consumption data
- Body: { propertyId, electricityKWh, waterLiters, wasteKg, recycledKg }
- Response: { success: boolean, metrics: SustainabilityMetrics }

GET /api/sustainability/recommendations
- Returns ESG improvement recommendations
- Query params: propertyId
- Response: { recommendations: string[] }

GET /api/sustainability/report
- Generates ESG/ISO 14001 compliance report
- Query params: propertyId, format (pdf|json)
- Response: PDF or JSON report


REVENUE INTELLIGENCE API ROUTES:
================================

GET /api/revenue/metrics
- Returns revenue KPIs (RevPAR, GOPPAR, ADR)
- Query params: propertyId, dateRange, breakdown (property|room|channel)
- Response: { metrics: RevenueMetrics }

POST /api/revenue/scenario-planning
- Runs what-if analysis for revenue scenarios
- Body: { scenarios: ScenarioInput[] }
- Response: { results: ScenarioResult[] }

GET /api/revenue/channel-mix
- Analyzes revenue by booking channel
- Query params: propertyId, dateRange
- Response: { channels: ChannelMix[] }


DASHBOARD API ROUTES:
====================

GET /api/dashboard/kpis
- Returns all KPIs for executive dashboard
- Query params: dateRange, properties
- Response: { kpis: DashboardKPI[] }

GET /api/dashboard/alerts
- Returns all active alerts and notifications
- Query params: severity, limit
- Response: { alerts: Alert[] }


DATABASE SCHEMA SUGGESTIONS:
============================

Users
- id: UUID
- email: string
- role: 'admin' | 'editor' | 'viewer'
- properties: UUID[] (managed properties)
- createdAt: timestamp

Properties
- id: UUID
- name: string
- location: string
- totalRooms: int
- roomTypes: RoomType[]
- coordinate: {lat, lng}

Bookings
- id: UUID
- propertyId: UUID
- guestId: UUID
- roomType: string
- checkIn: date
- checkOut: date
- rate: decimal
- channel: string

Guests
- id: UUID
- name: string
- email: string
- phone: string
- totalSpend: decimal
- staySessions: BookingSession[]
- preferences: JSON
- lastVisit: date

ResourceMetrics (daily log)
- id: UUID
- propertyId: UUID
- date: date
- electricityKWh: decimal
- waterLiters: decimal
- wasteKg: decimal
- recycledKg: decimal
- renewableEnergyKWh: decimal
- guestNights: int

Reviews
- id: UUID
- guestId: UUID
- propertyId: UUID
- rating: int (1-5)
- comment: text
- sentiment: number (0-1)
- topics: string[]
- source: string (TripAdvisor|Google|Internal)
- createdAt: timestamp

*/

// This is a reference document, not executable code
export const apiReference = "See comments above for API routes documentation";
