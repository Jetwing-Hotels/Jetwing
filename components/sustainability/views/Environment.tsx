"use client"

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  C, carbonMonthly, carbonForecast, scopeSplit, carbonReductionProgress,
  energyMonthly, energyByHotel, renewableMix, peakDemand,
  waterByHotel, waterSourceSplit, waterRecyclingTrend, waterStress, leakAlerts,
  wasteDiversion, wasteMethods, wasteMonthly, biodigesters,
  speciesRecorded, habitatCoverage, conservationProjects, speciesGrowth,
} from '../data';
import {
  Card, ChartCard, StatTile, Donut, HBar, VBar, AreaTrend, ForecastChart, SeverityPill, ProgressBar, PageHeader,
} from '../ui';

// ── Climate Action ───────────────────────────────────────────────────────────
export function ClimateAction() {
  return (
    <div>
      <PageHeader title="Climate Action" subtitle="Carbon emissions analytics, scope breakdown and AI-driven forecasting" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Emissions" value="9,257 tCO₂" sub="−18.2% YoY" accent={C.primary} />
        <StatTile label="Scope 1 — Direct" value="2,353 tCO₂" sub="25% of total" accent={C.accent} />
        <StatTile label="Scope 2 — Indirect" value="6,904 tCO₂" sub="75% of total" accent={C.blue} />
        <StatTile label="CO₂ / Guest Night" value="↓19%" sub="Intensity reduction" accent={C.green} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartCard title="Monthly Emissions Trend" subtitle="Scope 1 vs Scope 2 (tCO₂)">
            <VBar data={carbonMonthly} stacked bars={[
              { key: 'scope1', name: 'Scope 1', color: C.accent },
              { key: 'scope2', name: 'Scope 2', color: C.blue },
            ]} unit="" />
          </ChartCard>
        </div>
        <ChartCard title="Scope Split" subtitle="FY 2024/25 (tCO₂)">
          <Donut data={scopeSplit} unit=" tCO₂" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Carbon Reduction Progress" subtitle="Trajectory toward 2030 target (tCO₂)">
          <VBar data={carbonReductionProgress} xKey="year" bars={[{ key: 'value', name: 'Emissions', color: C.primary }]} />
        </ChartCard>
        <ChartCard title="AI Forecast — Next 12 Months" subtitle="Projected emissions with 95% confidence band">
          <ForecastChart data={carbonForecast} />
        </ChartCard>
      </div>
    </div>
  );
}

// ── Energy Management ────────────────────────────────────────────────────────
export function EnergyManagement() {
  return (
    <div>
      <PageHeader title="Energy Management" subtitle="Electricity consumption, solar generation and demand analytics" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Consumption" value="46.1M kWh" sub="−2.2% YoY" accent={C.primary} />
        <StatTile label="Solar Generated" value="3.44M kWh" sub="+11.6% YoY" accent={C.accent} />
        <StatTile label="Renewable Share" value="27%" sub="Target 40% by 2028" accent={C.green} />
        <StatTile label="Solar Capacity" value="2.6 MW" sub="Across 16 properties" accent={C.blue} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartCard title="Grid vs Solar — Monthly" subtitle="MWh consumed / generated">
            <AreaTrend data={energyMonthly} series={[
              { key: 'grid', name: 'Grid Electricity', color: C.blue },
              { key: 'solar', name: 'Solar Generation', color: C.accent },
            ]} />
          </ChartCard>
        </div>
        <ChartCard title="Renewable Energy Mix" subtitle="Share of total energy">
          <Donut data={renewableMix} unit="%" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Hotel-wise Energy Usage" subtitle="Grid consumption (MWh)">
          <HBar data={energyByHotel} color={C.blue} unit=" MWh" height={300} />
        </ChartCard>
        <ChartCard title="Peak Demand Analysis" subtitle="Peak vs average load (kW)">
          <AreaTrend data={peakDemand} series={[
            { key: 'peak', name: 'Peak Demand', color: C.secondary },
            { key: 'avg', name: 'Average Load', color: C.primary },
          ]} unit="" />
        </ChartCard>
      </div>
    </div>
  );
}

