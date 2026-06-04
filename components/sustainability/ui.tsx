"use client"

import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { C, type Trend } from './data';

// ── Layout primitives ────────────────────────────────────────────────────────
export function Card({ children, className = '', accent }: { children: React.ReactNode; className?: string; accent?: string }) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm ${className}`}
      style={{ borderColor: C.border, ...(accent ? { borderTop: `3px solid ${accent}` } : {}) }}
    >
      {children}
    </div>
  );
}

export function ChartCard({ title, subtitle, children, right }: { title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-bold" style={{ color: C.text }}>{title}</p>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: C.subtext }}>{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.subtext }}>{children}</p>;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold tracking-tight" style={{ color: C.text }}>{title}</h2>
      <p className="text-sm mt-0.5" style={{ color: C.subtext }}>{subtitle}</p>
    </div>
  );
}

// ── Sparkline (inline SVG, lightweight) ──────────────────────────────────────
export function Sparkline({ data, color, width = 96, height = 30 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / span) * (height - 4) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = React.useId();
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2} fill={color} />
    </svg>
  );
}

// ── Trend badge ──────────────────────────────────────────────────────────────
export function TrendBadge({ delta, dir, good }: { delta: string; dir: Trend; good: boolean }) {
  const color = dir === 'flat' ? C.muted : good ? C.green : C.red;
  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold"
      style={{ color, backgroundColor: dir === 'flat' ? C.bg : good ? C.softGreen : '#FEF2F2' }}
    >
      <Icon className="w-3 h-3" />
      {delta}
    </span>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = C.primary, showLabel = false }: { value: number; color?: string; showLabel?: boolean }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2 rounded-full" style={{ backgroundColor: C.border }}>
      <div className="h-2 rounded-full flex items-center justify-end pr-1" style={{ width: `${pct}%`, backgroundColor: color }}>
        {showLabel && pct > 18 && <span style={{ color: '#fff', fontSize: '8px', fontWeight: 700 }}>{pct}%</span>}
      </div>
    </div>
  );
}

// ── KPI card (full featured) ─────────────────────────────────────────────────
export function KpiCard({
  label, value, unit, delta, dir, good, prev, progress, target, spark, color = C.primary,
}: {
  label: string; value: string; unit?: string; delta: string; dir: Trend; good: boolean;
  prev: string; progress: number; target: string; spark: number[]; color?: string;
}) {
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider leading-tight" style={{ color: C.subtext }}>{label}</p>
        <TrendBadge delta={delta} dir={dir} good={good} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold leading-none" style={{ color: C.text }}>
            {value}
            {unit && <span className="text-sm font-semibold ml-1" style={{ color: C.subtext }}>{unit}</span>}
          </p>
          <p className="text-[11px] mt-1.5" style={{ color: C.muted }}>vs {prev}</p>
        </div>
        <Sparkline data={spark} color={good ? color : C.red} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium" style={{ color: C.muted }}>Target: {target}</span>
          <span className="text-[10px] font-bold" style={{ color }}>{progress}%</span>
        </div>
        <ProgressBar value={progress} color={color} />
      </div>
    </Card>
  );
}

// ── Tooltip styling ──────────────────────────────────────────────────────────
const tooltipStyle = {
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

// ── Donut ────────────────────────────────────────────────────────────────────
export function Donut({ data, height = 260, unit = '' }: {
  data: { name: string; value: number; color: string }[]; height?: number; unit?: string;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius="58%" outerRadius="80%" dataKey="value" paddingAngle={2}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toLocaleString()}${unit}`, '']} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Horizontal bar ───────────────────────────────────────────────────────────
export function HBar({ data, color = C.primary, unit = '', height, perBarColor = false, dataKey = 'value' }: {
  data: { name: string; color?: string; [k: string]: string | number | undefined }[];
  color?: string; unit?: string; height?: number; perBarColor?: boolean; dataKey?: string;
}) {
  const h = height ?? Math.max(220, data.length * 38);
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ left: 0, right: 28, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
          <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `${Number(v).toLocaleString()}${unit}`} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toLocaleString()}${unit}`, '']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]}>
            {perBarColor && data.map((d, i) => <Cell key={i} fill={d.color ?? color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Vertical / grouped bar ───────────────────────────────────────────────────
export function VBar({ data, bars, height = 300, xKey = 'month', unit = '', stacked = false }: {
  data: Record<string, string | number>[];
  bars: { key: string; name: string; color: string }[];
  height?: number; xKey?: string; unit?: string; stacked?: boolean;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v).toLocaleString()}${unit}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v).toLocaleString()}${unit}`} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {bars.map(b => (
            <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[4, 4, 0, 0]}
              stackId={stacked ? 'a' : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Area / line trend ────────────────────────────────────────────────────────
export function AreaTrend({ data, series, height = 300, xKey = 'month', unit = '' }: {
  data: Record<string, string | number>[];
  series: { key: string; name: string; color: string }[];
  height?: number; xKey?: string; unit?: string;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <defs>
            {series.map(s => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v).toLocaleString()}${unit}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v).toLocaleString()}${unit}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map(s => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={`url(#grad-${s.key})`} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Forecast line (actual + dashed forecast + band) ──────────────────────────
export function ForecastChart({ data, height = 320 }: {
  data: { month: string; actual: number | null; forecast: number | null; lo: number | null; hi: number | null }[];
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.blue} stopOpacity={0.16} />
              <stop offset="100%" stopColor={C.blue} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} t`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v != null ? `${Number(v).toLocaleString()} tCO₂` : '—', n]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area dataKey="hi" stroke="none" fill="url(#band)" name="Confidence band" legendType="none" />
          <Area dataKey="lo" stroke="none" fill="#fff" name="lo" legendType="none" />
          <Line dataKey="actual" stroke={C.primary} strokeWidth={2.4} dot={false} name="Actual" connectNulls={false} type="monotone" />
          <Line dataKey="forecast" stroke={C.blue} strokeWidth={2.4} strokeDasharray="5 4" dot={false} name="AI Forecast" connectNulls={false} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Stat tile (compact) ──────────────────────────────────────────────────────
export function StatTile({ label, value, sub, accent = C.primary }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <Card className="p-4" accent={accent}>
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.subtext }}>{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color: C.text }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: C.muted }}>{sub}</p>}
    </Card>
  );
}

// ── Severity pill ────────────────────────────────────────────────────────────
export function SeverityPill({ level }: { level: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    High: { bg: '#FEF2F2', fg: C.red },
    Medium: { bg: '#FFFBEB', fg: C.amber },
    Low: { bg: C.softGreen, fg: C.primary },
    'On Track': { bg: C.softGreen, fg: C.primary },
    'At Risk': { bg: '#FFFBEB', fg: C.amber },
    Behind: { bg: '#FEF2F2', fg: C.red },
    Published: { bg: C.softGreen, fg: C.primary },
    Draft: { bg: C.bg, fg: C.subtext },
    Scheduled: { bg: '#EFF6FF', fg: C.blue },
  };
  const s = map[level] ?? { bg: C.bg, fg: C.subtext };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: s.bg, color: s.fg }}>
      {level}
    </span>
  );
}
