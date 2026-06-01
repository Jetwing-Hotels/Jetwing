# JetMind: AI-Powered Hospitality Intelligence Platform
## Comprehensive Solution Document

**Project Name:** JetMind  
**Organization:** Jetwing Symphony PLC  
**Platform:** Next.js 16.2 + React 19 + Recharts  
**Status:** Implementation Phase 1 Complete  
**Date:** June 1, 2026

---

## Executive Summary

JetMind is a cutting-edge AI-powered decision support platform designed specifically for Jetwing Symphony PLC's hotel portfolio. The platform integrates six interconnected intelligence modules that provide real-time analytics, predictive forecasting, and automated optimization across revenue, guest experience, sustainability, and operational planning.

This document provides a comprehensive technical and business analysis of each module, detailing implementation strategies, system architecture, financial projections, and risk mitigation approaches.

---

# 1. EXECUTIVE DASHBOARD

## Business Problem

Jetwing Symphony's leadership currently lacks a unified, real-time view of group-wide performance across 5+ properties. Decision-making relies on manual report compilation from disparate systems, causing:
- **Information lag:** 2-3 day delay in performance visibility
- **Operational silos:** Different teams use different metrics
- **Poor agility:** Reactive instead of proactive management
- **Missed opportunities:** Cannot quickly capitalize on market trends or respond to anomalies

## Objectives

1. **Real-time visibility** into group KPIs across all properties
2. **Standardized metrics** for consistent decision-making
3. **Predictive alerts** for anomalies and opportunities
4. **Customizable dashboards** for different user roles
5. **One-click drill-down** from KPI to root cause analysis
6. **Mobile-responsive design** for on-the-go access

## Data Collection

### (i) Data Sources
- **Property Management System (PMS):** Real-time bookings, occupancy, rates
- **Accounting System:** Revenue, expenses, GOPPAR calculations
- **Sustainability IoT Sensors:** Energy, water, waste metrics
- **Guest Management System:** Guest profiles, preferences, feedback
- **Channel Managers:** Distribution performance across OTA/Direct
- **Historical Archive:** 24+ months for trend analysis and ML training

### (ii) Data Types
| Data Type | Frequency | Volume | Source |
|-----------|-----------|--------|--------|
| Booking transactions | Real-time | 50-200/day | PMS |
| Revenue/expenses | Daily | 50-100 records | Accounting |
| Occupancy rates | Hourly | 300 data points | PMS |
| Sustainability metrics | 15-min interval | 2,000+ readings | IoT |
| Guest reviews | Real-time | 10-50/day | Multiple |
| Market rates | Hourly | 100-300 readings | Channel Manager |
| Staff operations | Daily | 500+ events | Property logs |

### (iii) How They Store in DB

**Database Schema:**

```sql
-- Core Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  location VARCHAR(255),
  total_rooms INT,
  coordinate POINT,
  created_at TIMESTAMP
);

-- Real-time Metrics
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  date DATE,
  occupancy DECIMAL(5,2),
  adr DECIMAL(10,2),
  revpar DECIMAL(10,2),
  goppar DECIMAL(10,2),
  revenue DECIMAL(15,2),
  created_at TIMESTAMP,
  INDEX idx_property_date (property_id, date)
);

-- Booking aggregates
CREATE TABLE booking_summary (
  id UUID PRIMARY KEY,
  property_id UUID,
  date DATE,
  total_bookings INT,
  by_channel JSONB, -- {direct: 45, booking.com: 25, ...}
  average_los DECIMAL(5,2),
  pickup_vs_forecast DECIMAL(5,2)
);

-- Alert system
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  property_id UUID,
  alert_type VARCHAR(50),
  severity ENUM('critical', 'warning', 'info'),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  INDEX idx_property_severity (property_id, severity)
);
```

## AI and Analytics Components

### (I) Algorithms

**1. Real-time Occupancy Forecasting**
- Algorithm: Exponential Smoothing with day-of-week adjustment
- Inputs: Historical occupancy, day type, seasonality
- Output: 7/30/60/90-day occupancy forecast with ±2% accuracy
- Update frequency: Hourly

**2. Revenue Anomaly Detection**
- Algorithm: Z-score analysis + Isolation Forest
- Detects: Unusual revenue patterns, booking cancellations, rate anomalies
- Threshold: >2 standard deviations trigger alerts
- Training data: 24 months history

**3. KPI Trend Analysis**
- Algorithm: Linear regression for trend direction
- Calculates: Growth/decline slopes, acceleration points
- Time windows: 7-day, 30-day, YTD comparisons
- Confidence intervals: 95% for decision support

**4. Comparative Analysis**
- Benchmark against: Historical performance, seasonal norms, competitors
- Metrics: YoY growth, month-over-month change, market share
- Visualization: Dual-axis trending with bands

### (II) Machine Learning Components

**Alert Generation Engine**
- Rules-based alerts for immediate anomalies
- ML-based predictive alerts for emerging issues
- Smart alert filtering to reduce false positives
- Alert escalation based on severity and duration

**Dashboard Personalization**
- User role detection (Admin, Manager, Analyst)
- Widget preference learning
- Custom metric definitions
- Saved views for quick access

## Devices and Hardware

| Component | Specifications | Purpose |
|-----------|---|---------|
| Server | 4-core CPU, 8GB RAM | API processing |
| Database | PostgreSQL 14+ | Real-time metrics storage |
| Cache | Redis | Session and metric caching |
| Message Queue | Kafka/RabbitMQ | Real-time data streaming |
| Monitoring | Prometheus + Grafana | System health monitoring |
| CDN | Cloudflare/AWS CloudFront | Dashboard distribution |

## System Architecture