// ── Water Management ─────────────────────────────────────────────────────────
function StressBar({ index, level }: { index: number; level: string }) {
  const color = level === 'High' ? C.red : level === 'Medium' ? C.amber : C.primary;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: C.border }}>
        <div className="h-2 rounded-full" style={{ width: `${index}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{index}</span>
    </div>
  );
}

export function WaterManagement() {
  return (
    <div>
      <PageHeader title="Water Management" subtitle="Consumption, recycling, water stress and leakage detection" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Consumption" value="106.5M L" sub="−8.3% YoY" accent={C.blue} />
        <StatTile label="Water Recycled" value="28%" sub="+10 pts YoY" accent={C.teal} />
        <StatTile label="Water / Guest Night" value="1.1 m³" sub="Down from 1.2 m³" accent={C.green} />
        <StatTile label="Wastewater Reused" value="256,600 m³" sub="≈103 Olympic pools" accent={C.primary} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartCard title="Water Consumption by Hotel" subtitle="Withdrawal (m³) vs savings achieved (m³)">
            <VBar data={waterByHotel} xKey="name" height={320} bars={[
              { key: 'value', name: 'Consumption', color: C.blue },
              { key: 'saved', name: 'Savings', color: C.teal },
            ]} unit="" />
          </ChartCard>
        </div>
        <ChartCard title="Withdrawal by Source" subtitle="Share of total">
          <Donut data={waterSourceSplit} unit="%" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Water Recycling Performance" subtitle="Recycled share trend (%)">
          <AreaTrend data={waterRecyclingTrend} series={[{ key: 'recycled', name: 'Recycled %', color: C.teal }]} unit="%" />
        </ChartCard>

        <div className="space-y-6">
          <Card className="p-5">
            <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Water Stress Index by Hotel</p>
            <div className="space-y-3">
              {waterStress.map(w => (
                <div key={w.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: C.text }}>{w.name}</span>
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
              <p className="text-sm font-bold" style={{ color: C.text }}>Leakage Detection Alerts</p>
            </div>
            <div className="space-y-2">
              {leakAlerts.map((l, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: C.bg }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: C.text }}>{l.hotel}</p>
                    <p className="text-[11px]" style={{ color: C.subtext }}>{l.zone} · {l.detected}</p>
                  </div>
                  <div className="text-right">
                    <SeverityPill level={l.severity} />
                    <p className="text-[11px] mt-1" style={{ color: C.muted }}>{l.loss}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Waste Management ─────────────────────────────────────────────────────────
export function WasteManagement() {
  return (
    <div>
      <PageHeader title="Waste Management" subtitle="Generation, recycling, composting and biodigester performance" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Waste" value="1,109 t" sub="−12.9% YoY" accent={C.primary} />
        <StatTile label="Diversion Rate" value="77%" sub="890 t diverted" accent={C.teal} />
        <StatTile label="To Landfill" value="219 t" sub="Target: 0 by 2030" accent={C.red} />
        <StatTile label="Plastic Eliminated" value="6,800 kg" sub="684k glass bottles" accent={C.accent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChartCard title="Diversion vs Landfill" subtitle="Tonnes">
          <Donut data={wasteDiversion} unit=" t" />
        </ChartCard>
        <div className="lg:col-span-2">
          <ChartCard title="Treatment Methods" subtitle="By volume (tonnes)">
            <HBar data={wasteMethods} perBarColor unit=" t" height={260} />
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Generated vs Recycled" subtitle="Monthly (tonnes)">
          <VBar data={wasteMonthly} bars={[
            { key: 'generated', name: 'Generated', color: C.muted },
            { key: 'recycled', name: 'Recycled', color: C.primary },
          ]} unit=" t" />
        </ChartCard>
        <Card className="p-5">
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Biodigester Performance</p>
          <div className="space-y-4">
            {biodigesters.map(b => (
              <div key={b.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: C.text }}>{b.name}</span>
                  <span className="text-xs" style={{ color: C.subtext }}>{b.utilisation}% util · {b.biogas} m³/day biogas</span>
                </div>
                <ProgressBar value={b.utilisation} color={b.utilisation > 85 ? C.green : b.utilisation > 75 ? C.primary : C.accent} />
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg p-4" style={{ backgroundColor: C.softGreen }}>
            <p className="text-2xl font-bold" style={{ color: C.primary }}>684,000</p>
            <p className="text-sm font-semibold" style={{ color: C.text }}>reusable glass bottles filled</p>
            <p className="text-xs mt-1" style={{ color: C.subtext }}>preventing 6,800 kg of single-use plastic from landfill</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Biodiversity ─────────────────────────────────────────────────────────────
export function Biodiversity() {
  return (
    <div>
      <PageHeader title="Biodiversity" subtitle="Species monitoring, habitat protection and conservation projects" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Species Recorded" value="344" sub="Rapid biodiversity survey" accent={C.teal} />
        <StatTile label="Endemicity Rate" value="11.4%" sub="Endemic species" accent={C.primaryDark} />
        <StatTile label="Protected Habitat" value="88 ha" sub="Across properties" accent={C.primary} />
        <StatTile label="Active Projects" value="5" sub="4 on track, 1 at risk" accent={C.accent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartCard title="Species Growth — Vil Uyana" subtitle="2005 vs 2025 (count by group)">
            <VBar data={speciesGrowth} xKey="name" height={300} bars={[
              { key: 'y2005', name: '2005', color: C.muted },
              { key: 'y2025', name: '2025', color: C.primary },
            ]} />
          </ChartCard>
        </div>
        <ChartCard title="Protected Habitat Coverage" subtitle="Share by type">
          <Donut data={habitatCoverage} unit="%" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Species Recorded by Group" subtitle="Current survey count">
          <HBar data={speciesRecorded} color={C.teal} height={260} />
        </ChartCard>
        <Card className="p-5">
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Conservation Project Status</p>
          <div className="space-y-4">
            {conservationProjects.map(p => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: C.text }}>{p.name}</span>
                  <SeverityPill level={p.status} />
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={p.progress} color={p.status === 'At Risk' ? C.amber : C.primary} />
                  <span className="text-[11px] w-16 text-right" style={{ color: C.muted }}>{p.lead}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
