"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

import { Search } from 'lucide-react';

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(viewParam);
    }

    const periodParam = params.get('period');
    if (periodParam) {
      setTimePeriod(periodParam);
    }
    const fromParam = params.get('from');
    const toParam = params.get('to');
    if (fromParam || toParam) {
      setCustomRange({ from: fromParam || '', to: toParam || '' });
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
      const newFrom = opts?.from ?? customRange.from;
      const newTo = opts?.to ?? customRange.to;
      if (newFrom) params.set('from', newFrom);
      if (newTo) params.set('to', newTo);
      setCustomRange({ from: newFrom, to: newTo });
    } else {
      params.delete('from');
      params.delete('to');
      setCustomRange({ from: '', to: '' });
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

      <div className="grid grid-cols-1 gap-6">
        <div>
          {view === 'analytics' ? (
            <AnalyticsView
              timePeriod={timePeriod}
              customRange={customRange}
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
      </div>
    </div>
  );
}
