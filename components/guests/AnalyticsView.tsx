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
  updatePeriod: (period: string, opts?: { from?: string; to?: string }) => void;
}

interface BookingMonth {
  month: string;
  Direct: number;
  BookingCom: number;
  Agoda: number;
  TravelAgent: number;
}

const AnalyticsView = ({
  timePeriod,
  updatePeriod
}: AnalyticsViewProps) => {
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

  const growthData = [
    { month: 'Jan', guests: 800 }, { month: 'Feb', guests: 950 }, { month: 'Mar', guests: 1100 },
    { month: 'Apr', guests: 1250 }, { month: 'May', guests: 1400 }, { month: 'Jun', guests: 1500 },
    { month: 'Jul', guests: 1650 }, { month: 'Aug', guests: 1700 }, { month: 'Sep', guests: 1600 },
    { month: 'Oct', guests: 1550 }, { month: 'Nov', guests: 1480 }, { month: 'Dec', guests: 1620 },
  ];

  const bookingSourceData: BookingMonth[] = [
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

  const convertedTrend = bookingSourceData.map((m) => {
    const ota = m.BookingCom + m.Agoda;
    const converted = Math.round(ota * 0.12);
    return { month: m.month, converted };
  });

  const totalConverted = convertedTrend.reduce((s, r) => s + r.converted, 0);
  const totalOta = bookingSourceData.reduce((s, m) => s + m.BookingCom + m.Agoda, 0);
  const conversionPct = totalOta > 0 ? (totalConverted / totalOta) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Guest Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
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

            <div className="mt-0 p-4 rounded-lg bg-slate-50 border border-dashed" style={{borderColor: '#E5E5E5'}}>
              <p className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Time Period Selector</p>
              <div className="flex gap-2 flex-wrap">
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsView;