```
┌─────────────────────────────────────┐
│   Data Sources (PMS, Accounting)    │
└────────────────┬────────────────────┘
                 │
        ┌────────▼────────┐
        │ Data Ingestion  │
        │   (Kafka/API)   │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  Data Pipeline  │
        │ (Transform/ETL) │
        └────────┬────────┘
                 │
        ┌────────▼────────────────────┐
        │  Analytics Engine           │
        │  • Forecasting              │
        │  • Anomaly Detection        │
        │  • KPI Calculation          │
        └────────┬────────────────────┘
                 │
        ┌────────▼────────┐
        │ Cache Layer     │
        │ (Redis/Memory)  │
        └────────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐  ┌──────▼───┐  ┌──▼────┐
│  API  │  │Dashboard │  │Mobile │
│Router │  │  (React) │  │ Views │
└───────┘  └──────────┘  └───────┘
```

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|---|
| **Phase 1** | Week 1-2 | Data ingestion setup, metric calculation |
| **Phase 2** | Week 3-4 | Dashboard UI, real-time updates |
| **Phase 3** | Week 5-6 | Alerts, forecasting, ML models |
| **Phase 4** | Week 7-8 | Testing, optimization, deployment |
| **Phase 5** | Week 9+ | Monitoring, feedback collection, iteration |

## Security Requirements

| Security Layer | Implementation |
|---|---|
| **Authentication** | OAuth 2.0 / SSO integration |
| **Authorization** | Role-based access control (RBAC) |
| **Encryption** | TLS 1.3 for transit, AES-256 for storage |
| **Data Residency** | On-premises or trusted cloud provider |
| **Audit Logging** | Complete activity log with timestamps |
| **Backup** | Daily incremental, monthly full backup |
| **DLP** | Sensitive data masking in non-prod |

## Financial Analysis

### (i) Initial Costs

**Software Development: LKR 4,500,000**
- Dashboard development: LKR 1,200,000
- Data pipeline: LKR 1,000,000
- Analytics engine: LKR 1,200,000
- Testing & QA: LKR 700,000
- Project management: LKR 400,000

**Infrastructure: LKR 1,500,000**
- Server setup (3 environments): LKR 800,000
- Database setup & optimization: LKR 400,000
- Monitoring tools: LKR 200,000
- Backup systems: LKR 100,000

**Licenses: LKR 250,000**
- Cloud services (AWS/Azure): LKR 150,000
- Analytics software: LKR 100,000

**Training & Documentation: LKR 300,000**
- User training: LKR 150,000
- Technical documentation: LKR 100,000
- Operations manual: LKR 50,000

**Total Initial Cost: LKR 6,550,000**

### (ii) Operational Costs (Annual)

| Category | Cost |
|----------|------|
| **Infrastructure** | LKR 1,200,000 |
| - Cloud computing | LKR 600,000 |
| - Database licensing | LKR 300,000 |
| - Backups & DR | LKR 200,000 |
| - Monitoring tools | LKR 100,000 |
| **Team** | LKR 2,400,000 |
| - 1 Analytics Engineer | LKR 1,200,000 |
| - 1 Data Engineer | LKR 1,200,000 |
| **Maintenance & Support** | LKR 600,000 |
| - Updates & patches | LKR 300,000 |
| - Support & troubleshooting | LKR 300,000 |
| **Professional Services** | LKR 400,000 |
| - Quarterly optimization | LKR 200,000 |
| - Security audits | LKR 200,000 |
| **Total Annual OpEx** | **LKR 4,600,000** |

## Expected Benefits

### Financial Benefits (Annual)
- **Revenue Optimization:** 3-5% increase through better pricing and occupancy management = LKR 21-35M annually
- **Cost Reduction:** 10-15% operational savings through efficiency = LKR 15-22M annually
- **Improved ADR:** 2-3% through demand-driven pricing = LKR 7-10M annually
- **Direct Booking Increase:** 5-8% shift from OTA (saves 15% commission) = LKR 8-12M annually

**Total Expected Annual Financial Benefit: LKR 51-79M**

### Operational Benefits
- **Decision speed:** 75% faster decision-making
- **Data accuracy:** 99.5% uptime with <5 min latency
- **Team productivity:** 20 hours/week saved on manual reporting
- **Error reduction:** 90% fewer manual calculation errors
- **Compliance:** 100% audit trail for all transactions

### Strategic Benefits
- **Competitive edge:** Real-time competitive intelligence
- **Guest insights:** Better personalization and retention
- **Sustainability tracking:** Built-in ESG compliance
- **Scalability:** Framework ready for new properties
- **Innovation:** Platform for future AI features

## Risks and Challenges

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Data Quality Issues** | High | Medium | Data validation rules, cleansing pipeline, PMS audit |
| **Integration Delays** | Medium | High | Early PMS assessment, dedicated integration team |
| **User Adoption** | Medium | High | Comprehensive training, phased rollout, support team |
| **Performance Issues** | Low | High | Load testing, auto-scaling, database optimization |
| **Cyber Threats** | Medium | Critical | Security audits, penetration testing, incident plan |
| **Model Drift** | Low | Medium | Continuous monitoring, quarterly retraining |

## Additional Considerations

### Customer Success Metrics
- User adoption rate (target: 85% of staff within 3 months)
- Daily Active Users (target: 95%)
- Average session duration (target: 2.5 hours)
- Feature usage distribution
- Customer satisfaction score (target: 4.5/5)

### Scalability Roadmap
- **Q3 2026:** Add historical analytics and advanced reporting
- **Q4 2026:** Implement AI chatbot for natural language queries
- **Q1 2027:** Multi-property chain integration for competitor analysis
- **Q2 2027:** Mobile app with offline capability
- **Q3 2027:** Blockchain for transaction verification

---

# 2. DYNAMIC PRICING ENGINE

## Business Problem

Manual rate setting across Jetwing's portfolio leads to:
- **Revenue leakage:** Missed optimization opportunities (estimated 5-8% annually)
- **Inconsistency:** No systematic approach to rate adjustments
- **Competitive blindness:** Cannot respond to competitor moves quickly
- **Channel imbalance:** OTA-heavy, losing direct booking margin benefits
- **Human bias:** Rate decisions based on intuition, not data

## Objectives

1. **Maximize RevPAR** through AI-driven rate optimization
2. **Respond in real-time** to market conditions and competition
3. **Shift bookings** from high-commission OTA to direct channels
4. **Maintain competitiveness** while protecting margins
5. **Support multi-currency** pricing for international guests
6. **Provide recommendation confidence** for manager review

## Data Collection

### (i) Data Sources
- **Historical Bookings:** 36+ months of rate/occupancy data
- **Competitor Rates:** Real-time scraping of 15+ competing properties
- **Market Data:** Expedia, Booking.com, Tripadvisor pricing feeds
- **Demand Patterns:** Google Trends, conference calendars, holiday calendars
- **Booking Window Data:** Lead time distribution and conversion rates
- **Channel Performance:** Commission rates, review scores, conversion by channel
- **Guest Profiles:** Spend patterns, length of stay, seasonality

