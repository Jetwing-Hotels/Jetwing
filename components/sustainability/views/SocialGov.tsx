"use client"

import React, { useState } from 'react';
import {
  FileText, Download, FileSpreadsheet, CalendarClock, MapPin, Bell, User, SlidersHorizontal,
} from 'lucide-react';
import {
  C, communityByHotel, employmentSplit, communityInvestment, communityPrograms,
  supplierRegions, sourcingTrend, supplierRatings,
  risks, goals, reports, complianceFrameworks, esgPillars, type Risk, type Goal,
} from '../data';
import {
  Card, ChartCard, StatTile, Donut, HBar, AreaTrend, ProgressBar, SeverityPill, PageHeader,
} from '../ui';

// ── Community Impact ─────────────────────────────────────────────────────────
export function CommunityImpact() {
  return (
    <div>
      <PageHeader title="Community Impact" subtitle="Engagement programmes, youth training, local employment and social investment" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Programmes Conducted" value="385" sub="+12.9% YoY" accent={C.primary} />
        <StatTile label="Youth Trained" value="203" sub="JYDP cumulative 1,500+" accent={C.blue} />
        <StatTile label="Local Employment" value="62%" sub="Within district" accent={C.teal} />
        <StatTile label="Community Investment" value="LKR 34.4M" sub="+18% YoY" accent={C.accent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartCard title="Community Programmes by Hotel" subtitle="Programmes conducted FY 2024/25">
            <HBar data={communityByHotel} color={C.primary} height={300} />
          </ChartCard>
        </div>
        <ChartCard title="Local Employment" subtitle="Workforce origin">
          <Donut data={employmentSplit} unit="%" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Community Investment Trend" subtitle="LKR millions per month">
          <AreaTrend data={communityInvestment} series={[{ key: 'amount', name: 'Investment (LKR M)', color: C.accent }]} />
        </ChartCard>
        <Card className="p-5">
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Flagship Programmes · Social Impact Score 86/100</p>
          <div className="space-y-3">
            {communityPrograms.map(p => (
              <div key={p.title} className="p-3 rounded-lg border" style={{ borderColor: C.border, borderLeft: `3px solid ${C.primary}` }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold" style={{ color: C.primary }}>{p.title}</p>
                  <span className="text-xs font-bold" style={{ color: C.text }}>{p.participants} <span className="font-normal" style={{ color: C.muted }}>participants</span></span>
                </div>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: C.subtext }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Local Sourcing ───────────────────────────────────────────────────────────
function SupplierMap() {
  // Simplified Sri Lanka silhouette bounds
  const lat = { min: 5.8, max: 9.9 };
  const lng = { min: 79.6, max: 81.9 };
  const W = 240, H = 380;
  const px = (lng_: number) => ((lng_ - lng.min) / (lng.max - lng.min)) * W;
  const py = (lat_: number) => H - ((lat_ - lat.min) / (lat.max - lat.min)) * H;
  const max = Math.max(...supplierRegions.map(r => r.suppliers));
  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
        <path
          d="M120 18 C150 30 168 70 165 110 C163 150 178 175 172 215 C166 255 150 290 120 350 C95 360 78 330 70 295 C60 255 52 215 56 175 C60 135 70 90 88 55 C98 35 105 22 120 18 Z"
          fill={C.softGreen} stroke={C.primaryLight} strokeWidth={1.5}
        />
        {supplierRegions.map(r => {
          const radius = 6 + (r.suppliers / max) * 16;
          return (
            <g key={r.region}>
              <circle cx={px(r.lng)} cy={py(r.lat)} r={radius} fill={C.primary} fillOpacity={0.25} />
              <circle cx={px(r.lng)} cy={py(r.lat)} r={4} fill={C.primary} />
            </g>
          );
        })}
      </svg>
      <p className="text-[11px] mt-2" style={{ color: C.muted }}>Bubble size ∝ supplier count by province</p>
    </div>
  );
}

export function LocalSourcing() {
  return (
    <div>
      <PageHeader title="Local Sourcing" subtitle="Supplier distribution, procurement trends and sustainability ratings" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Local Sourcing" value="78%" sub="+6 pts YoY" accent={C.primary} />
        <StatTile label="Sri Lankan Suppliers" value="100%" sub="Registered businesses" accent={C.green} />
        <StatTile label="Active Suppliers" value="353" sub="Across 6 provinces" accent={C.blue} />
        <StatTile label="Avg Supplier Rating" value="4.5 / 5" sub="Sustainability assessed" accent={C.accent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" style={{ color: C.primary }} />
            <p className="text-sm font-bold" style={{ color: C.text }}>Supplier Distribution</p>
          </div>
          <SupplierMap />
        </Card>
        <div className="lg:col-span-2 space-y-6">
          <ChartCard title="Suppliers by Province" subtitle="Active supplier count">
            <HBar data={supplierRegions.map(r => ({ name: r.region, value: r.suppliers }))} color={C.primary} height={220} />
          </ChartCard>
          <ChartCard title="Procurement Trend" subtitle="Local vs imported share (%)">
            <AreaTrend data={sourcingTrend} height={220} series={[
              { key: 'local', name: 'Local', color: C.primary },
              { key: 'imported', name: 'Imported', color: C.muted },
            ]} unit="%" />
          </ChartCard>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: C.border }}>
          <p className="text-sm font-bold" style={{ color: C.text }}>Top Suppliers — Sustainability Rating</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: C.bg }}>
                {['Supplier', 'Category', 'Annual Spend', 'Sustainability Rating'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.subtext }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supplierRatings.map(s => (
                <tr key={s.name} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="py-3 px-4 font-semibold" style={{ color: C.text }}>{s.name}</td>
                  <td className="py-3 px-4" style={{ color: C.subtext }}>{s.category}</td>
                  <td className="py-3 px-4" style={{ color: C.subtext }}>{s.spend}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full" style={{ backgroundColor: C.border }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(s.rating / 5) * 100}%`, backgroundColor: C.primary }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: C.text }}>{s.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── ESG Reports ──────────────────────────────────────────────────────────────
export function EsgReports() {
  return (
    <div>
      <PageHeader title="ESG Reports" subtitle="Generate, export and schedule sustainability disclosures" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {esgPillars.map(p => (
          <Card key={p.name} className="p-5" accent={p.color}>
            <div className="flex items-end justify-between">
              <p className="text-sm font-bold" style={{ color: C.text }}>{p.name}</p>
              <p className="text-2xl font-bold" style={{ color: p.color }}>{p.score}<span className="text-sm" style={{ color: C.muted }}>/100</span></p>
            </div>
            <div className="mt-3"><ProgressBar value={p.score} color={p.color} /></div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
              <p className="text-sm font-bold" style={{ color: C.text }}>Report Library</p>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: C.primary }}>+ Generate Report</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: C.bg }}>
                    {['Report', 'Type', 'Period', 'Status', 'Export'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.subtext }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.name} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="py-3 px-4 font-semibold" style={{ color: C.text }}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" style={{ color: C.primary }} />
                          {r.name}
                        </div>
                      </td>
                      <td className="py-3 px-4" style={{ color: C.subtext }}>{r.type}</td>
                      <td className="py-3 px-4" style={{ color: C.subtext }}>{r.period}</td>
                      <td className="py-3 px-4"><SeverityPill level={r.status} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button className="p-1.5 rounded-md border" style={{ borderColor: C.border }} title="Export PDF">
                            <Download className="w-3.5 h-3.5" style={{ color: C.red }} />
                          </button>
                          <button className="p-1.5 rounded-md border" style={{ borderColor: C.border }} title="Export Excel">
                            <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: C.green }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Compliance Frameworks</p>
            <div className="space-y-3">
              {complianceFrameworks.map(f => (
                <div key={f.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: C.text }}>{f.name}</span>
                    <span className="text-[11px] font-medium" style={{ color: C.subtext }}>{f.status}</span>
                  </div>
                  <ProgressBar value={f.coverage} color={C.blue} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5" accent={C.accent}>
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock className="w-4 h-4" style={{ color: C.accentDark }} />
              <p className="text-sm font-bold" style={{ color: C.text }}>Scheduled Reporting</p>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: C.subtext }}>
              Q1 FY25/26 ESG Update is scheduled for automated generation on 15 Jul 2026.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-md font-medium" style={{ backgroundColor: C.bg, color: C.subtext }}>Quarterly</span>
              <span className="px-2 py-1 rounded-md font-medium" style={{ backgroundColor: C.bg, color: C.subtext }}>PDF + Excel</span>
              <span className="px-2 py-1 rounded-md font-medium" style={{ backgroundColor: C.bg, color: C.subtext }}>Board distribution</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Risk Management ──────────────────────────────────────────────────────────
const riskColor = (score: number) =>
  score >= 16 ? C.red : score >= 10 ? C.accentDark : score >= 5 ? C.accent : C.primary;

function RiskHeatmap() {
  // 5x5 grid: x = probability, y = severity
  const cell = 52;
  const labels = [1, 2, 3, 4, 5];
  const cellRisks = (p: number, s: number) => risks.filter(r => r.probability === p && r.severity === s);
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex">
        {/* Y axis label */}
        <div className="flex flex-col items-center justify-center pr-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.subtext, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Severity →</span>
        </div>
        <div>
          <div className="flex">
            {/* grid */}
            <div className="flex flex-col">
              {[5, 4, 3, 2, 1].map(s => (
                <div key={s} className="flex items-center">
                  <span className="text-[10px] w-4 text-right mr-1" style={{ color: C.muted }}>{s}</span>
                  {labels.map(p => {
                    const score = p * s;
                    const here = cellRisks(p, s);
                    return (
                      <div key={p} className="flex items-center justify-center m-0.5 rounded-md relative"
                        style={{ width: cell, height: cell, backgroundColor: `${riskColor(score)}${here.length ? 'FF' : '22'}` }}>
                        {here.map(r => (
                          <span key={r.id} className="text-[10px] font-bold text-white px-1">{r.id}</span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="flex">
                <span className="w-4 mr-1" />
                {labels.map(p => <span key={p} className="text-[10px] text-center" style={{ width: cell, color: C.muted }}>{p}</span>)}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-center mt-1" style={{ color: C.subtext, marginLeft: 20 }}>Probability →</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RiskManagement() {
  const ranked = [...risks].sort((a, b) => b.probability * b.severity - a.probability * a.severity);
  return (
    <div>
      <PageHeader title="Risk Management" subtitle="Climate, water, biodiversity, energy and regulatory risk monitoring" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Tracked Risks" value="8" sub="Across 5 categories" accent={C.primary} />
        <StatTile label="High Severity" value="2" sub="Active mitigation" accent={C.red} />
        <StatTile label="Avg Mitigation" value="69%" sub="Progress across register" accent={C.green} />
        <StatTile label="Trending Up" value="5" sub="Probability rising" accent={C.accentDark} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartCard title="Risk Heat Map" subtitle="Probability × Severity">
            <RiskHeatmap />
            <div className="flex items-center gap-3 mt-3 text-[11px]">
              {[
                { l: 'Low', c: C.primary }, { l: 'Moderate', c: C.accent },
                { l: 'High', c: C.accentDark }, { l: 'Critical', c: C.red },
              ].map(x => (
                <span key={x.l} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: x.c }} />
                  <span style={{ color: C.subtext }}>{x.l}</span>
                </span>
              ))}
            </div>
          </ChartCard>
        </div>
        <div className="lg:col-span-3">
          <Card className="overflow-hidden h-full">
            <div className="p-5 border-b" style={{ borderColor: C.border }}>
              <p className="text-sm font-bold" style={{ color: C.text }}>Risk Register</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: C.bg }}>
                    {['ID', 'Risk', 'Category', 'Score', 'Mitigation'].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.subtext }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((r: Risk) => {
                    const score = r.probability * r.severity;
                    return (
                      <tr key={r.id} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="py-2.5 px-3 font-bold" style={{ color: C.subtext }}>{r.id}</td>
                        <td className="py-2.5 px-3" style={{ color: C.text }}>{r.title}</td>
                        <td className="py-2.5 px-3" style={{ color: C.subtext }}>{r.category}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold text-white" style={{ backgroundColor: riskColor(score) }}>{score}</span>
                        </td>
                        <td className="py-2.5 px-3 w-28"><ProgressBar value={r.mitigation} color={C.primary} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Sustainability Goals ─────────────────────────────────────────────────────
export function SustainabilityGoals() {
  return (
    <div>
      <PageHeader title="Sustainability Goals" subtitle="Strategic targets and progress tracking toward 2027–2030 commitments" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Active Goals" value="6" sub="Group-wide targets" accent={C.primary} />
        <StatTile label="On Track" value="4" sub="Meeting trajectory" accent={C.green} />
        <StatTile label="At Risk" value="1" sub="Needs attention" accent={C.amber} />
        <StatTile label="Behind" value="1" sub="Acceleration required" accent={C.red} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((g: Goal) => {
          const pct = Math.round((g.current / g.target) * 100);
          return (
            <Card key={g.label} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-bold" style={{ color: C.text }}>{g.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>Target by {g.deadline}</p>
                </div>
                <SeverityPill level={g.status} />
              </div>
              <div className="flex items-end gap-2 mb-3">
                <p className="text-3xl font-bold leading-none" style={{ color: g.color }}>{g.current}{g.unit}</p>
                <p className="text-sm mb-0.5" style={{ color: C.muted }}>/ {g.target}{g.unit} target</p>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px]" style={{ color: C.subtext }}>Progress to target</span>
                <span className="text-[11px] font-bold" style={{ color: g.color }}>{pct}%</span>
              </div>
              <ProgressBar value={pct} color={g.status === 'Behind' ? C.red : g.status === 'At Risk' ? C.amber : g.color} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
function Toggle({ on }: { on: boolean }) {
  const [v, setV] = useState(on);
  return (
    <button onClick={() => setV(!v)} className="w-10 h-5 rounded-full transition-colors relative" style={{ backgroundColor: v ? C.primary : C.border }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: v ? 22 : 2 }} />
    </button>
  );
}

export function Settings() {
  const notifs = [
    { label: 'Leakage detection alerts', on: true },
    { label: 'Risk escalation notifications', on: true },
    { label: 'Goal milestone reminders', on: true },
    { label: 'Weekly ESG digest email', on: false },
    { label: 'Supplier rating changes', on: false },
  ];
  return (
    <div>
      <PageHeader title="Settings" subtitle="Dashboard preferences, data sources and notifications" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4" style={{ color: C.primary }} />
            <p className="text-sm font-bold" style={{ color: C.text }}>Account</p>
          </div>
          <div className="space-y-3 text-sm">
            {[
              ['Organisation', 'Jetwing Symphony PLC'],
              ['Reporting Standard', 'GRI Standards 2021'],
              ['Base Currency', 'LKR (Sri Lankan Rupee)'],
              ['Fiscal Year Start', 'April'],
              ['Emission Factor Set', 'DEFRA 2024 / IPCC AR6'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2 border-b" style={{ borderColor: C.border }}>
                <span style={{ color: C.subtext }}>{k}</span>
                <span className="font-semibold" style={{ color: C.text }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4" style={{ color: C.primary }} />
            <p className="text-sm font-bold" style={{ color: C.text }}>Notifications</p>
          </div>
          <div className="space-y-1">
            {notifs.map(n => (
              <div key={n.label} className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: C.border }}>
                <span className="text-sm" style={{ color: C.text }}>{n.label}</span>
                <Toggle on={n.on} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4" style={{ color: C.primary }} />
            <p className="text-sm font-bold" style={{ color: C.text }}>Display Preferences</p>
          </div>
          <div className="space-y-1">
            {[
              ['Show AI insights on overview', true],
              ['Compact KPI cards', false],
              ['Default to last 12 months', true],
              ['Highlight at-risk metrics', true],
            ].map(([label, on]) => (
              <div key={label as string} className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: C.border }}>
                <span className="text-sm" style={{ color: C.text }}>{label as string}</span>
                <Toggle on={on as boolean} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Data Sources</p>
          <div className="space-y-2">
            {[
              ['Building Management Systems', 'Connected', C.green],
              ['Smart Energy Meters', 'Connected', C.green],
              ['Water Flow Sensors', 'Connected', C.green],
              ['Procurement / ERP', 'Connected', C.green],
              ['Carbon Accounting Engine', 'Syncing', C.accent],
            ].map(([name, status, color]) => (
              <div key={name as string} className="flex items-center justify-between py-2.5 px-3 rounded-lg" style={{ backgroundColor: C.bg }}>
                <span className="text-sm font-medium" style={{ color: C.text }}>{name as string}</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: color as string }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color as string }} />
                  {status as string}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
