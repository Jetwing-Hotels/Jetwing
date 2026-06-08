"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AlertTriangle, Calendar } from 'lucide-react';
import { guestApi, ApiClientError } from '@/lib/api/client';
import type { GuestAnalytics } from '@/lib/dashboard/types';

// Props are accepted for compatibility with the parent page but are no longer
// used — the analytics view manages its own date range and loads from the API.
interface AnalyticsViewProps {
  timePeriod?: string;
  customRange?: { from: string; to: string };
  updatePeriod?: (period: string, opts?: { from?: string; to?: string }) => void;
}

const COLORS = ['#8B9E23', '#82ca9d', '#ffc658', '#ff7f7f', '#8884d8', '#E91E8C', '#00C49F', '#FFBB28'];

const fmtLkr = (n: number) =>
  n >= 1_000_000 ? `LKR ${(n / 1_000_000).toFixed(1)}M` : `LKR ${Math.round(n).toLocaleString()}`;

// Props kept for compatibility with the parent; analytics now load from the API.
const AnalyticsView = (_props: AnalyticsViewProps) => {
  const [data, setData] = useState<GuestAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const firstLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;
    if (firstLoad.current) setLoading(true);
    guestApi
      .guestAnalytics({ from: from || undefined, to: to || undefined })
      .then((res) => { if (!cancelled) { setData(res.data); setError(null); } })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiClientError && (e.status === 401 || e.status === 403)) {
          setError('Sign in as an Admin or Revenue Manager to view guest analytics.');
        } else {
          setError(e instanceof Error ? e.message : 'Failed to load analytics.');
        }
      })
      .finally(() => { if (!cancelled) { setLoading(false); firstLoad.current = false; } });
    return () => { cancelled = true; };
  }, [from, to]);

  const kpis = data
    ? [
        { label: 'Total Guests', value: data.kpis.totalGuests.toLocaleString() },
        { label: 'Total Bookings', value: data.kpis.totalBookings.toLocaleString() },
        { label: 'Total Revenue', value: fmtLkr(data.kpis.totalRevenueLkr) },
        { label: 'Direct Bookings', value: data.kpis.directBookings.toLocaleString() },
        { label: 'OTA Bookings', value: data.kpis.otaBookings.toLocaleString() },
        { label: 'Future Bookings', value: data.kpis.futureBookings.toLocaleString() },
        { label: 'New Guests', value: data.kpis.newGuests.toLocaleString() },
        { label: 'Returning Guests', value: data.kpis.returningGuests.toLocaleString() },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-xl font-bold">Guest Analytics Dashboard</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5" style={{ borderColor: '#E5E5E5' }}>
                <Calendar className="w-4 h-4 shrink-0" style={{ color: '#8B9E23' }} />
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  From
                  <input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(e) => setFrom(e.target.value)}
                    className="rounded-md border px-2 py-1 text-xs outline-none"
                    style={{ borderColor: '#E5E5E5' }}
                  />
                </label>
                <span className="text-xs text-slate-400">to</span>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  To
                  <input
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={(e) => setTo(e.target.value)}
                    className="rounded-md border px-2 py-1 text-xs outline-none"
                    style={{ borderColor: '#E5E5E5' }}
                  />
                </label>
              </div>
              {(from || to) && (
                <button
                  onClick={() => { setFrom(''); setTo(''); }}
                  className="text-xs font-bold underline text-slate-500 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {(from || to) && (
            <p className="text-xs text-slate-400 mt-1">
              Showing bookings from {from || '—'} to {to || '—'}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 mb-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-slate-400 py-10 text-center">Loading guest analytics…</p>
          ) : !data ? (
            <p className="text-sm text-slate-400 py-10 text-center">No analytics available.</p>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpis.map((k) => (
                  <div key={k.label} className="p-4 rounded-lg border" style={{ borderColor: '#E5E5E5' }}>
                    <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                    <p className="text-xl font-bold mt-1 text-slate-800">{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Two-column charts: Guest Growth + Booking Source Trend */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border" style={{ borderColor: '#E5E5E5' }}>
                  <p className="text-sm font-semibold mb-2">Guest Growth (bookings / month)</p>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.growth}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="guests" name="Bookings" stroke="#8B9E23" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-4 rounded-lg border" style={{ borderColor: '#E5E5E5' }}>
                  <p className="text-sm font-semibold mb-2">Booking Source Trend</p>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.bookingSources}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Direct" stackId="a" fill="#8B9E23" />
                        <Bar dataKey="OTA" stackId="a" fill="#8884d8" />
                        <Bar dataKey="TravelAgent" name="Travel Agent" stackId="a" fill="#ffc658" />
                        <Bar dataKey="Other" stackId="a" fill="#cbd5e1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Revenue by Hotel */}
              <div className="mt-6 p-4 rounded-lg border" style={{ borderColor: '#E5E5E5' }}>
                <p className="text-sm font-semibold mb-2">Revenue by Hotel</p>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueByHotel} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                      <Tooltip formatter={(value) => fmtLkr(Number(value))} />
                      <Bar dataKey="revenue" fill="#8884d8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Nationality Distribution */}
              <div className="mt-6 p-4 rounded-lg border" style={{ borderColor: '#E5E5E5' }}>
                <p className="text-sm font-semibold mb-2">Guest Nationality Distribution</p>
                <div className="w-full h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.nationalities} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={{ fontSize: 10 }}>
                        {data.nationalities.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsView;