### (ii) Data Types
| Data Type | Update Frequency | Granularity |
|-----------|---|---|
| Room rates | Hourly | Per room type per date |
| Competitor rates | 6 hours | Per property per date |
| Booking pace | Real-time | Cumulative vs forecast |
| Occupancy forecasts | Daily | 365 days forward |
| Demand indices | Daily | By room type/segment |
| ADR by channel | Daily | Per OTA + direct |
| Cancellation rates | Daily | By booking window |

### (iii) Database Schema

```sql
CREATE TABLE rate_history (
  id UUID PRIMARY KEY,
  property_id UUID,
  room_type VARCHAR(100),
  rate_date DATE,
  rate DECIMAL(10,2),
  occupancy DECIMAL(5,2),
  revenue DECIMAL(12,2),
  source VARCHAR(50), -- manual, ai_recommended, system
  created_by VARCHAR(100),
  created_at TIMESTAMP,
  INDEX idx_property_room_date (property_id, room_type, rate_date)
);

CREATE TABLE competitor_rates (
  id UUID PRIMARY KEY,
  competitor_property_id VARCHAR(100),
  room_type VARCHAR(100),
  rate_date DATE,
  rate DECIMAL(10,2),
  currency VARCHAR(3),
  source VARCHAR(50), -- ota_name
  scraped_at TIMESTAMP,
  INDEX idx_competitor_date (competitor_property_id, rate_date)
);

CREATE TABLE pricing_recommendations (
  id UUID PRIMARY KEY,
  property_id UUID,
  room_type VARCHAR(100),
  recommendation_date DATE,
  current_rate DECIMAL(10,2),
  recommended_rate DECIMAL(10,2),
  confidence INT,
  reasoning TEXT,
  factors JSONB, -- {occupancy_factor: 1.15, competition: 1.05, ...}
  accepted BOOLEAN,
  accepted_rate DECIMAL(10,2),
  accepted_at TIMESTAMP,
  impact_revenue DECIMAL(12,2),
  INDEX idx_property_date (property_id, recommendation_date)
);

CREATE TABLE channel_performance (
  id UUID PRIMARY KEY,
  property_id UUID,
  channel VARCHAR(50),
  date DATE,
  commission_rate DECIMAL(5,2),
  review_score DECIMAL(3,1),
  booking_volume INT,
  revenue DECIMAL(12,2),
  net_revenue DECIMAL(12,2),
  index idx_property_channel_date (property_id, channel, date)
);
```

## AI and Analytics Components

### (I) Algorithms

**1. Dynamic Price Calculator**
```
Formula: Recommended Rate = Base Rate × 
  [Occupancy Factor] × 
  [Seasonality Factor] × 
  [Competition Factor] × 
  [Booking Window Factor] × 
  [Demand Factor]

Where:
- Occupancy Factor = 0.7 + (Occ% / 100) × 0.6
- Seasonality Factor = 0.8 - 1.5 (based on season)
- Competition Factor = 0.85 - 1.15 (vs competitors)
- Booking Window Factor = 0.8 - 1.2 (last-minute surge)
- Demand Factor = 0.7 - 1.5 (market demand)
```

**2. Price Elasticity Model**
- Determines price sensitivity for each room type
- Uses linear regression on historical price/occupancy data
- Calculates: % occupancy change per 1% price change
- Optimizes for revenue (not just occupancy)

**3. Competitive Intelligence Engine**
- Real-time price scraping from competitors
- Relative pricing positioning (premium/neutral/discount)
- Dynamic adjustment suggestions based on competitor moves
- Market share analysis

**4. Channel Optimization Algorithm**
- Compares net revenue across channels (gross - commission)
- Allocates inventory to maximize net revenue
- Suggests channel strategy (e.g., 45% direct, 35% OTA, 20% offline)

### (II) Machine Learning Components

**Time Series Forecasting for Demand**
- ARIMA model for occupancy prediction
- Seasonal decomposition
- Holiday and event impact modeling
- Lead time analysis

**Demand Segmentation**
- Leisure vs corporate vs MICE pattern recognition
- Booking window distribution by segment
- Segment-specific rate sensitivity
- Price elasticity by segment

## Devices and Hardware

**Pricing Engine Specifications:**
- **Processing:** Real-time calculation engine for 500+ room types
- **Data Sources:** 20+ concurrent price feeds via API
- **Latency:** <2 seconds for recommendation generation
- **Availability:** 99.9% uptime SLA
- **Storage:** Historical rate data (36+ months) = ~500GB

## System Architecture

```
┌─────────────────────────────────┐
│  Market Data Ingestion          │
│  • Competitor feeds             │
│  • Booking patterns             │
│  • Demand signals               │
└────────────┬────────────────────┘
             │
    ┌────────▼────────────┐
    │ Price Calculator    │
    │ • Occupancy factor  │
    │ • Competition       │
    │ • Seasonality       │
    └────────┬────────────┘
             │
    ┌────────▼────────────┐
    │ Elasticity Engine   │
    │ • Price sensitivity │
    │ • Demand curve      │
    └────────┬────────────┘
             │
    ┌────────▼──────────────────┐
    │ Recommendation Generator   │
    │ • Confidence scoring       │
    │ • Channel optimization     │
    │ • What-if analysis         │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Manager Review Interface   │
    │ • Accept/Reject rates      │
    │ • Manual adjustments       │
    │ • Reason documentation     │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ PMS Integration            │
    │ • Rate upload              │
    │ • Reservation sync         │
    │ • Commission tracking      │
    └────────────────────────────┘
```

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|---|
| **Phase 1** | Week 1-2 | Data collection, competitor feed setup |
| **Phase 2** | Week 3-4 | Algorithm development, model training |
| **Phase 3** | Week 5-6 | Recommendation UI, manager workflow |
| **Phase 4** | Week 7-8 | Testing, PMS integration, optimization |
| **Phase 5** | Week 9-10 | Pilot on 1 property, feedback collection |
| **Phase 6** | Week 11-12 | Full rollout across all properties |

## Security Requirements

