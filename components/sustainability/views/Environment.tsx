"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import type { SustainabilityEnvironmentRow } from "@/lib/sustainability/types";
import {
  C,
  carbonMonthly,
  carbonForecast,
  scopeSplit,
  carbonReductionProgress,
  energyMonthly,
  energyByHotel,
  renewableMix,
  peakDemand,
  waterByHotel,
  waterSourceSplit,
  waterRecyclingTrend,
  waterStress,
  leakAlerts,
  wasteDiversion,
  wasteMethods,
  wasteMonthly,
  biodigesters,
  speciesRecorded,
  habitatCoverage,
  conservationProjects,
  speciesGrowth,
} from "../data";
import {
  Card,
  ChartCard,
  StatTile,
  Donut,
  HBar,
  VBar,
  AreaTrend,
  ForecastChart,
  SeverityPill,
  ProgressBar,
  PageHeader,
} from "../ui";

function n(value: number | null | undefined) {
  return Number(value ?? 0);
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString('en', {
    month: 'short',
  });
}

function sumRows(
  rows: SustainabilityEnvironmentRow[],
  key: keyof SustainabilityEnvironmentRow,
) {
  return rows.reduce((total, row) => total + n(row[key] as number | null), 0);
}

function latestRow(rows: SustainabilityEnvironmentRow[]) {
  return [...rows].sort((a, b) => {
    if (a.report_year !== b.report_year) {
      return b.report_year - a.report_year;
    }

    return b.report_month - a.report_month;
  })[0];
}

function noDataMessage(title: string, subtitle: string) {
  return (
    <Card className="p-6">
      <p className="text-sm font-semibold" style={{ color: C.text }}>
        No sustainability data found for this selection.
      </p>
      <p className="text-xs mt-1" style={{ color: C.subtext }}>
        {title} · {subtitle}
      </p>
    </Card>
  );
}

// ── Climate Action ───────────────────────────────────────────────────────────
export function ClimateAction({ rows }: { rows: SustainabilityEnvironmentRow[] }) {
  if (rows.length === 0) {
    return (
      <div>
        <PageHeader
          title="Climate Action"
          subtitle="Carbon emissions analytics and scope breakdown"
        />
        {noDataMessage("Climate Action", "Add rows to sustainability_environment_dashboard_monthly")}
      </div>
    );
  }

  const totalScope1 = rows.reduce((total, row) => total + n(row.scope1_tco2e), 0);
  const totalScope2 = rows.reduce((total, row) => total + n(row.scope2_tco2e), 0);
  const totalEmissions = rows.reduce((total, row) => total + n(row.total_scope1_2_tco2e), 0);
  const latest = latestRow(rows);
  const missingFactorCount = rows.reduce(
    (total, row) => total + n(row.missing_emission_factor_count),
    0,
  );

  const carbonMonthlyFromSupabase = rows.map((row) => ({
    month: monthLabel(row.report_year, row.report_month),
    scope1: n(row.scope1_tco2e),
    scope2: n(row.scope2_tco2e),
  }));

  const scopeSplitFromSupabase = [
    { name: 'Scope 1', value: Number(totalScope1.toFixed(2)), color: C.accent },
    { name: 'Scope 2', value: Number(totalScope2.toFixed(2)), color: C.blue },
  ];

  return (
    <div>
      <section data-export-block="true">
        <PageHeader
          title="Climate Action"
          subtitle="Carbon emissions analytics, scope breakdown and AI-driven forecasting"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Total Emissions"
            value={`${totalEmissions.toFixed(1)} tCO₂e`}
            sub="Scope 1 + Scope 2"
            accent={C.primary}
          />
          <StatTile
            label="Scope 1 — Direct"
            value={`${totalScope1.toFixed(1)} tCO₂e`}
            sub="Direct emissions"
            accent={C.accent}
          />
          <StatTile
            label="Scope 2 — Indirect"
            value={`${totalScope2.toFixed(1)} tCO₂e`}
            sub="Grid electricity emissions"
            accent={C.blue}
          />
          <StatTile
            label="CO₂ / Guest Night"
            value={latest?.kgco2e_per_occupied_room == null ? 'N/A' : `${Number(latest.kgco2e_per_occupied_room).toFixed(1)} kg`}
            sub={missingFactorCount > 0 ? `${missingFactorCount} missing emission factors` : 'Latest available month'}
            accent={C.green}
          />
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ChartCard
              title="Monthly Emissions Trend"
              subtitle="Scope 1 vs Scope 2 (tCO₂)"
            >
              <VBar
                data={carbonMonthlyFromSupabase}
                stacked
                bars={[
                  { key: "scope1", name: "Scope 1", color: C.accent },
                  { key: "scope2", name: "Scope 2", color: C.blue },
                ]}
                unit=""
              />
            </ChartCard>
          </div>
          <ChartCard title="Scope Split" subtitle="FY 2024/25 (tCO₂)">
            <Donut data={scopeSplitFromSupabase} unit=" tCO₂" />
          </ChartCard>
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="Carbon Reduction Progress"
            subtitle="Trajectory toward 2030 target (tCO₂)"
          >
            <VBar
              data={carbonReductionProgress}
              xKey="year"
              bars={[{ key: "value", name: "Emissions", color: C.primary }]}
            />
          </ChartCard>
          <ChartCard
            title="AI Forecast — Next 12 Months"
            subtitle="Projected emissions with 95% confidence band"
          >
            <ForecastChart data={carbonForecast} />
          </ChartCard>
        </div>
      </section>
    </div>
  );
}

