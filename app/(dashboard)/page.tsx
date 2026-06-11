"use client"

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Repeat,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Hotel,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DashboardChart } from '@/components/charts/DashboardChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { guestApi, ApiClientError, type PropertyOption } from '@/lib/api/client';
import type { ExecutiveDashboard } from '@/lib/dashboard/types';

const fmtLkr = (n: number) =>
  n >= 1_000_000 ? `LKR ${(n / 1_000_000).toFixed(1)}M` : `LKR ${Math.round(n).toLocaleString()}`;

const trendOf = (pct: number | null): 'up' | 'down' | 'neutral' =>
  pct == null || pct === 0 ? 'neutral' : pct > 0 ? 'up' : 'down';

export default function Dashboard() {
  const [data, setData] = useState<ExecutiveDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertyId, setPropertyId] = useState<string>('all');
  const [from, setFrom] = useState<string>(''); // "YYYY-MM-DD" (mapped to its month for the API)
  const [to, setTo] = useState<string>('');

  // Property list for the dropdown (once).
  useEffect(() => {
    guestApi.listProperties().then((r) => setProperties(r.data)).catch(() => {});
  }, []);

  // Fetch dashboard whenever a filter changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    guestApi
      .executiveDashboard({
        property_id: propertyId === 'all' ? undefined : propertyId,
        from: from ? from.slice(0, 7) : undefined, // date → its month (data is monthly)
        to: to ? to.slice(0, 7) : undefined,
      })
      .then((res) => { if (!cancelled) { setData(res.data); setError(null); } })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiClientError && (e.status === 401 || e.status === 403)) {
          setError('Sign in as an Admin or Revenue Manager to view the executive dashboard.');
        } else {
          setError(e instanceof Error ? e.message : 'Failed to load dashboard.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [propertyId, from, to]);

  const range = data?.availableRange ?? null;
  // Convert the month range (YYYY-MM) into full-date bounds for the date pickers.
  const minDate = range ? `${range.min}-01` : undefined;
  const maxDate = range
    ? (() => {
        const [y, m] = range.max.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate(); // day 0 of next month = last day
        return `${range.max}-${String(lastDay).padStart(2, '0')}`;
      })()
    : undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#1a1a1a' }}>Executive Dashboard</h1>
        <p style={{ color: '#999' }}>
          {loading
            ? 'Loading group-wide performance…'
            : data
              ? `Group-wide performance overview · ${data.period}`
              : 'Group-wide performance overview.'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 p-4 rounded-xl border bg-white" style={{ borderColor: '#E5E5E5' }}>
        <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: '#666' }}>
          <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Property</span>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#8B9E23]/30 min-w-50"
            style={{ borderColor: '#E5E5E5', color: '#1a1a1a' }}
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p.property_id} value={p.property_id}>{p.property_name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: '#666' }}>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> From</span>
          <input
            type="date"
            value={from}
            min={minDate}
            max={to || maxDate}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#8B9E23]/30"
            style={{ borderColor: '#E5E5E5', color: '#1a1a1a' }}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: '#666' }}>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> To</span>
          <input
            type="date"
            value={to}
            min={from || minDate}
            max={maxDate}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#8B9E23]/30"
            style={{ borderColor: '#E5E5E5', color: '#1a1a1a' }}
          />
        </label>
        {(propertyId !== 'all' || from || to) && (
          <button
            onClick={() => { setPropertyId('all'); setFrom(''); setTo(''); }}
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50 self-end"
            style={{ borderColor: '#E5E5E5', color: '#666' }}
          >
            Reset
          </button>
        )}
        {range && (
          <span className="text-[11px] self-end ml-auto" style={{ color: '#999' }}>
            Data available {minDate} → {maxDate} (monthly)
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Group Revenue"
          value={data ? fmtLkr(data.kpis.totalRevenueLkr) : '—'}
          change={data?.kpis.revenueChangePct ?? 0}
          icon={DollarSign}
          trend={trendOf(data?.kpis.revenueChangePct ?? null)}
          description="vs last month"
        />
        <StatCard
          title="Average RevPAR"
          value={data ? `LKR ${Math.round(data.kpis.avgRevparLkr).toLocaleString()}` : '—'}
          change={data?.kpis.revparChangePct ?? 0}
          icon={TrendingUp}
          trend={trendOf(data?.kpis.revparChangePct ?? null)}
          description="vs last month"
        />
        <StatCard
          title="Group Occupancy"
          value={data ? `${data.kpis.occupancyPct}%` : '—'}
          change={data?.kpis.occupancyChangePct ?? 0}
          icon={Hotel}
          trend={trendOf(data?.kpis.occupancyChangePct ?? null)}
          description="vs last month"
        />
        <StatCard
          title="Repeat Guest Rate"
          value={data ? `${data.kpis.repeatGuestPct}%` : '—'}
          change={data?.kpis.repeatChangePct ?? 0}
          icon={Repeat}
          trend={trendOf(data?.kpis.repeatChangePct ?? null)}
          description="vs last month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        {/* Main Performance Chart */}
        <div className="lg:col-span-2 w-full min-w-0">
          <DashboardChart
            title="Revenue & Occupancy Trends"
            data={data?.trends ?? []}
            dataKey="month"
            type="area"
            categories={[
              { key: 'revpar', color: '#8B9E23', name: 'RevPAR (LKR)' },
              { key: 'occupancy', color: '#E91E8C', name: 'Occupancy (%)' },
            ]}
          />
        </div>

        {/* Property Leaderboard */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Property Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm" style={{ color: '#999' }}>Loading…</p>
            ) : data && data.properties.length > 0 ? (
              <div className="space-y-6">
                {data.properties.map((property) => (
                  <div key={property.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>{property.name}</p>
                      <p className="text-xs" style={{ color: '#999' }}>{property.occupancy}% Occupancy</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: '#1a1a1a' }}>LKR {property.revpar.toLocaleString()}</p>
                      <div className="flex items-center justify-end text-[10px] font-medium" style={{
                        color: property.trend === 'up' ? '#8B9E23' : property.trend === 'down' ? '#E91E8C' : '#999',
                      }}>
                        {property.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> :
                         property.trend === 'down' ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : null}
                        {property.trend === 'up' ? 'Growing' : property.trend === 'down' ? 'Declining' : 'Stable'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#999' }}>No property data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