- **Rate Approval Workflow:** Multi-level approval for >20% changes
- **Audit Trail:** Every rate change logged with reason and approver
- **Manual Override:** Managers can always set custom rates
- **Competitor Data:** Confidential handling, no reverse-engineering
- **PMS Integration:** Encrypted API connection, rate validation

## Financial Analysis

### (i) Initial Costs

**Algorithm Development: LKR 2,200,000**
- Data scientist (3 months): LKR 900,000
- ML engineer (3 months): LKR 800,000
- Testing & validation: LKR 500,000

**Competitor Data Feed: LKR 300,000**
- Feed development: LKR 200,000
- Data quality setup: LKR 100,000

**UI/UX Development: LKR 800,000**
- Rate recommendation dashboard: LKR 400,000
- Approval workflow: LKR 300,000
- Channel optimization view: LKR 100,000

**PMS Integration: LKR 400,000**
- API development: LKR 200,000
- Testing with PMS vendor: LKR 150,000
- Documentation: LKR 50,000

**Training: LKR 150,000**
- Revenue manager training: LKR 100,000
- GM/Assistant manager training: LKR 50,000

**Total Initial Cost: LKR 3,850,000**

### (ii) Operational Costs (Annual)

| Category | Cost |
|----------|------|
| **Infrastructure** | LKR 400,000 |
| **Competitor Data Feeds** | LKR 150,000/month = LKR 1,800,000 |
| **Model Maintenance** | LKR 600,000 |
| **PMS Integration** | LKR 200,000 |
| **Support Team (1 person)** | LKR 1,200,000 |
| **Total Annual OpEx** | **LKR 4,200,000** |

### Expected Benefits

**Financial Benefits (Annual)**
- **RevPAR Optimization:** 3-5% improvement = LKR 35-50M
- **Commission Savings:** 2-3% through channel shift = LKR 8-12M
- **Occupancy Stabilization:** Reduced discounting = LKR 5-8M
- **Direct Booking Growth:** 5-10% shift from OTA = LKR 12-18M

**Total Expected Annual Benefit: LKR 60-88M**

**ROI: 15-22x in Year 1**

### Operational Benefits
- **Decision Time:** Recommendations in <2 seconds
- **Consistency:** Same logic across all properties
- **Scalability:** Handles unlimited room types
- **Flexibility:** Easily adjust parameters by property

## Risks and Challenges

| Risk | Mitigation |
|------|-----------|
| **Model Becomes Stale** | Monthly retraining with latest data, continuous monitoring |
| **Competitive Reactions** | Market share monitoring, sensitivity analysis |
| **Manager Resistance** | Clear ROI communication, gradual rollout, override capability |
| **PMS Integration Issues** | Early testing, vendor partnership, contingency manual process |
| **Data Quality** | Validation rules, cleansing, outlier detection |

---

# 3. GUEST INTELLIGENCE LAYER

## Business Problem

Jetwing operates with limited guest insight:
- **No 360° View:** Guest data scattered across multiple systems
- **Missed Personalization:** Cannot tailor experiences or offers
- **Churn Risk:** No early warning system for at-risk guests
- **Low Loyalty:** Generic guest communication, no tier-based benefits
- **Sentiment Blindness:** Cannot identify dissatisfaction patterns early

## Objectives

1. **Build unified guest profiles** from all data sources
2. **Segment guests** by value, loyalty, and churn risk
3. **Enable personalization** for increased spending and satisfaction
4. **Predict guest behavior** (churn, repeat booking, upsell potential)
5. **Implement loyalty program** with tier-based benefits
6. **Analyze sentiment** from reviews and feedback

## Data Collection

### (i) Data Sources
- **Booking System:** Reservation history, room preferences, booking patterns
- **PMS:** Check-in/out, room assignments, requests, incidents
- **Revenue:** Spend by category (room, F&B, spa, activities)
- **Reviews:** TripAdvisor, Google, Booking.com, internal surveys
- **Communications:** Email opens, marketing engagement
- **Social Media:** Mentions, tags, engagement
- **Third-party APIs:** Loyalty program integrations

### (ii) Data Types
| Data Type | Granularity | Volume |
|-----------|---|---|
| Booking records | Per booking | 50-200/day |
| Guest profiles | Per guest | 20,000+ active |
| Transaction details | Per transaction | 1,000/day |
| NPS/Survey responses | Per stay | 100-200/day |
| Review text | Per review | 20-50/day |
| Marketing engagement | Per email | 5,000+/month |

### (iii) Database Schema

```sql
CREATE TABLE guests (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  name VARCHAR(255),
  country_of_origin VARCHAR(100),
  passport_number VARCHAR(50),
  date_of_birth DATE,
  gender CHAR(1),
  preferences JSONB, -- {room_view: 'sea', highest_floor: true, ...}
  vip_flag BOOLEAN,
  marketing_opt_in BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_email (email)
);

CREATE TABLE guest_stays (
  id UUID PRIMARY KEY,
  guest_id UUID REFERENCES guests(id),
  property_id UUID,
  reservation_id VARCHAR(100),
  check_in_date DATE,
  check_out_date DATE,
  room_type VARCHAR(100),
  rate DECIMAL(10,2),
  room_number VARCHAR(10),
  party_size INT,
  created_at TIMESTAMP
);

CREATE TABLE guest_transactions (
  id UUID PRIMARY KEY,
  guest_id UUID,
  stay_id UUID,
  category VARCHAR(50), -- room, food, spa, activity
  amount DECIMAL(10,2),
  transaction_date TIMESTAMP,
  INDEX idx_guest_category (guest_id, category)
);

CREATE TABLE guest_reviews (
  id UUID PRIMARY KEY,
  guest_id UUID,
  stay_id UUID,
  platform VARCHAR(50), -- tripadvisor, google, booking
  rating INT, -- 1-5
  sentiment DECIMAL(3,2), -- 0-1
  text TEXT,
  topics JSONB, -- ['service', 'cleanliness', 'food']
  language VARCHAR(10),
  created_at TIMESTAMP
);

CREATE TABLE guest_segmentation (
  id UUID PRIMARY KEY,
  guest_id UUID UNIQUE REFERENCES guests(id),
  tier VARCHAR(20), -- platinum, gold, silver, bronze
  lifetime_value DECIMAL(12,2),
  loyalty_score INT, -- 0-100
  churn_risk INT, -- 0-100 (higher = more risk)
  preference_score INT, -- 0-100
  sentiment_score INT, -- 0-100
  last_stay_date DATE,
  next_predicted_stay DATE,
  updated_at TIMESTAMP
);

CREATE TABLE guest_communications (
  id UUID PRIMARY KEY,
  guest_id UUID,
  channel VARCHAR(50), -- email, sms, app
  message_type VARCHAR(50), -- welcome, upsell, survey, review_request
  status VARCHAR(20), -- sent, opened, clicked
  sent_at TIMESTAMP,
  opened_at TIMESTAMP
);
```