// ── Energy Management ────────────────────────────────────────────────────────
export function EnergyManagement({ rows }: { rows: SustainabilityEnvironmentRow[] }) {
  if (rows.length === 0) {
    return (
      <div>
        <PageHeader
          title="Energy Management"
          subtitle="Electricity consumption and renewable energy share"
        />
        {noDataMessage("Energy Management", "Add rows to sustainability_environment_dashboard_monthly")}
      </div>
    );
  }

  const totalEnergy = rows.reduce((total, row) => total + n(row.total_energy_kwh), 0);
  const renewableEnergy = rows.reduce((total, row) => total + n(row.renewable_energy_kwh), 0);
  const solarEnergy = rows.reduce((total, row) => total + n(row.solar_pv_kwh), 0);
  const renewableShare = totalEnergy === 0 ? 0 : (renewableEnergy / totalEnergy) * 100;

  const energyMonthlyFromSupabase = rows.map((row) => ({
    month: monthLabel(row.report_year, row.report_month),
    grid: n(row.grid_electricity_kwh) / 1000,
    solar: n(row.solar_pv_kwh) / 1000,
  }));

  const renewableMixFromSupabase = [
    { name: 'Renewable', value: Number(renewableShare.toFixed(1)), color: C.primary },
    { name: 'Non Renewable', value: Number(Math.max(0, 100 - renewableShare).toFixed(1)), color: C.muted },
  ];

  const energyByPropertyFromSupabase = rows.map((row) => ({
    name: row.property_name,
    value: n(row.total_energy_kwh) / 1000,
  }));

  return (
    <div>
      <section data-export-block="true">
        <PageHeader
          title="Energy Management"
          subtitle="Electricity consumption, solar generation and demand analytics"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Total Consumption"
            value={`${(totalEnergy / 1000).toFixed(1)} MWh`}
            sub="Selected period"
            accent={C.primary}
          />
          <StatTile
            label="Solar Generated"
            value={`${(solarEnergy / 1000).toFixed(1)} MWh`}
            sub="Solar PV"
            accent={C.accent}
          />
          <StatTile
            label="Renewable Share"
            value={`${renewableShare.toFixed(1)}%`}
            sub="Renewable / total energy"
            accent={C.green}
          />
          <StatTile
            label="Renewable Energy"
            value={`${(renewableEnergy / 1000).toFixed(1)} MWh`}
            sub="Solar, biomass, biogas"
            accent={C.blue}
          />
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ChartCard
              title="Grid vs Solar — Monthly"
              subtitle="MWh consumed / generated"
            >
              <AreaTrend
                data={energyMonthlyFromSupabase}
                series={[
                  { key: "grid", name: "Grid Electricity", color: C.blue },
                  { key: "solar", name: "Solar Generation", color: C.accent },
                ]}
              />
            </ChartCard>
          </div>
          <ChartCard
            title="Renewable Energy Mix"
            subtitle="Share of total energy"
          >
            <Donut data={renewableMixFromSupabase} unit="%" />
          </ChartCard>
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Hotel-wise Energy Usage"
            subtitle="Grid consumption (MWh)"
          >
            <HBar
              data={energyByPropertyFromSupabase}
              color={C.blue}
              unit=" MWh"
              height={300}
            />
          </ChartCard>
          <ChartCard
            title="Peak Demand Analysis"
            subtitle="Peak vs average load (kW)"
          >
            <AreaTrend
              data={peakDemand}
              series={[
                { key: "peak", name: "Peak Demand", color: C.secondary },
                { key: "avg", name: "Average Load", color: C.primary },
              ]}
              unit=""
            />
          </ChartCard>
        </div>
      </section>
    </div>
  );
}

