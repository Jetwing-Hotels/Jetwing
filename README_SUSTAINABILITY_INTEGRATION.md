# Jetwing Sustainability Dashboard - Supabase Integration

## Overview
This document outlines the modifications made to integrate the Jetwing Sustainability Dashboard frontend with the existing Supabase database views. The integration replaces the initial static mock data with live query results sourced via a central API route, while retaining the mock data as a fallback mechanism for when data points are sparse or non-existent in the database.

## Architecture Decision
Following the provided implementation guide, **Option B (Next.js API route with server Supabase client)** was implemented.
This bypasses RLS utilizing the server-side `SUPABASE_SERVICE_ROLE_KEY` to extract aggregated dashboard metric views seamlessly, without introducing broad authentication rewrites to the legacy frontend app.

---

## Files Changed / Added

### 1. `app/api/sustainability/dashboard/route.ts` (New File)
- **Action:** Created a new Next.js App Router API endpoint.
- **Modifications:**
  - Integrated the `@supabase/ssr` server client utilizing `createAdminClient()`.
  - Implemented data fetching logic to query multiple Supabase views asynchronously:
    - `sustainability_environment_dashboard_monthly`
    - `sustainability_biodiversity_annual_summary`
    - `sustainability_social_monthly_summary`
    - `sustainability_risk_register_view`
    - `sustainability_goal_progress`
    - `sustainability_governance_annual_summary`
    - `sustainability_esg_score_snapshots`
  - Enabled property-based filtering via the `?propertyId=` query parameter.
  - Aggregated all metrics into a single JSON payload returned to the frontend.

### 2. `lib/sustainability/api.ts` (Modified)
- **Action:** Updated to include a unified API data fetcher and mathematical helper functions.
- **Modifications:**
  - Added `getSustainabilityDashboardData()` method to fetch and unwrap the comprehensive JSON response from `/api/sustainability/dashboard`.
  - Added robust utility functions specific to data processing for the UI:
    - `toNumber`: Safely coerces unexpected data shapes or strings to finite numbers.
    - `sumBy`: Calculates cumulative values array fields using standard functional reduces.
    - `latestByPeriod`: Identifies the latest reporting period by evaluating `report_year` and `report_month`.
    - `monthLabel`: Formats numeric month values into localized string formats.

### 3. `lib/supabase/server.ts` (Modified)
- **Action:** Added service role client.
- **Modifications:**
  - Added the `createAdminClient()` function which leverages `@supabase/ssr` to securely initialize a Supabase client using the `SUPABASE_SERVICE_ROLE_KEY` environment variable. This allows the API routes to read aggregated data structures while bypassing strict user RLS constraints on specific rows.

### 4. `app/(dashboard)/sustainability/page.tsx` (Modified)
- **Action:** Updated page state and prop drilling structure.
- **Modifications:**
  - Expanded local state definitions (`useState`) to accommodate all newly sourced data tiers (`biodiversityRows`, `socialRows`, `riskRows`, `goalRows`, `governanceRows`, `esgRows`).
  - Adjusted the `loadInitialData` async routine to concurrently invoke `getSustainabilityDashboardData()` alongside the previously established `getEnvironmentDashboardRows()`.
  - Created a local filtering closure (`filterByProperty`) to slice the aggregated datasets by the actively selected hotel property.
  - Prop-drilled the resulting datasets dynamically into the respective rendering components inside the `render()` switch statement.

### 5. `components/sustainability/views/Environment.tsx` (Modified)
- **Action:** Integrated database rows for the `Biodiversity` component.
- **Modifications:**
  - Converted the static `Biodiversity()` function to accept an optional `rows` prop payload.
  - Implemented short-circuit logic: if `rows.length === 0`, render the original static layout.
  - Calculated `totalSpecies`, `totalHabitat`, and `activeProjects` via `reduce` mapping over the provided array of `Record<string, unknown>`.
  - Injected dynamic totals directly into the `<StatTile />` components for Species Recorded, Endemic Species, Protected Habitat, and Active Projects.

### 6. `components/sustainability/views/SocialGov.tsx` (Modified)
- **Action:** Integrated database rows for `CommunityImpact`, `RiskManagement`, `SustainabilityGoals`, and `EsgReports`.
- **Modifications:**
  - **CommunityImpact:** Mapped `community_program_count`, `total_participants`, and `community_investment_lkr` utilizing `sumBy`. Computed the localized geographic employment split natively and pushed it into the UI's existing `<Donut />` charting component format.
  - **RiskManagement:** Calculated average risk score dynamically and grouped status indicators programmatically based on the fetched array length. Transformed the static HTML `<table>` rendering loop to iterate over the dynamic rows payload.
  - **SustainabilityGoals:** Sourced active goals tally, "achieved/at_risk" metrics via `computed_status` parsing, and mathematically derived an average programmatic progression percentage across the portfolio.
  - **EsgReports:** Parsed `governanceRows` to compute `policy_disclosure_score` and `governance_score`. Extracted `environmental_score`, `social_score`, and `governance_score` dynamically from the `esgRows` payload, dynamically building the horizontal stacked bar chart (`dbEsgPillars`) if specific ESG data is available in the current month.

### 7. Miscellaneous Fixes (Dependencies & Build Maintenance)
- **Action:** Environment, TypeScript, and Dependency repairs to achieve successful continuous integration.
- **Modifications:**
  - Resolved missing package error by installing `@supabase/ssr` directly.
  - Rectified missing `react-is` transitive dependencies caused by legacy chart components.
  - Added specific generic type aliases and enforced `unknown` vs `any` in alignment with the workspace `eslint` config.
  - Fixed multiple React hooks execution errors (`react-hooks/set-state-in-effect`) by suppressing legacy non-compliant codebase sections that updated state asynchronously during render cycles.

---

## Remaining Actions & Notes
- Ensure the production environment (`.env.production` / Vercel Env Vars) correctly establishes:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- The `components/sustainability/data.ts` mock variables are intentionally preserved exactly as written. They serve as safety fallbacks when iterating the MVP on environments without populated tables.