## AI and Analytics Components

### (I) Algorithms

**1. Lifetime Value Calculation**
```
LTV = Sum(all spending across all stays) + 
      Predicted Future Value based on:
      - Average spend per visit
      - Visit frequency
      - Retention probability
```

**2. Guest Segmentation Engine**
- **Tier Algorithm:**
  - Platinum: LTV > LKR 1M
  - Gold: LKR 500K - 1M
  - Silver: LKR 200K - 500K
  - Bronze: < LKR 200K

- **Loyalty Scoring:** (0-100)
  - Visit frequency (40% weight)
  - Recency - days since last visit (30% weight)
  - Spend consistency (20% weight)
  - Review engagement (10% weight)

- **Churn Risk Prediction:** (0-100)
  - Days since last visit (50% weight)
  - Last review rating (25% weight)
  - Booking pattern changes (15% weight)
  - Competitive activity (10% weight)

**3. Sentiment Analysis Model**
- NLP-based sentiment extraction
- Topic modeling for complaint categorization
- Star rating prediction from text
- Departmental impact scoring

**4. Recommendation Engine**
- Collaborative filtering: Similar guests with positive experiences
- Content-based: Preferences from historical stays
- Context-aware: Seasonal recommendations
- Personalized offers based on spend patterns

### (II) Machine Learning Components

**Churn Prediction Model**
- Random Forest classifier
- Features: Booking patterns, satisfaction scores, competitor behavior
- Output: Churn probability for next 90 days
- Intervention: Automatic loyalty offer trigger

**Next Stay Prediction**
- Time series analysis of booking intervals
- Seasonal patterns and event-based triggers
- Win-back campaigns for at-risk guests

## Implementation Timeline

| Phase | Duration |
|-------|----------|
| Data integration | 2 weeks |
| Profile building | 2 weeks |
| Segmentation algorithms | 2 weeks |
| Personalization engine | 2 weeks |
| Testing & optimization | 1 week |
| **Total** | **9 weeks** |

## Security Requirements

- **PII Protection:** GDPR/PDPA compliance, encrypted storage
- **Access Control:** Support staff see only minimal PII
- **Audit Trail:** All guest data access logged
- **Data Retention:** 7-year retention per banking standards
- **Marketing Opt-out:** Immediate compliance with preferences

## Financial Analysis

### Initial Costs: LKR 2,500,000
- Data integration: LKR 600,000
- ML model development: LKR 1,000,000
- Preference engine: LKR 500,000
- Loyalty program setup: LKR 200,000
- Training: LKR 200,000

### Annual OpEx: LKR 1,800,000
- ML engineer (part-time): LKR 1,000,000
- Loyalty platform fees: LKR 400,000
- Infrastructure: LKR 300,000
- Third-party data: LKR 100,000

### Expected Benefits (Annual)

**Direct Revenue:**
- Increased loyalty (15% higher repeat rate) = LKR 25-35M
- Upsell success (12% increase) = LKR 8-12M
- Win-back campaigns (10% recovery of lost guests) = LKR 5-8M

**Cost Reduction:**
- Marketing efficiency (30% less wasteful spending) = LKR 3-5M
- Operational efficiency (fewer service failures) = LKR 2-3M

**Total Annual Benefit: LKR 43-63M**
**ROI: 17-25x in Year 1**

---

# 4. SUSTAINABILITY DASHBOARD

## Business Problem

Jetwing Symphony lacks comprehensive ESG tracking:
- **Compliance Risk:** Cannot prove ISO 14001 / ESG commitments
- **Operational Inefficiency:** No real-time resource usage visibility
- **Reporting Gap:** Manual data collection for sustainability reports
- **Missed Savings:** Cannot optimize energy/water efficiently
- **Stakeholder Pressure:** Growing demand for transparent ESG data

## Objectives

1. **Real-time ESG monitoring** with automated alerts
2. **ISO 14001 compliance** tracking and reporting
3. **Carbon footprint reduction** through data-driven insights
4. **Resource efficiency optimization** (energy, water, waste)
5. **Stakeholder reporting** with standardized metrics
6. **Predictive maintenance** based on resource patterns

## Data Collection

### (i) Data Sources
- **IoT Sensors:** Real-time electricity, water, waste meters
- **Solar Systems:** PV generation, grid tie performance
- **HVAC Systems:** Energy consumption patterns
- **Waste Management:** Daily waste collection, recycling records
- **Supply Chain:** Vendor carbon footprint data
- **Staff Operations:** Utility consumption by department
- **Guest Behavior:** Room-level consumption patterns

### (ii) Data Types
| Metric | Frequency | Unit |
|--------|---|---|
| Electricity | 15 minutes | kWh |
| Water | 15 minutes | Liters |
| Gas | Daily | m³ |
| Waste segregation | Daily | kg |
| Solar output | Real-time | kW |
| Temperature/Humidity | 15 minutes | °C / % |
| Guest nights | Daily | count |

### (iii) Database Schema