// ── Water Management ─────────────────────────────────────────────────────────
function StressBar({ index, level }: { index: number; level: string }) {
  const color =
    level === "High" ? C.red : level === "Medium" ? C.amber : C.primary;
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-2 rounded-full"
        style={{ backgroundColor: C.border }}
      >
        <div
          className="h-2 rounded-full"
          style={{ width: `${index}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>
        {index}
      </span>
    </div>
  );
}

export function WaterManagement({ rows }: { rows: SustainabilityEnvironmentRow[] }) {
  if (rows.length === 0) {
    return (
      <div>
        <PageHeader
          title="Water Management"
          subtitle="Consumption, recycling and water source split"
        />
        {noDataMessage("Water Management", "Add rows to sustainability_environment_dashboard_monthly")}
      </div>
    );
  }

  const totalWater = rows.reduce((total, row) => total + n(row.total_water_l), 0);
  const recycledWater = rows.reduce((total, row) => {
    const rowTotalWater = n(row.total_water_l);
    const rowRecyclingPct = n(row.water_recycling_rate_pct);
    return total + (rowTotalWater * rowRecyclingPct) / 100;
  }, 0);
  const recyclingRate = totalWater === 0 ? 0 : (recycledWater / totalWater) * 100;
  const latest = latestRow(rows);

  const waterByPropertyFromSupabase = rows.map((row) => ({
    name: row.property_name,
    value: n(row.total_water_l) / 1000,
    saved: (n(row.total_water_l) * n(row.water_recycling_rate_pct)) / 100 / 1000,
  }));

  const waterSourceSplitFromSupabase = [
    { name: 'Municipal', value: n(latest?.municipal_share_pct), color: C.blueDark },
    { name: 'Groundwater', value: n(latest?.groundwater_share_pct), color: C.blue },
    { name: 'Rainwater', value: n(latest?.rainwater_share_pct), color: C.teal },
    { name: 'Recycled', value: n(latest?.water_recycling_rate_pct), color: C.primaryLight },
  ];

  const waterRecyclingTrendFromSupabase = rows.map((row) => ({
    month: monthLabel(row.report_year, row.report_month),
    recycled: n(row.water_recycling_rate_pct),
  }));

  return (
    <div>
      <section data-export-block="true">
        <PageHeader
          title="Water Management"
          subtitle="Consumption, recycling, water stress and leakage detection"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Total Consumption"
            value={`${(totalWater / 1000000).toFixed(2)}M L`}
            sub="Selected period"
            accent={C.blue}
          />
          <StatTile
            label="Water Recycled"
            value={`${recyclingRate.toFixed(1)}%`}
            sub="Recycled / total water"
            accent={C.teal}
          />
          <StatTile
            label="Water / Occupied Room"
            value={latest?.water_l_per_occupied_room == null ? 'N/A' : `${Number(latest.water_l_per_occupied_room).toFixed(1)} L`}
            sub="Latest available month"
            accent={C.green}
          />
          <StatTile
            label="Recycled Water"
            value={`${(recycledWater / 1000).toFixed(1)} m³`}
            sub="Estimated from monthly records"
            accent={C.primary}
          />
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ChartCard
              title="Water Consumption by Hotel"
              subtitle="Withdrawal (m³) vs savings achieved (m³)"
            >
              <VBar
                data={waterByPropertyFromSupabase}
                xKey="name"
                height={320}
                bars={[
                  { key: "value", name: "Consumption", color: C.blue },
                  { key: "saved", name: "Savings", color: C.teal },
                ]}
                unit=""
              />
            </ChartCard>
          </div>
          <ChartCard title="Withdrawal by Source" subtitle="Share of total">
            <Donut data={waterSourceSplitFromSupabase} unit="%" />
          </ChartCard>
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Water Recycling Performance"
            subtitle="Recycled share trend (%)"
          >
            <AreaTrend
              data={waterRecyclingTrendFromSupabase}
              series={[{ key: "recycled", name: "Recycled %", color: C.teal }]}
              unit="%"
            />
          </ChartCard>

          <div className="space-y-6">
            <Card className="p-5">
              <p className="text-sm font-bold mb-3" style={{ color: C.text }}>
                Water Stress Index by Hotel
              </p>
              <div className="space-y-3">
                {waterStress.map((w) => (
                  <div key={w.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-medium"
                        style={{ color: C.text }}
                      >
                        {w.name}
                      </span>
                      <SeverityPill level={w.level} />
                    </div>
                    <StressBar index={w.index} level={w.level} />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" style={{ color: C.amber }} />
                <p className="text-sm font-bold" style={{ color: C.text }}>
                  Leakage Detection Alerts
                </p>
              </div>
              <div className="space-y-2">
                {leakAlerts.map((l, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{ backgroundColor: C.bg }}
                  >
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: C.text }}
                      >
                        {l.hotel}
                      </p>
                      <p className="text-[11px]" style={{ color: C.subtext }}>
                        {l.zone} · {l.detected}
                      </p>
                    </div>
                    <div className="text-right">
                      <SeverityPill level={l.severity} />
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: C.muted }}
                      >
                        {l.loss}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Waste Management ─────────────────────────────────────────────────────────
export function WasteManagement({ rows }: { rows: SustainabilityEnvironmentRow[] }) {
  if (rows.length === 0) {
    return (
      <div>
        <PageHeader
          title="Waste Management"
          subtitle="Generation, recycling and diversion performance"
        />
        {noDataMessage("Waste Management", "Add rows to sustainability_environment_dashboard_monthly")}
      </div>
    );
  }

  const totalWaste = rows.reduce((total, row) => total + n(row.total_waste_kg), 0);
  const divertedWaste = rows.reduce((total, row) => total + n(row.diverted_kg), 0);
  const landfillWaste = rows.reduce((total, row) => {
    return total + (n(row.total_waste_kg) * n(row.landfill_rate_pct)) / 100;
  }, 0);
  const diversionRate = totalWaste === 0 ? 0 : (divertedWaste / totalWaste) * 100;
  const latest = latestRow(rows);

  const wasteDiversionFromSupabase = [
    { name: 'Diverted', value: divertedWaste / 1000, color: C.primary },
    { name: 'Landfill', value: landfillWaste / 1000, color: C.red },
  ];

  const wasteMonthlyFromSupabase = rows.map((row) => ({
    month: monthLabel(row.report_year, row.report_month),
    generated: n(row.total_waste_kg) / 1000,
    recycled: n(row.diverted_kg) / 1000,
  }));

  return (
    <div>
      <section data-export-block="true">
        <PageHeader
          title="Waste Management"
          subtitle="Generation, recycling, composting and biodigester performance"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Total Waste"
            value={`${(totalWaste / 1000).toFixed(1)} t`}
            sub="Selected period"
            accent={C.primary}
          />
          <StatTile
            label="Diversion Rate"
            value={`${diversionRate.toFixed(1)}%`}
            sub={`${(divertedWaste / 1000).toFixed(1)} t diverted`}
            accent={C.teal}
          />
          <StatTile
            label="To Landfill"
            value={`${(landfillWaste / 1000).toFixed(1)} t`}
            sub="Landfill waste"
            accent={C.red}
          />
          <StatTile
            label="Recycling Rate"
            value={latest?.recycling_rate_pct == null ? 'N/A' : `${n(latest.recycling_rate_pct).toFixed(1)}%`}
            sub="Latest month"
            accent={C.accent}
          />
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ChartCard title="Diversion vs Landfill" subtitle="Tonnes">
            <Donut data={wasteDiversionFromSupabase} unit=" t" />
          </ChartCard>
          <div className="lg:col-span-2">
            <ChartCard title="Treatment Methods" subtitle="By volume (tonnes)">
              <HBar data={wasteMethods} perBarColor unit=" t" height={260} />
            </ChartCard>
          </div>
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Generated vs Recycled" subtitle="Monthly (tonnes)">
            <VBar
              data={wasteMonthlyFromSupabase}
              bars={[
                { key: "generated", name: "Generated", color: C.muted },
                { key: "recycled", name: "Recycled", color: C.primary },
              ]}
              unit=" t"
            />
          </ChartCard>
          <Card className="p-5">
            <p className="text-sm font-bold mb-4" style={{ color: C.text }}>
              Biodigester Performance
            </p>
            <div className="space-y-4">
              {biodigesters.map((b) => (
                <div key={b.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: C.text }}
                    >
                      {b.name}
                    </span>
                    <span className="text-xs" style={{ color: C.subtext }}>
                      {b.utilisation}% util · {b.biogas} m³/day biogas
                    </span>
                  </div>
                  <ProgressBar
                    value={b.utilisation}
                    color={
                      b.utilisation > 85
                        ? C.green
                        : b.utilisation > 75
                          ? C.primary
                          : C.accent
                    }
                  />
                </div>
              ))}
            </div>
            <div
              className="mt-5 rounded-lg p-4"
              style={{ backgroundColor: C.softGreen }}
            >
              <p className="text-2xl font-bold" style={{ color: C.primary }}>
                684,000
              </p>
              <p className="text-sm font-semibold" style={{ color: C.text }}>
                reusable glass bottles filled
              </p>
              <p className="text-xs mt-1" style={{ color: C.subtext }}>
                preventing 6,800 kg of single-use plastic from landfill
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

// ── Biodiversity ─────────────────────────────────────────────────────────────
export function Biodiversity({ rows = [] }: { rows?: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return (
      <div>
        <section data-export-block="true">
          <PageHeader
            title="Biodiversity"
            subtitle="Species monitoring, habitat protection and conservation projects"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatTile
              label="Species Recorded"
              value="344"
              sub="Rapid biodiversity survey"
              accent={C.teal}
            />
            <StatTile
              label="Endemicity Rate"
              value="11.4%"
              sub="Endemic species"
              accent={C.primaryDark}
            />
            <StatTile
              label="Protected Habitat"
              value="88 ha"
              sub="Across properties"
              accent={C.primary}
            />
            <StatTile
              label="Active Projects"
              value="5"
              sub="4 on track, 1 at risk"
              accent={C.accent}
            />
          </div>
        </section>

        <section data-export-block="true">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <ChartCard
                title="Species Growth — Vil Uyana"
                subtitle="2005 vs 2025 (count by group)"
              >
                <VBar
                  data={speciesGrowth}
                  xKey="name"
                  height={300}
                  bars={[
                    { key: "y2005", name: "2005", color: C.muted },
                    { key: "y2025", name: "2025", color: C.primary },
                  ]}
                />
              </ChartCard>
            </div>
            <ChartCard
              title="Protected Habitat Coverage"
              subtitle="Share by type"
            >
              <Donut data={habitatCoverage} unit="%" />
            </ChartCard>
          </div>
        </section>

        <section data-export-block="true">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Species Recorded by Group"
              subtitle="Current survey count"
            >
              <HBar data={speciesRecorded} color={C.teal} height={260} />
            </ChartCard>
            <Card className="p-5">
              <p className="text-sm font-bold mb-4" style={{ color: C.text }}>
                Conservation Project Status
              </p>
              <div className="space-y-4">
                {conservationProjects.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: C.text }}
                      >
                        {p.name}
                      </span>
                      <SeverityPill level={p.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={p.progress}
                        color={p.status === "At Risk" ? C.amber : C.primary}
                      />
                      <span
                        className="text-[11px] w-16 text-right"
                        style={{ color: C.muted }}
                      >
                        {p.lead}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  const sortedRows = [...rows].sort((a, b) => Number(b.report_year) - Number(a.report_year));
  const latest = sortedRows[0];
  const totalSpecies = rows.reduce((acc, row) => acc + Number(row.species_richness || 0), 0);
  const totalHabitat = rows.reduce((acc, row) => acc + Number(row.protected_habitat_hectares || 0), 0);
  const activeProjects = rows.reduce((acc, row) => acc + Number(row.active_conservation_projects || 0), 0);

  const isAllProperties = Array.from(new Set(rows.map(r => r.property_id))).length > 1;

  return (
    <div>
      <section data-export-block="true">
        <PageHeader
          title="Biodiversity"
          subtitle="Species monitoring, habitat protection and conservation projects"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Species Recorded"
            value={(isAllProperties ? totalSpecies : (latest.species_richness as number || 0)).toString()}
            sub={isAllProperties ? "Total across properties" : "Latest survey"}
            accent={C.teal}
          />
          <StatTile
            label="Endemic Species"
            value={((latest.endemic_species_count as number) || 0).toString()}
            sub="Endemic species"
            accent={C.primaryDark}
          />
          <StatTile
            label="Protected Habitat"
            value={`${totalHabitat.toFixed(1)} ha`}
            sub="Across properties"
            accent={C.primary}
          />
          <StatTile
            label="Active Projects"
            value={activeProjects.toString()}
            sub="Currently active"
            accent={C.accent}
          />
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ChartCard
              title="Species Growth — Vil Uyana"
              subtitle="2005 vs 2025 (count by group)"
            >
              <VBar
                data={speciesGrowth}
                xKey="name"
                height={300}
                bars={[
                  { key: "y2005", name: "2005", color: C.muted },
                  { key: "y2025", name: "2025", color: C.primary },
                ]}
              />
            </ChartCard>
          </div>
          <ChartCard
            title="Protected Habitat Coverage"
            subtitle="Share by type"
          >
            <Donut data={habitatCoverage} unit="%" />
          </ChartCard>
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Species Recorded by Group"
            subtitle="Current survey count"
          >
            <HBar data={speciesRecorded} color={C.teal} height={260} />
          </ChartCard>
          <Card className="p-5">
            <p className="text-sm font-bold mb-4" style={{ color: C.text }}>
              Conservation Project Status
            </p>
            <div className="space-y-4">
              {conservationProjects.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: C.text }}
                    >
                      {p.name}
                    </span>
                    <SeverityPill level={p.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      value={p.progress}
                      color={p.status === "At Risk" ? C.amber : C.primary}
                    />
                    <span
                      className="text-[11px] w-16 text-right"
                      style={{ color: C.muted }}
                    >
                      {p.lead}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
