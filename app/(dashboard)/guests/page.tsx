"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

import {
  Search,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';

import FilteringModule from '@/components/guests/FilteringModule';
import OfferIntelligence from '@/components/guests/OfferIntelligence';
import AnalyticsView from '@/components/guests/AnalyticsView';

export default function GuestsPage() {
  const [view, setView] = useState<'analytics' | 'filtering' | 'recommendations'>('analytics');
  const [timePeriod, setTimePeriod] = useState('monthly');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const router = useRouter();

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

    window.addEventListener('guestViewChange', handler as EventListener);
    return () => window.removeEventListener('guestViewChange', handler as EventListener);
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
    try {
      router.replace(window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
    } catch (e) {
      window.history.replaceState({}, '', window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
    }


  };

  if (view === 'filtering') return <FilteringModule />;
  if (view === 'recommendations') return <OfferIntelligence />;

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
          {view === 'analytics' ? (
            <AnalyticsView
              timePeriod={timePeriod}
              updatePeriod={updatePeriod}
            />
          ) : (
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Unified Profile Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700"><MapPin className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Cross-Property Guest</p>
                  <p className="text-xs text-slate-500 mt-0.5">34% of profiles recorded spent stays across more than 2 individual hotels.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700"><Calendar className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Average Lead Time</p>
                  <p className="text-xs text-slate-500 mt-0.5">22 days for domestic leisure booking variants.</p>
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