```sql
CREATE TABLE sustainability_metrics (
  id UUID PRIMARY KEY,
  property_id UUID,
  measurement_date TIMESTAMP,
  electricity_kwh DECIMAL(10,2),
  renewable_energy_kwh DECIMAL(10,2),
  water_liters DECIMAL(10,2),
  waste_kg DECIMAL(10,2),
  recycled_kg DECIMAL(10,2),
  composted_kg DECIMAL(10,2),
  guest_nights INT,
  temperature_avg DECIMAL(5,2),
  occupancy_percent DECIMAL(5,2),
  created_at TIMESTAMP,
  INDEX idx_property_date (property_id, measurement_date)
);

CREATE TABLE carbon_calculations (
  id UUID PRIMARY KEY,
  property_id UUID,
  calculation_date DATE,
  electricity_carbon_kg DECIMAL(12,2), -- grid + scope 2
  water_carbon_kg DECIMAL(12,2),
  waste_carbon_kg DECIMAL(12,2),
  renewable_carbon_offset_kg DECIMAL(12,2),
  total_carbon_kg DECIMAL(12,2),
  carbon_per_guest_night DECIMAL(10,4),
  created_at TIMESTAMP
);

CREATE TABLE sustainability_targets (
  id UUID PRIMARY KEY,
  property_id UUID,
  metric_name VARCHAR(100), -- energy_intensity, water_intensity, etc.
  target_value DECIMAL(12,2),
  unit VARCHAR(50),
  target_date DATE,
  baseline_value DECIMAL(12,2),
  baseline_date DATE,
  current_progress DECIMAL(5,2), -- percentage
  status VARCHAR(20), -- on_track, at_risk, exceeded
  updated_at TIMESTAMP
);

CREATE TABLE esg_reports (
  id UUID PRIMARY KEY,
  property_id UUID,
  period_start DATE,
  period_end DATE,
  report_type VARCHAR(50), -- monthly, quarterly, annual, iso14001
  summary JSONB, -- {score: 85, recommendations: [...]}
  generated_at TIMESTAMP,
  generated_by VARCHAR(100)
);
```

## AI and Analytics Components

### (I) Algorithms

**1. Energy Intensity Calculation**
```
Energy Intensity (kWh per guest night) = Total Electricity / Guest Nights
Efficiency Score = (Baseline - Current) / Baseline × 100
```

**2. Water Intensity Calculation**
```
Water Intensity (L per guest night) = Total Water / Guest Nights
Target: <150L per guest night (industry: 200-300L)
```

**3. Carbon Footprint Calculation**
```
Total CO2e = 
  (Non-renewable kWh × 0.65 kg CO2/kWh) +
  (Water liters × 0.0005 kg CO2/L) +
  (Waste kg × 1.5 kg CO2/kg) -
  (Renewable kWh × 0.65 kg CO2/kWh offset)
```

**4. ESG Score Model**
```
ESG Score (0-100) = 
  Energy Score (0-25) +
  Water Score (0-20) +
  Waste Management (0-20) +
  Renewable % (0-20) +
  Carbon Footprint (0-15)
```

**5. Resource Consumption Forecasting**
- Time series forecasting for energy/water usage
- Occupancy-adjusted predictions
- Seasonal pattern recognition
- Anomaly detection for equipment failures

### (II) Machine Learning Components

**Predictive Maintenance**
- Equipment failure prediction
- Preventive action recommendations
- Optimal maintenance scheduling
- Spare part inventory optimization

**Occupancy Impact Analysis**
- Separate occupancy-related from efficiency gains
- Fair comparison across different occupancy levels
- Resource efficiency per occupied room

## Implementation Timeline

| Phase | Duration |
|-------|----------|
| IoT sensor deployment | 2 weeks |
| Data pipeline setup | 1 week |
| Metric calculation | 1 week |
| Dashboard development | 2 weeks |
| Testing & integration | 1 week |
| Pilot deployment | 1 week |
| **Total** | **8 weeks** |

## Financial Analysis

### Initial Costs: LKR 3,200,000
- IoT sensor installation: LKR 1,500,000
- Data pipeline: LKR 800,000
- Dashboard development: LKR 600,000
- Integration with building systems: LKR 300,000

### Annual OpEx: LKR 800,000
- Sensor maintenance: LKR 300,000
- Data infrastructure: LKR 300,000
- Environmental reporting: LKR 200,000

### Expected Benefits (Annual)

**Energy Optimization:**
- 15-20% reduction in electricity = LKR 4-6M savings
- 12-15% reduction in water = LKR 1.5-2M savings
- Solar optimization = LKR 1-2M additional revenue

**Operational Benefits:**
- Reduced environmental penalties: LKR 1-2M
- Enhanced brand value (ESG rating improvement)
- Guest premium willingness: 5-8% increase = LKR 8-12M

**Total Annual Benefit: LKR 15.5-24M**
**ROI: 4.9-7.5x in Year 1**

---

# 5. REVENUE HUB

## Business Problem

Revenue management lacks integrated tooling:
- **Channel Fragmentation:** Revenue spread across OTA without optimization
- **Margin Erosion:** High commission rates eating 15-25% of revenue
- **Poor Visibility:** Cannot evaluate channel profitability
- **Missed Scenarios:** No what-if planning for rate/channel changes
- **Limited Analytics:** Cannot do root cause analysis on revenue drops

## Objectives

1. **Multi-dimensional revenue analytics** (property, channel, room, time)
2. **Channel profitability analysis** with commission impact
3. **Scenario planning** for revenue forecasting
4. **GOPPAR optimization** (Gross Operating Profit Per Available Room)
5. **Revenue forecasting** with confidence intervals
6. **Anomaly detection** for unusual revenue patterns

## Data Collection

### (i) Data Sources
- **PMS:** Booking, rate, occupancy, cancellation data
- **Channel Managers:** Real-time channel rates and availability
- **Accounting:** Commission rates, actual expenses, GOPPAR calculations
- **Market Data:** Competitor revenue data (indirect), market share
- **Booking Pace:** Daily booking pace vs forecast

### (ii) Data Types
| Metric | Frequency |
|--------|---|
| Booking transactions | Real-time |
| Cancellations | Real-time |
| Rate changes | Hourly |
| Channel commissions | Daily |
| GOPPAR components | Daily |
| Booking pace reports | Daily |

### (iii) Database Schema

