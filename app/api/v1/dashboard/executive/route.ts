import { requireStaff } from '@/lib/api/auth';
import { route, ok } from '@/lib/api/http';
import type { ExecutiveDashboard } from '@/lib/dashboard/types';

/**
 * GET /api/v1/dashboard/executive
 * Group-wide performance, aggregated from historical_revenue + properties.
 * Staff (ADMIN | REVENUE_MANAGER).
 *
 * Query (all optional):
 *   property_id  — restrict to a single property (else group-wide)
 *   from, to     — inclusive month range as "YYYY-MM" (data is monthly)
 */

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface HRRow {
  property_id: string;
  year: number;
  month: number;
  total_revenue_lkr: number;
  occupancy_pct: number;
  revpar_lkr: number;
  repeat_guest_pct: number;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const round = (n: number, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};
const pctChange = (cur: number, prev: number): number | null =>
  prev ? round(((cur - prev) / prev) * 100, 1) : null;

const ymToKey = (ym: string): number | null => {
  const m = /^(\d{4})-(\d{1,2})$/.exec(ym.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return y * 12 + mo;
};
const keyToYm = (k: number): string => {
  const y = Math.floor((k - 1) / 12);
  const m = k - y * 12;
  return `${y}-${String(m).padStart(2, '0')}`;
};

export const GET = route(async (req) => {
  const { supabase } = await requireStaff();
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('property_id');
  const fromK = searchParams.get('from') ? ymToKey(searchParams.get('from')!) : null;
  const toK = searchParams.get('to') ? ymToKey(searchParams.get('to')!) : null;

  const { data, error } = await supabase
    .from('historical_revenue')
    .select('property_id, year, month, total_revenue_lkr, occupancy_pct, revpar_lkr, repeat_guest_pct');
  if (error) throw new Error(error.message);
  const allRows = (data ?? []) as HRRow[];

  const { data: props } = await supabase.from('properties').select('property_id, property_name');
  const nameById = new Map((props ?? []).map((p) => [p.property_id, p.property_name]));

  const periodKey = (r: { year: number; month: number }) => r.year * 12 + r.month;

  // Full extent of the data (before any range filter) — drives the date pickers.
  const allKeys = allRows.map(periodKey);
  const availableRange = allKeys.length
    ? { min: keyToYm(Math.min(...allKeys)), max: keyToYm(Math.max(...allKeys)) }
    : null;

  // Apply property + month-range filters in code (small dataset).
  const rows = allRows.filter((r) => {
    if (propertyId && r.property_id !== propertyId) return false;
    const k = periodKey(r);
    if (fromK != null && k < fromK) return false;
    if (toK != null && k > toK) return false;
    return true;
  });

  // ── Group by period (across all properties) ────────────────────────────────
  const byPeriod = new Map<number, HRRow[]>();
  for (const r of rows) {
    const k = periodKey(r);
    (byPeriod.get(k) ?? byPeriod.set(k, []).get(k)!).push(r);
  }
  const allPeriods = [...byPeriod.keys()].sort((a, b) => a - b);
  // Ignore partially-reported tail months: only compare months where every
  // property reported, so KPIs aren't skewed by an incomplete current month.
  const maxCount = Math.max(0, ...allPeriods.map((k) => byPeriod.get(k)!.length));
  const fullPeriods = allPeriods.filter((k) => byPeriod.get(k)!.length === maxCount);
  const periods = fullPeriods.length ? fullPeriods : allPeriods;

  if (periods.length === 0) {
    const empty: ExecutiveDashboard = {
      period: '—',
      kpis: {
        totalRevenueLkr: 0, revenueChangePct: null, avgRevparLkr: 0, revparChangePct: null,
        occupancyPct: 0, occupancyChangePct: null, repeatGuestPct: 0, repeatChangePct: null,
      },
      trends: [], properties: [],
      availableRange,
    };
    return ok({ data: empty });
  }

  const latestK = periods[periods.length - 1];
  const prevK = periods.length > 1 ? periods[periods.length - 2] : null;
  const latest = byPeriod.get(latestK)!;
  const prev = prevK != null ? byPeriod.get(prevK)! : [];

  const latestYear = Math.floor((latestK - 1) / 12);
  const latestMonth = latestK - latestYear * 12;

  const kpis: ExecutiveDashboard['kpis'] = {
    totalRevenueLkr: round(sum(latest.map((r) => r.total_revenue_lkr))),
    revenueChangePct: pctChange(sum(latest.map((r) => r.total_revenue_lkr)), sum(prev.map((r) => r.total_revenue_lkr))),
    avgRevparLkr: round(avg(latest.map((r) => r.revpar_lkr))),
    revparChangePct: pctChange(avg(latest.map((r) => r.revpar_lkr)), avg(prev.map((r) => r.revpar_lkr))),
    occupancyPct: round(avg(latest.map((r) => r.occupancy_pct)), 1),
    occupancyChangePct: pctChange(avg(latest.map((r) => r.occupancy_pct)), avg(prev.map((r) => r.occupancy_pct))),
    repeatGuestPct: round(avg(latest.map((r) => r.repeat_guest_pct)), 1),
    repeatChangePct: pctChange(avg(latest.map((r) => r.repeat_guest_pct)), avg(prev.map((r) => r.repeat_guest_pct))),
  };

  // ── Trend chart: every period in the (filtered) range, capped for readability ─
  const trends = periods.slice(-36).map((k) => {
    const grp = byPeriod.get(k)!;
    const y = Math.floor((k - 1) / 12);
    const m = k - y * 12;
    return {
      month: `${MONTHS_SHORT[m]} ${String(y).slice(2)}`,
      revpar: round(avg(grp.map((r) => r.revpar_lkr))),
      occupancy: round(avg(grp.map((r) => r.occupancy_pct)), 1),
    };
  });

  // ── Per-property leaderboard (latest vs previous period) ───────────────────
  const byProp = new Map<string, HRRow[]>();
  for (const r of rows) {
    (byProp.get(r.property_id) ?? byProp.set(r.property_id, []).get(r.property_id)!).push(r);
  }
  const properties = [...byProp.entries()]
    .map(([id, rs]) => {
      const sorted = [...rs].sort((a, b) => periodKey(a) - periodKey(b));
      const last = sorted[sorted.length - 1];
      const before = sorted.length > 1 ? sorted[sorted.length - 2] : null;
      const trend: 'up' | 'down' | 'neutral' =
        !before || last.revpar_lkr === before.revpar_lkr ? 'neutral' : last.revpar_lkr > before.revpar_lkr ? 'up' : 'down';
      return {
        name: nameById.get(id) ?? 'Property',
        revpar: round(last.revpar_lkr),
        occupancy: round(last.occupancy_pct, 1),
        trend,
      };
    })
    .sort((a, b) => b.revpar - a.revpar);

  const dashboard: ExecutiveDashboard = {
    period: `${MONTHS[latestMonth]} ${latestYear}`,
    kpis,
    trends,
    properties,
    availableRange,
  };
  return ok({ data: dashboard });
});
