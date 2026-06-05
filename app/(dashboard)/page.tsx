"use client"

import React from 'react';
import { 
  TrendingUp, 
  Leaf, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Hotel
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DashboardChart } from '@/components/charts/DashboardChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const performanceData = [
  { month: 'Jan', revpar: 12500, occupancy: 72 },
  { month: 'Feb', revpar: 13200, occupancy: 75 },
  { month: 'Mar', revpar: 14800, occupancy: 82 },
  { month: 'Apr', revpar: 11500, occupancy: 65 },
  { month: 'May', revpar: 10800, occupancy: 60 },
  { month: 'Jun', revpar: 12100, occupancy: 68 },
];

const propertyPerformance = [
  { name: 'Jetwing Colombo Seven', revpar: 18500, occupancy: 85, trend: 'up' },
  { name: 'Jetwing Yala', revpar: 22000, occupancy: 78, trend: 'up' },
  { name: 'Jetwing Lake', revpar: 14200, occupancy: 72, trend: 'down' },
  { name: 'Jetwing Blue', revpar: 16800, occupancy: 80, trend: 'up' },
  { name: 'Jetwing Lighthouse', revpar: 19500, occupancy: 75, trend: 'neutral' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight" style={{color: '#1a1a1a'}}>Executive Dashboard</h1>
        <p style={{color: '#999'}}>Welcome back. Here is the group-wide performance overview for today.</p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Group Revenue" 
          value="LKR 142.5M" 
          change={12.5} 
          icon={DollarSign} 
          trend="up"
          description="vs last month"
        />
        <StatCard 
          title="Average RevPAR" 
          value="LKR 16,840" 
          change={8.2} 
          icon={TrendingUp} 
          trend="up"
          description="vs last month"
        />
        <StatCard 
          title="Group Occupancy" 
          value="74.2%" 
          change={-2.4} 
          icon={Hotel} 
          trend="down"
          description="vs last month"
        />
        <StatCard 
          title="Sustainability Score" 
          value="88/100" 
          change={4.1} 
          icon={Leaf} 
          trend="up"
          description="vs last month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        {/* Main Performance Chart */}
        <div className="lg:col-span-2 w-full min-w-0">
          <DashboardChart 
            title="Revenue & Occupancy Trends" 
            data={performanceData} 
            dataKey="month"
            type="area"
            categories={[
              { key: 'revpar', color: '#8B9E23', name: 'RevPAR (LKR)' },
              { key: 'occupancy', color: '#E91E8C', name: 'Occupancy (%)' }
            ]}
          />
        </div>

        {/* Property Leaderboard */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Property Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {propertyPerformance.map((property) => (
                <div key={property.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{color: '#1a1a1a'}}>{property.name}</p>
                    <p className="text-xs" style={{color: '#999'}}>{property.occupancy}% Occupancy</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{color: '#1a1a1a'}}>LKR {property.revpar.toLocaleString()}</p>
                    <div className="flex items-center justify-end text-[10px] font-medium" style={{
                      color: property.trend === 'up' ? '#8B9E23' : 
                             property.trend === 'down' ? '#E91E8C' : '#999'
                    }}>
                      {property.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : 
                       property.trend === 'down' ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : null}
                      {property.trend === 'up' ? 'Growing' : property.trend === 'down' ? 'Declining' : 'Stable'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
