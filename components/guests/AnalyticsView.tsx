"use client"

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

interface AnalyticsViewProps {
  timePeriod: string;
  customRange: { from: string; to: string };
  updatePeriod: (period: string, opts?: { from?: string; to?: string }) => void;
}

const getKpis = (period: string, numDays: number) => {
  let multiplier = 1;
  if (period === 'daily') multiplier = 1 / 365;
  else if (period === 'weekly') multiplier = 7 / 365;
  else if (period === 'monthly') multiplier = 30 / 365;
  else if (period === 'quarterly') multiplier = 90 / 365;
  else if (period === 'yearly') multiplier = 1;
  else if (period === 'custom') multiplier = numDays / 365;

  const formatRevenue = (val: number) => {
    if (val >= 1000000) return `LKR ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `LKR ${(val / 1000).toFixed(0)}k`;
    return `LKR ${val.toFixed(0)}`;
  };

  const totalGuests = Math.round(12458 * multiplier);
  const totalBookings = Math.round(9821 * multiplier);
  const totalRevenueVal = 142300000 * multiplier;
  const directBookings = Math.round(5700 * multiplier);
  const otaBookings = Math.round(4121 * multiplier);
  const futureBookings = Math.round(860 * multiplier);
  const newGuests = Math.round(2300 * multiplier);
  const returningGuests = Math.round(10158 * multiplier);

  return [
    { label: 'Total Guests', value: totalGuests.toLocaleString() },
    { label: 'Total Bookings', value: totalBookings.toLocaleString() },
    { label: 'Total Revenue', value: formatRevenue(totalRevenueVal) },
    { label: 'Direct Bookings', value: directBookings.toLocaleString() },
    { label: 'OTA Bookings', value: otaBookings.toLocaleString() },
    { label: 'Future Bookings', value: futureBookings.toLocaleString() },
    { label: 'New Guests', value: newGuests.toLocaleString() },
    { label: 'Returning Guests', value: returningGuests.toLocaleString() },
  ];
};

const generateChartData = (period: string, fromStr?: string, toStr?: string) => {
  let labels: string[] = [];
  let numDays = 30;

  if (period === 'daily') {
    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    numDays = 7;
  } else if (period === 'weekly') {
    labels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'];
    numDays = 42;
  } else if (period === 'monthly') {
    labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    numDays = 365;
  } else if (period === 'quarterly') {
    labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    numDays = 365;
  } else if (period === 'yearly') {
    labels = ['2022', '2023', '2024', '2025', '2026'];
    numDays = 365 * 5;
  } else if (period === 'custom') {
    const fromDate = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = toStr ? new Date(toStr) : new Date();
    const start = isNaN(fromDate.getTime()) ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : fromDate;
    const end = isNaN(toDate.getTime()) ? new Date() : toDate;
    const finalStart = start <= end ? start : end;
    const finalEnd = start <= end ? end : start;

    const diffTime = Math.abs(finalEnd.getTime() - finalStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    numDays = diffDays;

    if (diffDays <= 7) {
      labels = [];
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(finalStart);
        d.setDate(finalStart.getDate() + i);
        labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      }
    } else if (diffDays <= 31) {
      labels = [];
      for (let i = 0; i < diffDays; i += Math.max(1, Math.floor(diffDays / 6))) {
        const d = new Date(finalStart);
        d.setDate(finalStart.getDate() + Math.round(i));
        if (d <= finalEnd) {
          labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        }
      }
    } else if (diffDays <= 180) {
      const numWeeks = Math.ceil(diffDays / 7);
      labels = [];
      for (let i = 0; i < numWeeks; i++) {
        labels.push(`Wk ${i + 1}`);
      }
    } else {
      const numMonths = Math.ceil(diffDays / 30);
      labels = [];
      for (let i = 0; i < numMonths; i++) {
        const d = new Date(finalStart);
        d.setMonth(finalStart.getMonth() + i);
        labels.push(d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }));
      }
    }
  }

  let baseGuests = 1000;
  if (period === 'daily') baseGuests = 50;
  else if (period === 'weekly') baseGuests = 300;
  else if (period === 'monthly') baseGuests = 1200;
  else if (period === 'quarterly') baseGuests = 3500;
  else if (period === 'yearly') baseGuests = 13000;
  else if (period === 'custom') {
    baseGuests = Math.round(40 * (numDays / Math.max(1, labels.length)));
  }

  const growthData = labels.map((label, index) => {
    const factor = 1 + Math.sin(index / 2) * 0.15 + (index / Math.max(1, labels.length)) * 0.1;
    const guests = Math.round(baseGuests * factor);
    return {
      month: label,
      guests
    };
  });

  const bookingSourceData = labels.map((label, index) => {
    const total = baseGuests * (1 + Math.sin(index / 3) * 0.1 + (index / Math.max(1, labels.length)) * 0.05);
    const Direct = Math.round(total * 0.45);
    const BookingCom = Math.round(total * 0.25);
    const Agoda = Math.round(total * 0.18);
    const TravelAgent = Math.max(0, Math.round(total - Direct - BookingCom - Agoda));

    return {
      month: label,
      Direct,
      BookingCom,
      Agoda,
      TravelAgent
    };
  });

  const totalPeriodRevenue = 142300000 * (numDays / 365);
  const hotelShares = [0.35, 0.25, 0.20, 0.12, 0.08];
  const hotelNames = ['Yala', 'Blue', 'Lagoon', 'Vil Uyana', 'Lighthouse'];
  const revenueByHotel = hotelNames.map((name, index) => {
    const share = hotelShares[index];
    const revenue = Math.round(totalPeriodRevenue * share);
    return {
      name,
      revenue
    };
  });

  const totalGuestsPeriod = 12458 * (numDays / 365);
  const countryShares = [0.32, 0.25, 0.18, 0.15, 0.10];
  const countryNames = ['Germany', 'UK', 'France', 'Australia', 'India'];
  const nationalityData = countryNames.map((name, index) => {
    const value = Math.round(totalGuestsPeriod * countryShares[index]);
    return {
      name,
      value
    };
  });

  const convertedTrend = bookingSourceData.map((m) => {
    const ota = m.BookingCom + m.Agoda;
    const converted = Math.round(ota * 0.12);
    return { month: m.month, converted };
  });

  const totalConverted = convertedTrend.reduce((s, r) => s + r.converted, 0);
  const totalOta = bookingSourceData.reduce((s, m) => s + m.BookingCom + m.Agoda, 0);
  const conversionPct = totalOta > 0 ? (totalConverted / totalOta) * 100 : 0;

  const kpis = getKpis(period, numDays);

  return {
    kpis,
    growthData,
    bookingSourceData,
    revenueByHotel,
    nationalityData,
    convertedTrend,
    totalConverted,
    conversionPct
  };
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f7f', '#8B9E23'];

const AnalyticsView = ({
  timePeriod,
  customRange,
  updatePeriod
}: AnalyticsViewProps) => {
  const {
    kpis,
    growthData,
    bookingSourceData,
    revenueByHotel,
    nationalityData,
    convertedTrend,
    totalConverted,
    conversionPct
  } = generateChartData(timePeriod, customRange?.from, customRange?.to);

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <CardTitle className="text-xl font-bold">Guest Analytics Dashboard</CardTitle>
          <div className="flex gap-2 flex-wrap items-center">
            {['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'].map((p) => (
              <Button
                key={p}
                variant={timePeriod === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => updatePeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {timePeriod === 'custom' && (
            <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-dashed flex flex-wrap gap-4 items-end animate-in fade-in duration-200" style={{borderColor: '#E5E5E5'}}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">From Date</label>
                <input
                  type="date"
                  value={customRange?.from || ''}
                  onChange={(e) => updatePeriod('custom', { from: e.target.value, to: customRange?.to })}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none shadow-sm transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">To Date</label>
                <input
                  type="date"
                  value={customRange?.to || ''}
                  onChange={(e) => updatePeriod('custom', { from: customRange?.from, to: e.target.value })}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none shadow-sm transition-all"
                />
              </div>
              {(!customRange?.from || !customRange?.to) && (
                <p className="text-[11px] text-slate-400 italic mb-2">Please select both start and end dates</p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <div key={k.label} className="p-4 rounded-lg border" style={{borderColor: '#E5E5E5'}}>
                <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                <p className="text-xl font-bold mt-1 text-slate-800">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border" style={{borderColor: '#E5E5E5'}}>
              <p className="text-xs font-medium text-slate-500">Converted Guests (OTA → Direct)</p>
              <p className="text-2xl font-bold mt-2 text-slate-900">{totalConverted.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">Conversion: {conversionPct.toFixed(1)}%</p>
            </div>
            <div className="p-4 rounded-lg border lg:col-span-2" style={{borderColor: '#E5E5E5'}}>
              <p className="text-sm font-semibold mb-2">Converted Guests Trend</p>
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={convertedTrend}>
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

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg border flex flex-col justify-center" style={{borderColor: '#E5E5E5'}}>
              <p className="text-sm font-semibold mb-4">OTA Monitoring</p>
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-bold text-2xl text-indigo-600">42%</p>
                  <p className="text-xs text-muted-foreground">OTA Channels Split</p>
                </div>
                <div className="p-3 bg-lime-50/50 rounded-lg">
                  <p className="font-bold text-2xl" style={{color: '#8B9E23'}}>58%</p>
                  <p className="text-xs text-muted-foreground">Direct Web Conversions</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border lg:col-span-2" style={{borderColor: '#E5E5E5'}}>
              <p className="text-sm font-semibold mb-2">Guest Growth</p>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="month" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{fontSize: 12}} />
                    <Line type="monotone" dataKey="guests" name="Total Guests" stroke="#8B9E23" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div className="p-4 rounded-lg border" style={{borderColor: '#E5E5E5'}}>
              <p className="text-sm font-semibold mb-2">Booking Source Trend</p>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingSourceData}>
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
              <p className="text-sm font-semibold mb-2">Revenue by Hotel</p>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByHotel}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="name" tick={{fontSize: 11}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsView;