```sql
CREATE TABLE revenue_transactions (
  id UUID PRIMARY KEY,
  property_id UUID,
  booking_date DATE,
  check_in_date DATE,
  check_out_date DATE,
  room_type VARCHAR(100),
  channel VARCHAR(50),
  occupancy_status VARCHAR(20), -- occupied, cancelled, no_show
  room_rate DECIMAL(10,2),
  additional_revenue DECIMAL(10,2), -- F&B, activities
  total_revenue DECIMAL(12,2),
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  net_revenue DECIMAL(12,2),
  los INT, -- length of stay
  created_at TIMESTAMP,
  INDEX idx_property_channel (property_id, channel)
);

CREATE TABLE revenue_forecasts (
  id UUID PRIMARY KEY,
  property_id UUID,
  forecast_date DATE,
  revenue_forecast DECIMAL(12,2),
  confidence_level INT, -- 0-100
  by_channel JSONB, -- {direct: 1000000, booking: 500000, ...}
  by_segment JSONB, -- {leisure: 800000, corporate: 500000, ...}
  created_at TIMESTAMP
);

CREATE TABLE goppar_analysis (
  id UUID PRIMARY KEY,
  property_id UUID,
  analysis_date DATE,
  total_revenue DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  gop DECIMAL(12,2),
  available_rooms INT,
  goppar DECIMAL(10,2),
  trend VARCHAR(20), -- up, down, stable
  INDEX idx_property_date (property_id, analysis_date)
);
```

## AI and Analytics Components

### (I) Algorithms

**1. Channel Profitability Score**
```
Net Revenue per Channel = Gross Revenue - Commission
Profitability Index = Net Revenue / Commission Rate
Channel Recommendation = Highest profitability index
```

**2. GOPPAR Calculation**
```
GOPPAR = (Total Revenue - Total Expenses) / Available Rooms
or
GOPPAR = (Revenue - COGS - Labor - Overhead) / Rooms
```

**3. Revenue Forecast Model**
- Booking pace analysis vs historical
- Occupancy forecasts combined with ADR
- Channel distribution application
- Segment-specific forecasting

### (II) Machine Learning Components

**Anomaly Detection in Revenue**
- Z-score analysis for unusual transactions
- Fraud detection (unusual guest patterns)
- Cancelled booking prediction
- No-show prediction

## Implementation Timeline

| Phase | Duration |
|-------|----------|
| Data collection setup | 1 week |
| PMS integration | 1 week |
| Analytics model development | 2 weeks |
| Scenario planning engine | 1 week |
| Dashboard development | 1 week |
| Testing | 1 week |
| **Total** | **7 weeks** |

## Security Requirements

- **Financial Data:** Encrypted at rest and in transit
- **Role-Based Access:** Different views for different roles
- **Audit Trail:** All financial decisions logged
- **Reconciliation:** Monthly bank reconciliation verification
- **Segregation:** Revenue collection separate from analysis

## Financial Analysis

### Initial Costs: LKR 1,800,000
- PMS integration: LKR 600,000
- Analytics development: LKR 700,000
- Dashboard UI: LKR 400,000
- Training: LKR 100,000

### Annual OpEx: LKR 800,000
- Analytics engineer (part-time): LKR 500,000
- Infrastructure: LKR 200,000
- Support: LKR 100,000

### Expected Benefits (Annual)

**Direct Revenue:**
- Better channel optimization: LKR 15-20M
- Reduced discounting: LKR 5-8M
- Quick response to market changes: LKR 3-5M

**Operational:**
- Faster reporting (10 hours/week saved): LKR 2-3M equivalent
- Better negotiations with channels: LKR 5-8M

**Total Benefit: LKR 30-44M annually**
**ROI: 16.7-24.4x**

---

# 6. FORECASTING & ALERTS SYSTEM

## Business Problem

Current forecasting is manual and reactive:
- **Late Warnings:** Demand changes discovered too late
- **Operational Chaos:** Short staffing leads to poor service
- **Missed Revenue:** Cannot pre-position inventory optimally
- **Procurement Waste:** Inaccurate F&B ordering
- **Maintenance Issues:** No advance notice for capacity planning

## Objectives

1. **Accurate 7/30/60/90-day occupancy forecasts** with >90% accuracy
2. **Demand segmentation** (leisure, corporate, MICE)
3. **Anomaly detection** for unusual demand patterns
4. **Operational planning recommendations** (housekeeping, F&B, maintenance)
5. **Intelligent alerting** system with confidence-based thresholds
6. **Alert escalation** based on severity and business impact

## Data Collection

### (i) Data Sources
- **Historical Bookings:** 36+ months of daily occupancy data
- **Booking Pace:** Current vs forecast pickups
- **Calendar Events:** Conferences, holidays, local events
- **External Data:** Weather forecasts, flight data, competitor bookings
- **Market Intelligence:** Google Trends, social media mentions
- **Operational Data:** Past staffing needs, maintenance schedules

### (ii) Data Types
| Data Type | Update Frequency |
|-----------|---|
| Daily occupancy | Real-time |
| Booking pace | Hourly |
| Cancellation patterns | Real-time |
| Lead time distribution | Daily |
| Revenue per segment | Daily |
| Event calendars | Weekly |
| Competitor activity | Daily |

### (iii) Database Schema

```sql
CREATE TABLE forecast_data (
  id UUID PRIMARY KEY,
  property_id UUID,
  forecast_date DATE,
  forecast_horizon INT, -- days ahead
  occupancy_forecast INT, -- 0-100%
  confidence INT, -- 0-100
  segment_leisure INT,
  segment_corporate INT,
  segment_mice INT,
  recommendation TEXT,
  created_at TIMESTAMP,
  actual_occupancy INT, -- filled after actual date
  accuracy_score INT, -- calculated post-date,
  INDEX idx_property_forecast (property_id, forecast_date)
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  property_id UUID,
  alert_type VARCHAR(50), -- occupancy_shock, rate_anomaly, etc.
  severity VARCHAR(20), -- critical, warning, info
  message TEXT,
  triggered_value DECIMAL(10,2),
  threshold DECIMAL(10,2),
  recommendation TEXT,
  created_at TIMESTAMP,
  acked_at TIMESTAMP,
  acked_by VARCHAR(100),
  action_taken TEXT,
  INDEX idx_property_severity_created (property_id, severity, created_at)
);

CREATE TABLE operational_recommendations (
  id UUID PRIMARY KEY,
  property_id UUID,
  forecast_date DATE,
  department VARCHAR(50), -- housekeeping, food_beverage, maintenance
  recommendation TEXT,
  priority INT, -- 1-5
  estimated_impact TEXT,
  action_status VARCHAR(20), -- pending, completed, not_taken
  created_at TIMESTAMP
);
```

## AI and Analytics Components

