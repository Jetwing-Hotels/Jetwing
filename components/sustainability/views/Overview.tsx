"use client"

import React from 'react';
import {
  Lightbulb, Leaf, Droplets, ShieldAlert, PiggyBank, Trophy, Sparkles,
} from 'lucide-react';
import {
  C, KPIS, hotelPerformance, aiInsights, esgPillars, type Insight, type HotelPerf,
} from '../data';
import { Card, KpiCard, SectionLabel, ProgressBar, PageHeader } from '../ui';

const insightMeta: Record<Insight['type'], { icon: React.ElementType; color: string; tag: string }> = {
  recommendation: { icon: Lightbulb, color: C.primary, tag: 'Recommendation' },
  carbon: { icon: Leaf, color: C.green, tag: 'Carbon Reduction' },
  resource: { icon: Droplets, color: C.blue, tag: 'Resource Optimisation' },
  risk: { icon: ShieldAlert, color: C.red, tag: 'Risk Prediction' },
  saving: { icon: PiggyBank, color: C.accent, tag: 'Cost Saving' },
};

function InsightCard({ insight }: { insight: Insight }) {
  const m = insightMeta[insight.type];
  const Icon = m.icon;
  return (
    <div className="rounded-lg border p-4 bg-white" style={{ borderColor: C.border }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}1A` }}>
          <Icon className="w-4 h-4" style={{ color: m.color }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold" style={{ color: C.text }}>{insight.title}</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: m.color, backgroundColor: `${m.color}14` }}>{m.tag}</span>
          </div>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.subtext }}>{insight.body}</p>
          <p className="text-xs mt-2 font-bold" style={{ color: m.color }}>Impact: {insight.impact}</p>
        </div>
      </div>
    </div>
  );
}

const esgColor = (r: string) =>
  r === 'AA' ? C.green : r === 'A' ? C.primary : r === 'BBB' ? C.accent : C.muted;

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: C.border }}>
        <div className="h-1.5 rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-7 text-right" style={{ color: C.text }}>{value}</span>
    </div>
  );
}

export default function Overview() {
  const ranked = [...hotelPerformance].sort((a, b) => b.score - a.score);
  const kpiColors = [C.green, C.primary, C.blue, C.accent, C.teal, C.primaryDark, C.primaryLight, C.purple, C.secondary, C.blueDark];

  return (
    <div>
      <PageHeader title="Dashboard Overview" subtitle="Group-wide sustainability performance at a glance · FY 2024/25" />

      {/* KPI grid */}
      <SectionLabel>Key Performance Indicators</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {KPIS.map((k, i) => (
          <KpiCard
            key={k.id}
            label={k.label} value={k.value} unit={k.rawUnit}
            delta={k.delta} dir={k.deltaDir} good={k.good}
            prev={k.prev} progress={k.progress} target={k.target}
            spark={k.spark} color={kpiColors[i % kpiColors.length]}
          />
        ))}
      </div>

      {/* ESG pillars + AI insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="space-y-4">
          <SectionLabel>ESG Pillar Scores</SectionLabel>
          {esgPillars.map(p => (
            <Card key={p.name} className="p-4" accent={p.color}>
              <div className="flex items-end justify-between">
                <p className="text-sm font-bold" style={{ color: C.text }}>{p.name}</p>
                <p className="text-2xl font-bold" style={{ color: p.color }}>{p.score}<span className="text-sm" style={{ color: C.muted }}>/100</span></p>
              </div>
              <div className="mt-3"><ProgressBar value={p.score} color={p.color} /></div>
            </Card>
          ))}
          <Card className="p-4" accent={C.secondary}>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4" style={{ color: C.secondary }} />
              <p className="text-sm font-bold" style={{ color: C.text }}>Recognition</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: C.subtext }}>
              2 international climate action awards · PATA Gold · Best Corporate Citizen (Leisure Sector) 2024
            </p>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4" style={{ color: C.primary }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.subtext }}>AI Sustainability Insights</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiInsights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
          </div>
        </div>
      </div>

      {/* Hotel comparison + ranking */}
      <SectionLabel>Hotel Performance Comparison & Ranking</SectionLabel>
      <Card className="overflow-hidden mb-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: C.bg }}>
                {['Rank', 'Hotel', 'Sustainability', 'Energy Eff.', 'Water Eff.', 'Carbon (tCO₂)', 'Community', 'ESG Rating'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.subtext }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((row: HotelPerf, i) => (
                <tr key={row.name} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                      style={{ backgroundColor: i === 0 ? C.accent : i < 3 ? C.softGreen : C.bg, color: i === 0 ? '#fff' : i < 3 ? C.primary : C.subtext }}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold" style={{ color: C.text }}>{row.name}</td>
                  <td className="py-3 px-4 w-40"><ScoreBar value={row.score} color={C.primary} /></td>
                  <td className="py-3 px-4 w-32"><ScoreBar value={row.energy} color={C.accent} /></td>
                  <td className="py-3 px-4 w-32"><ScoreBar value={row.water} color={C.blue} /></td>
                  <td className="py-3 px-4 font-medium" style={{ color: C.text }}>{row.carbon.toLocaleString()}</td>
                  <td className="py-3 px-4 w-32"><ScoreBar value={row.community} color={C.teal} /></td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold"
                      style={{ color: esgColor(row.esg), backgroundColor: `${esgColor(row.esg)}1A` }}>
                      {row.esg}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs" style={{ color: C.muted }}>
        Ranking is weighted across sustainability score, resource efficiency, carbon footprint and community impact.
      </p>
    </div>
  );
}
