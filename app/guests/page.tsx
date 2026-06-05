"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import {
  Search,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';

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
  Cell
} from 'recharts';

import FilteringModule from '@/components/guests/FilteringModule';
import OfferIntelligence from '@/components/guests/OfferIntelligence';


const guestProfiles = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    email: 'sarah.m@example.com',
    tier: 'Platinum',
    totalSpend: 850000,
    lastStay: '2024-05-12',
    preference: 'High Floor, Eco-tours',
    sentiment: 0.92
  },
  {
    id: 2,
    name: 'James Wilson',
    email: 'j.wilson@example.com',
    tier: 'Gold',
    totalSpend: 420000,
    lastStay: '2024-03-20',
    preference: 'Vegan menu, Spa regular',
    sentiment: 0.85
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    email: 'elena.r@example.com',
    tier: 'Silver',
    totalSpend: 150000,
    lastStay: '2023-11-05',
    preference: 'Quiet room, Early check-in',
    sentiment: 0.78
  }
];

export default function GuestsPage() {
  const [view, setView] = useState<
    'analytics' | 'filtering' | 'recommendations'
  >('analytics');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');

    if (
      viewParam === 'analytics' ||
      viewParam === 'filtering' ||
      viewParam === 'recommendations'
    ) {
      setView(viewParam);
    }

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;

      if (customEvent?.detail?.view) {
        setView(customEvent.detail.view);
      }
    };

    window.addEventListener(
      'guestViewChange',
      handler as EventListener
    );

    return () =>
      window.removeEventListener(
        'guestViewChange',
        handler as EventListener
      );
  }, []);
  

  if (view === 'filtering') {
    return <FilteringModule />;
  }

  if (view === 'recommendations') {
    return <OfferIntelligence />;
  }


    const AnalyticsView = () => {
      const router = useRouter();
      const [timePeriod, setTimePeriod] = useState<string>('monthly');
      const [customRange, setCustomRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

      useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const p = params.get('period') || 'monthly';
        setTimePeriod(p);
        if (p === 'custom') {
          setCustomRange({ from: params.get('from') || '', to: params.get('to') || '' });
        }
      }, []);

      const updatePeriod = (period: string, opts?: { from?: string; to?: string }) => {
      setTimePeriod(period);
      const params = new URLSearchParams(window.location.search);
      params.set('period', period);
      if (period === 'custom') {
        if (opts?.from) params.set('from', opts.from);
        if (opts?.to) params.set('to', opts.to);
      } else {
        params.delete('from');
        params.delete('to');
      }
      // replace the URL without navigating
      try {
        router.replace(window.location.pathname + (params.toString() ? `?${params.toString()}` : ''));
      } catch (e) {
        // fallback: set location
        window.history.replaceState({}, '', window.location.pathname + (params.toString() ? `?${params.toString()}` : ''));
      }
    };
    const kpis = [
      { label: 'Total Guests', value: '12,458' },
      { label: 'Total Bookings', value: '9,821' },
      { label: 'Total Revenue', value: 'LKR 142.3M' },
      { label: 'Direct Bookings', value: '5,700' },
      { label: 'OTA Bookings', value: '4,121' },
      { label: 'Future Bookings', value: '860' },
      { label: 'New Guests', value: '2,300' },
      { label: 'Returning Guests', value: '10,158' },
    ];

    const otaPercent = 42;
    const directPercent = 58;

    const growthData = [
      { month: 'Jan', guests: 800 }, { month: 'Feb', guests: 950 }, { month: 'Mar', guests: 1100 }, 
      { month: 'Apr', guests: 1250 }, { month: 'May', guests: 1400 }, { month: 'Jun', guests: 1500 }, 
      { month: 'Jul', guests: 1650 }, { month: 'Aug', guests: 1700 }, { month: 'Sep', guests: 1600 }, 
      { month: 'Oct', guests: 1550 }, { month: 'Nov', guests: 1480 }, { month: 'Dec', guests: 1620 },
    ];

    const bookingSourceData = [
      { month: 'Jan', Direct: 300, BookingCom: 200, Agoda: 150, TravelAgent: 150 },
      { month: 'Feb', Direct: 350, BookingCom: 240, Agoda: 180, TravelAgent: 180 },
      { month: 'Mar', Direct: 400, BookingCom: 300, Agoda: 200, TravelAgent: 200 },
      { month: 'Apr', Direct: 420, BookingCom: 360, Agoda: 240, TravelAgent: 230 },
      { month: 'May', Direct: 480, BookingCom: 420, Agoda: 280, TravelAgent: 220 },
      { month: 'Jun', Direct: 520, BookingCom: 460, Agoda: 320, TravelAgent: 240 },
    ];

    const revenueByHotel = [
      { name: 'Yala', revenue: 4200000 }, { name: 'Blue', revenue: 3200000 }, 
      { name: 'Lagoon', revenue: 2800000 }, { name: 'Vil Uyana', revenue: 2200000 }, 
      { name: 'Lighthouse', revenue: 1800000 },
    ];

    const nationalityData = [
      { name: 'Germany', value: 1200 }, { name: 'UK', value: 1100 }, 
      { name: 'France', value: 900 }, { name: 'Australia', value: 700 }, { name: 'India', value: 1500 },
    ];
    
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f7f', '#8B9E23'];

    return (
      <div className="space-y-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Guest Analytics Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            {/* KPI Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpis.map((k) => (
                <div key={k.label} className="p-4 rounded-lg border" style={{borderColor: '#E5E5E5'}}>
                  <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                  <p className="text-xl font-bold mt-1 text-slate-800">{k.value}</p>
                </div>
              ))}
            </div>

            {/* Converted Guests KPI (mocked from bookingSourceData) */}
            {bookingSourceData && (
              (() => {
                const convertedTrend = bookingSourceData.map((m) => {
                  // Mock: assume 12% of OTA bookings (BookingCom + Agoda) convert later to direct
                  const ota = (m.BookingCom || 0) + (m.Agoda || 0);
                  const converted = Math.round(ota * 0.12);
                  return { month: m.month, converted };
                });

                const totalConverted = convertedTrend.reduce((s, r) => s + r.converted, 0);
                const last = convertedTrend[convertedTrend.length - 1]?.converted || 0;
                const prev = convertedTrend[convertedTrend.length - 2]?.converted || 1;
                const monthlyGrowth = prev > 0 ? ((last - prev) / prev) * 100 : 0;
                const conversionPct = (() => {
                  const totalOta = bookingSourceData.reduce((s, r) => s + (r.BookingCom || 0) + (r.Agoda || 0), 0);
                  return totalOta > 0 ? (totalConverted / totalOta) * 100 : 0;
                })();

                return (
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border" style={{borderColor: '#E5E5E5'}}>
                      <p className="text-xs font-medium text-slate-500">Converted Guests (OTA → Direct)</p>
                      <p className="text-2xl font-bold mt-2 text-slate-900">{totalConverted.toLocaleString()}</p>
                      <p className="text-sm text-slate-500 mt-1">Conversion: {conversionPct.toFixed(1)}%</p>
                      <p className="text-sm text-slate-500 mt-0.5">Monthly growth: {monthlyGrowth.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 rounded-lg border lg:col-span-2" style={{borderColor: '#E5E5E5'}}>
                      <p className="text-sm font-semibold mb-2">Converted Guests Trend</p>
                      <div className="w-full h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={convertedTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                            <XAxis dataKey="month" tick={{fontSize: 11}} />
                            <YAxis tick={{fontSize: 11}} />
                            <Tooltip />
                            <Line type="monotone" dataKey="converted" stroke="#8B9E23" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Main Charts: Row 1 */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg border flex flex-col justify-center" style={{borderColor: '#E5E5E5'}}>
                <p className="text-sm font-semibold mb-4">OTA Monitoring</p>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-bold text-2xl text-indigo-600">{otaPercent}%</p>
                    <p className="text-xs text-muted-foreground">OTA Channels Split</p>
                  </div>
                  <div className="p-3 bg-lime-50/50 rounded-lg">
                    <p className="font-bold text-2xl" style={{color: '#8B9E23'}}>{directPercent}%</p>
                    <p className="text-xs text-muted-foreground">Direct Web Conversions</p>
                  </div>
                </div>
              </div>

              {/* Explicit height container block */}
              <div className="p-4 rounded-lg border lg:col-span-2" style={{borderColor: '#E5E5E5'}}>
                <p className="text-sm font-semibold mb-2">Guest Growth (Month vs Guest Count)</p>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                      <XAxis dataKey="month" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip />
                      <Legend iconSize={10} wrapperStyle={{fontSize: 12}} />
                      <Line type="monotone" dataKey="guests" name="Total Guests" stroke="#8B9E23" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Secondary Charts: Row 2 */}
            <div className="mt-6 grid grid-cols-1 gap-6">
              <div className="p-4 rounded-lg border" style={{borderColor: '#E5E5E5'}}>
                <p className="text-sm font-semibold mb-2">Booking Source Trend</p>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bookingSourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                      <XAxis dataKey="month" tick={{fontSize: 11}} />
                      <YAxis tick={{fontSize: 11}} />
                      <Tooltip />
                      <Bar dataKey="Direct" stackId="a" fill="#8B9E23" />
                      <Bar dataKey="BookingCom" name="Booking.com" stackId="a" fill="#8884d8" />
                      <Bar dataKey="Agoda" stackId="a" fill="#82ca9d" />
                      <Bar dataKey="TravelAgent" name="Agent" stackId="a" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 rounded-lg border" style={{borderColor: '#E5E5E5'}}>
                <p className="text-sm font-semibold mb-2">Revenue by Hotel (LKR)</p>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByHotel} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                      <XAxis dataKey="name" tick={{fontSize: 11}} />
                      <YAxis tick={{fontSize: 10}} tickFormatter={(value: any) => `${value / 1000000}M`} />
                      <Tooltip formatter={(value: any) => [`LKR ${value.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 rounded-lg border" style={{borderColor: '#E5E5E5'}}>
                <p className="text-sm font-semibold mb-2">Guest Nationality Distribution</p>
                <div className="w-full h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={nationalityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{fontSize: 10}}>
                        {nationalityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Time Period Controls */}
            <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-dashed" style={{borderColor: '#E5E5E5'}}>
              <p className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Time Period Selector</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'yearly', label: 'Yearly' },
                  { value: 'custom', label: 'Custom Range' },
                ].map((p) => (
                  <Button
                    key={p.value}
                    variant={timePeriod === p.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (p.value === 'custom') {
                        // keep current customRange if set, otherwise switch to custom
                        updatePeriod('custom', { from: customRange.from, to: customRange.to });
                      } else {
                        updatePeriod(p.value);
                      }
                    }}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>

              {timePeriod === 'custom' && (
                <div className="mt-3 flex items-center gap-2">
                    <input
                    type="date"
                    value={customRange.from}
                    onChange={(e) => setCustomRange((s: { from: string; to: string }) => ({ ...s, from: e.target.value }))}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-slate-500">to</span>
                  <input
                    type="date"
                    value={customRange.to}
                    onChange={(e) => setCustomRange((s: { from: string; to: string }) => ({ ...s, to: e.target.value }))}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <Button size="sm" variant="default" onClick={() => updatePeriod('custom', { from: customRange.from, to: customRange.to })}>
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Guest Intelligence Layer</h1>
          <p className="text-sm text-slate-500 mt-1">Unified 360-degree guest profiles and personalization analytics.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by name, email, passport or booking ID..." 
          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none shadow-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {view === 'analytics' ? <AnalyticsView /> : (
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">Guest Intelligence - {view}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Placeholder content for {view} view layout mockup.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info Panels */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Unified Profile Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Cross-Property Guest</p>
                  <p className="text-xs text-slate-500 mt-0.5">34% of profiles recorded spent stays across more than 2 individual hotels.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Average Lead Time</p>
                  <p className="text-xs text-slate-500 mt-0.5">22 days for domestic leisure booking variants; 65 days for international travel packages.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-50 text-pink-700">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Peak Engagement Window</p>
                  <p className="text-xs text-slate-500 mt-0.5">Guests are most interactive with feedback prompts within 48 hours following checkout events.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Top System Segments</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800">Domestic Leisure</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800">Eco-Conscious</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-pink-50 text-pink-800">Wellness Seekers</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}