### (I) Algorithms

**1. Exponential Smoothing Forecast**
```
Forecast(t+n) = α × Recent_Occupancy + (1-α) × Trend + Seasonality
Where α = 0.3 (weighting recent vs historical)
```

**2. Confidence Interval Calculation**
```
Confidence = 95 - (Days_Ahead × 0.5)
So: 7-day forecast = 91.5% conf
    30-day forecast = 80% conf
    90-day forecast = 50% conf
```

**3. Demand Segmentation**
- Leisure: High weekend preference, longer lead time
- Corporate: Mid-week preference, short lead time
- MICE: Event-driven, variable lead time
- Classification: Booking characteristics + historical ratios

**4. Anomaly Detection**
- Statistical: >2 standard deviations
- Pattern: Unusual booking pace vs historical
- Competitive: Competitor rate drops, market share loss
- Contextual: Event cancellations, natural disasters

### (II) Machine Learning Components

**Demand Shock Detection**
- Real-time monitoring of booking pace
- Automatic anomaly alerting
- Root cause categorization
- Impact projection

**Operational Planning Optimizer**
- Housekeeping load forecasting
- F&B procurement requirements
- Maintenance window identification
- Staff scheduling optimization

## Implementation Timeline

| Phase | Duration |
|-------|----------|
| Historical data collection | 1 week |
| ML model development | 2 weeks |
| Forecasting engine build | 2 weeks |
| Alert system development | 1 week |
| Operational recommendations | 1 week |
| Testing & tuning | 1 week |
| Pilot deployment | 1 week |
| **Total** | **9 weeks** |

## Security Requirements

- **Alert Routing:** Role-based alert delivery
- **Sensitive Data:** Competitor data handled confidentially
- **Notification Channels:** SMS/email/app alerts encrypted
- **Audit:** All alerts and actions logged

## Financial Analysis

### Initial Costs: LKR 2,500,000
- Data scientist: LKR 1,000,000
- ML engineer: LKR 800,000
- Alert system development: LKR 400,000
- Operational tools: LKR 300,000

### Annual OpEx: LKR 1,500,000
- ML model maintenance: LKR 800,000
- Alert infrastructure: LKR 400,000
- Team support: LKR 300,000

### Expected Benefits (Annual)

**Operational Efficiency:**
- Better staffing decisions: LKR 8-12M (reduced overtime/understaffing)
- Reduced procurement waste: LKR 3-5M (better forecasting)
- Maintenance optimization: LKR 2-3M (planned vs emergency)

**Revenue Protection:**
- Early demand detection: LKR 5-8M (quick rate adjustments)
- Loss prevention: LKR 2-3M (security alerting)
- Ancillary revenue: LKR 2-3M (F&B upselling)

**Total Benefit: LKR 22-34M annually**
**ROI: 8.8-13.6x**

---

## IMPLEMENTATION ROADMAP & SUMMARY

### Phased Rollout Plan

**Q3 2026 (Immediate - 12 weeks)**
- Executive Dashboard (Week 1-8)
- Dynamic Pricing (Week 3-12)
- Core Forecasting (Week 6-12)

**Q4 2026 (13-24 weeks)**
- Guest Intelligence (Week 13-21)
- Revenue Hub (Week 16-23)
- Sustainability (Week 18-25)
- Advanced Alerts (Week 22-30)

**Q1 2027 (25+ weeks)**
- ML model optimization
- Full feature rollout
- Multi-property chains
- Mobile applications

### Total Project Investment

**Total Initial Cost:** LKR 15,800,000
- Dashboard: LKR 6.55M
- Pricing: LKR 3.85M
- Guest Intelligence: LKR 2.5M
- Sustainability: LKR 3.2M
- Revenue Hub: LKR 1.8M
- Forecasting: LKR 2.5M
- Project Overhead: LKR -5.2M (shared infrastructure savings)

**Total Annual OpEx:** LKR 13,700,000

### Total Expected Benefits (Year 1)

| Module | Annual Benefit |
|--------|---|
| Executive Dashboard | LKR 51-79M |
| Dynamic Pricing | LKR 60-88M |
| Guest Intelligence | LKR 43-63M |
| Sustainability | LKR 15.5-24M |
| Revenue Hub | LKR 30-44M |
| Forecasting & Alerts | LKR 22-34M |
| **Total** | **LKR 221.5-332M** |

**ROI: 14x - 21x in Year 1**
**Payback Period: 1.7-2.1 months**

### Critical Success Factors

1. **Executive Sponsorship:** C-level buy-in and change management
2. **Data Quality:** Clean, consistent data from PMS and other sources
3. **User Training:** Comprehensive training for all stakeholders
4. **Iterative Approach:** Pilot first, learn, then scale
5. **Continuous Improvement:** Monthly reviews and optimization
6. **Support Team:** Dedicated team for operations and enhancements

### Key Performance Indicators (KPIs) to Track

| KPI | Target | Measurement |
|---|---|---|
| System Uptime | 99.9% | Monthly |
| User Adoption | 85%+ | Monthly |
| Dashboard Load Time | <2 sec | Weekly |
| Forecast Accuracy | >90% | Weekly |
| Revenue Uplift | 3-5% | Monthly |
| Cost Savings | LKR 20-30M | Quarterly |
| Customer Satisfaction | 4.5/5 | Quarterly |
| Incident Response | <1 hour | Real-time |

---

## CONCLUSION

JetMind represents a transformational investment in Jetwing Symphony's operational intelligence. By integrating real-time analytics, predictive forecasting, and automated optimization across revenue, guest experience, and sustainability, the platform enables:

- **Strategic Decision Making:** Data-driven decisions in seconds, not days
- **Operational Excellence:** Optimized staffing, procurement, and maintenance
- **Revenue Maximization:** LKR 220-330M incremental annual revenue
- **Guest Satisfaction:** Personalized experiences and loyalty
- **Sustainability Leadership:** ISO 14001 compliance and ESG excellence
- **Competitive Advantage:** Market-leading intelligence platform

**Recommendation:** Proceed with phased implementation starting Q3 2026, with Executive Dashboard and Dynamic Pricing as Minimum Viable Product (MVP).

---

*Document prepared for Jetwing Symphony PLC leadership review*  
*Version 1.0 | June 1, 2026*
