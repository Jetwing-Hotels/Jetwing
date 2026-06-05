"use client"

import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  UserPlus,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Mail,
  MailWarning,
  ChevronDown
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DashboardChart } from '@/components/charts/DashboardChart';
import { GuestPieChart } from '@/components/charts/GuestPieChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const guestGrowthData = [
  { month: 'Jan', guests: 4200 },
  { month: 'Feb', guests: 4500 },
  { month: 'Mar', guests: 5100 },
  { month: 'Apr', guests: 4800 },
  { month: 'May', guests: 5400 },
  { month: 'Jun', guests: 6200 },
];

const bookingSourceTrend = [
  { month: 'Jan', direct: 1200, ota: 1500, agent: 500 },
  { month: 'Feb', direct: 1350, ota: 1400, agent: 550 },
  { month: 'Mar', direct: 1600, ota: 1650, agent: 600 },
  { month: 'Apr', direct: 1450, ota: 1300, agent: 500 },
  { month: 'May', direct: 1800, ota: 1450, agent: 650 },
  { month: 'Jun', direct: 2100, ota: 1600, agent: 700 },
];

const revenueByHotel = [
  { name: 'Yala', revenue: 45.2 },
  { name: 'Blue', revenue: 38.5 },
  { name: 'Lagoon', revenue: 32.1 },
  { name: 'Vil Uyana', revenue: 28.4 },
  { name: 'Lighthouse', revenue: 35.8 },
];

const nationalityDistribution = [
  { name: 'Germany', value: 25, color: '#8B9E23' },
  { name: 'UK', value: 20, color: '#E91E8C' },
  { name: 'France', value: 15, color: '#FFC107' },
  { name: 'Australia', value: 15, color: '#00BCD4' },
  { name: 'India', value: 25, color: '#673AB7' },
];

const emailAvailability = [
  { name: 'With Email', value: 78, color: '#8B9E23' },
  { name: 'Without Email', value: 22, color: '#E5E5E5' },
];

const timePeriods = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Custom'];

export default function GuestAnalytics() {
  const [timePeriod, setTimePeriod] = useState('Monthly');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight" style={{color: '#1a1a1a'}}>Guest Analytics Dashboard</h1>
          <p style={{color: '#999'}}>Management-level insights and performance monitoring.</p>
        </div>

        <div className="flex items-center gap-2 bg-white border rounded-lg p-1" style={{borderColor: '#E5E5E5'}}>
          {timePeriods.map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              style={{
                backgroundColor: timePeriod === period ? '#f0f5e6' : 'transparent',
                color: timePeriod === period ? '#8B9E23' : '#666'
              }}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Guests" value="24,532" change={12.5} icon={Users} trend="up" description="vs last period" />
        <StatCard title="Total Bookings" value="18,240" change={8.2} icon={BookOpen} trend="up" description="vs last period" />
        <StatCard title="Total Revenue" value="LKR 425.8M" change={15.4} icon={DollarSign} trend="up" description="vs last period" />
        <StatCard title="Future Bookings" value="3,450" change={5.1} icon={Calendar} trend="up" description="confirmed ahead" />

        <StatCard title="Direct Bookings" value="10,580" change={18.2} icon={ArrowRight} trend="up" description="58% of total" />
        <StatCard title="OTA Bookings" value="7,660" change={-4.5} icon={TrendingUp} trend="down" description="42% of total" />
        <StatCard title="New Guests" value="4,230" change={10.2} icon={UserPlus} trend="up" description="first-time stay" />
        <StatCard title="Returning Guests" value="2,350" change={6.8} icon={UserCheck} trend="up" description="loyalty growth" />
      </div>

      {/* OTA Monitoring & Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Direct Booking Growth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-2" style={{borderColor: '#f0f5e6', backgroundColor: '#f9fbf2'}}>
              <p className="text-sm font-medium" style={{color: '#666'}}>OTA to Direct Conversion</p>
              <h3 className="text-4xl font-bold" style={{color: '#8B9E23'}}>842</h3>
              <p className="text-xs" style={{color: '#999'}}>Guests who first booked via OTA then later booked through website</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{color: '#666'}}>Conversion Rate</span>
                <span className="text-sm font-bold" style={{color: '#8B9E23'}}>12.4%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full" style={{width: '12.4%', backgroundColor: '#8B9E23'}}></div>
              </div>
              <p className="text-[10px]" style={{color: '#999'}}>*Target: 15% conversion by end of Q4</p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <DashboardChart
            title="Booking Source Trend"
            data={bookingSourceTrend}
            dataKey="month"
            type="line"
            categories={[
              { key: 'direct', color: '#8B9E23', name: 'Direct Website' },
              { key: 'ota', color: '#E91E8C', name: 'OTAs (Booking/Agoda)' },
              { key: 'agent', color: '#FFC107', name: 'Travel Agent' }
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DashboardChart
          title="Guest Growth"
          data={guestGrowthData}
          dataKey="month"
          type="area"
          categories={[
            { key: 'guests', color: '#8B9E23', name: 'Guest Count' }
          ]}
        />
        <DashboardChart
          title="Revenue by Hotel (LKR Millions)"
          data={revenueByHotel}
          dataKey="name"
          type="bar"
          categories={[
            { key: 'revenue', color: '#E91E8C', name: 'Revenue' }
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GuestPieChart
          title="Guest Nationality Distribution"
          data={nationalityDistribution}
        />
        <GuestPieChart
          title="Email Availability"
          data={emailAvailability}
        />
      </div>
    </div>
  );
}
