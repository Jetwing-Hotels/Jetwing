"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { C, type Trend } from "./data";

// ── Layout primitives ────────────────────────────────────────────────────────
export function Card({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm ${className}`}
      style={{
        borderColor: C.border,
        ...(accent ? { borderTop: `3px solid ${accent}` } : {}),
      }}
    >
      {children}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-bold" style={{ color: C.text }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: C.subtext }}>
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-bold uppercase tracking-wider mb-4"
      style={{ color: C.subtext }}
    >
      {children}
    </p>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <h2
        className="text-xl font-bold tracking-tight"
        style={{ color: C.text }}
      >
        {title}
      </h2>
      <p className="text-sm mt-0.5" style={{ color: C.subtext }}>
        {subtitle}
      </p>
    </div>
  );
}

// ── Sparkline (inline SVG, lightweight) ──────────────────────────────────────
export function Sparkline({
  data,
  color,
  width = 96,
  height = 30,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length === 0) {
    // render an empty placeholder
    return (
      <svg width={width} height={height} className="overflow-visible">
        <line
          x1={4}
          y1={height / 2}
          x2={width - 4}
          y2={height / 2}
          stroke={C.border}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : 0;
  const pts = data.map((v, i) => {
    const x = data.length > 1 ? i * step : width / 2;
    const y = height - ((v - min) / span) * (height - 4) - 2;
    return [x, y];
  });

  const line = pts
    .map(
      (p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = React.useId();

  const last = pts[pts.length - 1];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r={2} fill={color} />}
    </svg>
  );
}

// ── Trend badge ──────────────────────────────────────────────────────────────
export function TrendBadge({
  delta,
  dir,
  good,
}: {
  delta: string;
  dir: Trend;
  good: boolean;
}) {
  const color = dir === "flat" ? C.muted : good ? C.green : C.red;
  const Icon =
    dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold"
      style={{
        color,
        backgroundColor: dir === "flat" ? C.bg : good ? C.softGreen : "#FEF2F2",
      }}
    >
      <Icon className="w-3 h-3" />
      {delta}
    </span>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({
  value,
  color = C.primary,
  showLabel = false,
}: {
  value: number;
  color?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="w-full h-2 rounded-full"
      style={{ backgroundColor: C.border }}
    >
      <div
        className="h-2 rounded-full flex items-center justify-end pr-1"
        style={{ width: `${pct}%`, backgroundColor: color }}
      >
        {showLabel && pct > 18 && (
          <span style={{ color: "#fff", fontSize: "8px", fontWeight: 700 }}>
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── KPI card (full featured) ─────────────────────────────────────────────────
// export function KpiCard({
//   label,
//   value,
//   unit,
//   delta,
//   dir,
//   good,
//   prev,
//   progress,
//   target,
//   spark,
//   color = C.primary,
// }: {
//   label: string;
//   value: string;
//   unit?: string;
//   delta: string;
//   dir: Trend;
//   good: boolean;
//   prev: string;
//   progress: number;
//   target: string;
//   spark: number[];
//   color?: string;
// }) {
//   return (
//     <Card className="p-4 flex flex-col gap-3">
//       <div className="flex items-start justify-between gap-2">
//         <p
//           className="text-[11px] font-semibold uppercase tracking-wider leading-tight"
//           style={{ color: C.subtext }}
//         >
//           {label}
//         </p>
//         <TrendBadge delta={delta} dir={dir} good={good} />
//       </div>
//       <div className="flex items-end justify-between gap-2">
//         <div>
//           <p
//             className="text-2xl font-bold leading-none"
//             style={{ color: C.text }}
//           >
//             {value}
//             {unit && (
//               <span
//                 className="text-sm font-semibold ml-1"
//                 style={{ color: C.subtext }}
//               >
//                 {unit}
//               </span>
//             )}
//           </p>
//           <p className="text-[11px] mt-1.5" style={{ color: C.muted }}>
//             vs {prev}
//           </p>
//         </div>
//         <Sparkline data={spark} color={good ? color : C.red} />
//       </div>
//       <div>
//         <div className="flex items-center justify-between mb-1">
//           <span className="text-[10px] font-medium" style={{ color: C.muted }}>
//             Target: {target}
//           </span>
//           <span className="text-[10px] font-bold" style={{ color }}>
//             {progress}%
//           </span>
//         </div>
//         <ProgressBar value={progress} color={color} />
//       </div>
//     </Card>
//   );
// }
export function KpiCard({
  label,
  value,
  unit,
  delta,
  dir,
  good,
  prev,
  progress,
  target,
  spark = [],
  color = C.primary,
}: {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  dir: Trend;
  good: boolean;
  prev: string;
  progress?: number;
  target?: string;
  spark?: number[];
  color?: string;
}) {
  const hasTarget = typeof progress === "number" && Boolean(target);

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-[11px] font-semibold uppercase tracking-wider leading-tight"
          style={{ color: C.subtext }}
        >
          {label}
        </p>
        <TrendBadge delta={delta} dir={dir} good={good} />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p
            className="text-2xl font-bold leading-none"
            style={{ color: C.text }}
          >
            {value}
            {unit && (
              <span
                className="text-sm font-semibold ml-1"
                style={{ color: C.subtext }}
              >
                {unit}
              </span>
            )}
          </p>

          <p className="text-[11px] mt-1.5" style={{ color: C.muted }}>
            vs {prev}
          </p>
        </div>

        {spark.length > 0 && (
          <Sparkline data={spark} color={good ? color : C.red} />
        )}
      </div>

      {hasTarget && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[10px] font-medium"
              style={{ color: C.muted }}
            >
              Target: {target}
            </span>
            <span className="text-[10px] font-bold" style={{ color }}>
              {progress}%
            </span>
          </div>

          <ProgressBar value={progress} color={color} />
        </div>
      )}
    </Card>
  );
}

// ── Tooltip styling ──────────────────────────────────────────────────────────
const tooltipStyle = {
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

function monthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString("en", { month: "short" });
}

function CustomBarTooltip({
  active,
  payload,
  label,
  unit,
  data,
  xKey,
  bars,
}: any) {
  if (!active || !payload || payload.length === 0) return null;
  const p =
    data?.find((row: any) => String(row?.[xKey]) === String(label)) ||
    payload[0]?.payload ||
    {};
  let labelText = label;
  if (p && p.year) {
    if (typeof p.monthNum === "number") {
      labelText = `${monthName(p.monthNum)} ${p.year}`;
    } else if (typeof p.month === "string") {
      labelText = `${p.month} ${p.year}`;
    }
  }

  return (
    <div style={{ padding: 8, ...tooltipStyle, background: "#fff" }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
        {labelText}
      </div>
      {bars.map((bar: any, idx: number) => {
        const raw = p?.[bar.key];
        const fallbackItem = payload.find(
          (item: any) => item.dataKey === bar.key,
        );
        const value = Number(raw ?? fallbackItem?.value ?? 0);
        return (
          <div
            key={idx}
            style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
          >
            <div style={{ color: bar.color, fontSize: 12 }}>{bar.name}</div>
            <div
              style={{ fontSize: 12 }}
            >{`${Number(value).toLocaleString()}${unit}`}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut ────────────────────────────────────────────────────────────────────
export function Donut({
  data,
  height = 260,
  unit = "",
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
  unit?: string;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="80%"
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`${Number(v).toLocaleString()}${unit}`, ""]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Horizontal bar ───────────────────────────────────────────────────────────
export function HBar({
  data,
  color = C.primary,
  unit = "",
  height,
  perBarColor = false,
  dataKey = "value",
  barSize,
}: {
  data: {
    name: string;
    color?: string;
    [k: string]: string | number | undefined;
  }[];
  color?: string;
  unit?: string;
  height?: number;
  perBarColor?: boolean;
  dataKey?: string;
  barSize?: number;
}) {
  const h = height ?? Math.max(220, data.length * 38);
  return (
    <div style={{ height: h, width: "100%", minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ left: 0, right: 28, top: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke={C.border}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Number(v).toLocaleString()}${unit}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            // interval={0}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`${Number(v).toLocaleString()}${unit}`, ""]}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[0, 4, 4, 0]}
            barSize={barSize}
          >
            {perBarColor &&
              data.map((d, i) => <Cell key={i} fill={d.color ?? color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Vertical / grouped bar ───────────────────────────────────────────────────
export function VBar({
  data,
  bars,
  height = 300,
  xKey = "month",
  unit = "",
  stacked = false,
}: {
  data: Record<string, string | number>[];
  bars: { key: string; name: string; color: string }[];
  height?: number;
  xKey?: string;
  unit?: string;
  stacked?: boolean;
}) {
  // fixed slot width per month for consistent bar sizing; allow horizontal scroll when many months
  const slotWidth = 64; // px per month (bar + label padding)
  const minWidth = Math.max(600, data.length * slotWidth);

  return (
    <div style={{ height }}>
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div style={{ width: `${minWidth}px`, height: `${height}px` }}>
          <BarChart
            width={minWidth}
            height={height}
            data={data}
            margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={C.border}
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Number(v).toLocaleString()}${unit}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ fontWeight: 700, color: C.text }}
              formatter={(v: unknown, name: unknown) => [
                `${Number(v ?? 0).toLocaleString()}${unit}`,
                String(name ?? ""),
              ]}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {bars.map((b) => (
              <Bar
                key={b.key}
                dataKey={b.key}
                name={b.name}
                fill={b.color}
                radius={[4, 4, 0, 0]}
                stackId={stacked ? "a" : undefined}
                barSize={Math.max(12, slotWidth - 16)}
              />
            ))}
          </BarChart>
        </div>
      </div>
    </div>
  );
}

// ── Area / line trend ────────────────────────────────────────────────────────
export function AreaTrend({
  data,
  series,
  height = 300,
  xKey = "month",
  unit = "",
}: {
  data: Record<string, string | number>[];
  series: { key: string; name: string; color: string }[];
  height?: number;
  xKey?: string;
  unit?: string;
}) {
  // fixed slot width per month to keep interval consistent across ranges;
  // wrap chart in a horizontally-scrollable container similar to `VBar`.
  const slotWidth = 55; // px per month (label + padding)
  const minWidth = Math.max(600, data.length * slotWidth);

  return (
    <div style={{ height }}>
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div style={{ width: `${minWidth}px`, height: `${height}px` }}>
          <AreaChart
            width={minWidth}
            height={height}
            data={data}
            margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
          >
            <defs>
              {series.map((s) => (
                <linearGradient
                  key={s.key}
                  id={`grad-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={C.border}
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Number(v).toLocaleString()}${unit}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => `${Number(v).toLocaleString()}${unit}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
              />
            ))}
          </AreaChart>
        </div>
      </div>
    </div>
  );
}

// ── Forecast line (actual + dashed forecast + band) ──────────────────────────
export function ForecastChart({
  data,
  height = 320,
}: {
  data: {
    month: string;
    actual: number | null;
    forecast: number | null;
    lo: number | null;
    hi: number | null;
  }[];
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
        >
          <defs>
            <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.blue} stopOpacity={0.16} />
              <stop offset="100%" stopColor={C.blue} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={C.border}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v} t`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v, n) => [
              v != null ? `${Number(v).toLocaleString()} tCO₂` : "—",
              n,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            dataKey="hi"
            stroke="none"
            fill="url(#band)"
            name="Confidence band"
            legendType="none"
          />
          <Area
            dataKey="lo"
            stroke="none"
            fill="#fff"
            name="lo"
            legendType="none"
          />
          <Line
            dataKey="actual"
            stroke={C.primary}
            strokeWidth={2.4}
            dot={false}
            name="Actual"
            connectNulls={false}
            type="monotone"
          />
          <Line
            dataKey="forecast"
            stroke={C.blue}
            strokeWidth={2.4}
            strokeDasharray="5 4"
            dot={false}
            name="AI Forecast"
            connectNulls={false}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Stat tile (compact) ──────────────────────────────────────────────────────
export function StatTile({
  label,
  value,
  sub,
  accent = C.primary,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="p-4" accent={accent}>
      <p
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: C.subtext }}
      >
        {label}
      </p>
      <p className="text-xl font-bold mt-1" style={{ color: C.text }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: C.muted }}>
          {sub}
        </p>
      )}
    </Card>
  );
}

// ── Severity pill ────────────────────────────────────────────────────────────
export function SeverityPill({ level }: { level: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    High: { bg: "#FEF2F2", fg: C.red },
    Medium: { bg: "#FFFBEB", fg: C.amber },
    Low: { bg: C.softGreen, fg: C.primary },
    "On Track": { bg: C.softGreen, fg: C.primary },
    "At Risk": { bg: "#FFFBEB", fg: C.amber },
    Behind: { bg: "#FEF2F2", fg: C.red },
    Published: { bg: C.softGreen, fg: C.primary },
    Draft: { bg: C.bg, fg: C.subtext },
    Scheduled: { bg: "#EFF6FF", fg: C.blue },
  };
  const s = map[level] ?? { bg: C.bg, fg: C.subtext };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {level}
    </span>
  );
}
