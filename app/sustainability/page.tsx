"use client"

import React, { useState, useEffect } from 'react';
import { ChevronDown, Download, Calendar, Building2 } from 'lucide-react';
import { C, PROPERTIES, DATE_RANGES } from '@/components/sustainability/data';
import Overview from '@/components/sustainability/views/Overview';
import { ClimateAction, EnergyManagement, WaterManagement, WasteManagement, Biodiversity } from '@/components/sustainability/views/Environment';
import { CommunityImpact, EsgReports, RiskManagement, SustainabilityGoals } from '@/components/sustainability/views/SocialGov';

type ViewId = 'overview' | 'climate' | 'energy' | 'water' | 'waste' | 'biodiversity' | 'community' | 'esg' | 'risk' | 'goals';

function Dropdown({ icon: Icon, options, value, onChange, width = 200 }: {
  icon: React.ElementType; options: readonly string[]; value: string; onChange: (v: string) => void; width?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" style={{ width }}>
      <button
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border bg-white text-sm transition-colors"
        style={{ borderColor: C.border, color: C.text }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 shrink-0" style={{ color: C.primary }} />
          <span className="truncate font-medium">{value}</span>
        </span>
        <ChevronDown className="w-4 h-4 shrink-0" style={{ color: C.muted }} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-lg py-1 max-h-72 overflow-y-auto" style={{ borderColor: C.border }}>
          {options.map(opt => (
            <button
              key={opt}
              onMouseDown={() => { onChange(opt); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-slate-50"
              style={{ color: opt === value ? C.primary : C.text, backgroundColor: opt === value ? C.softGreen : 'transparent', fontWeight: opt === value ? 600 : 400 }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SustainabilityPage() {
  const [view, setView] = useState<ViewId>('overview');
  const [property, setProperty] = useState<string>(PROPERTIES[0]);
  const [range, setRange] = useState<string>(DATE_RANGES[2]);

  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setView(customEvent.detail.view as ViewId);
    };

    window.addEventListener('sustainabilityViewChange', handleViewChange);
    return () => window.removeEventListener('sustainabilityViewChange', handleViewChange);
  }, []);

  const render = () => {
    switch (view) {
      case 'overview': return <Overview />;
      case 'climate': return <ClimateAction />;
      case 'energy': return <EnergyManagement />;
      case 'water': return <WaterManagement />;
      case 'waste': return <WasteManagement />;
      case 'biodiversity': return <Biodiversity />;
      case 'community': return <CommunityImpact />;
      case 'esg': return <EsgReports />;
      case 'risk': return <RiskManagement />;
      case 'goals': return <SustainabilityGoals />;
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Top filter bar — fixed */}
      <div className="fixed top-0 left-64 right-0 z-20 flex items-center justify-between gap-4 px-8 py-3 border-b bg-white" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-3">
          <Dropdown icon={Building2} options={PROPERTIES} value={property} onChange={setProperty} width={210} />
          <Dropdown icon={Calendar} options={DATE_RANGES} value={range} onChange={setRange} width={180} />
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: C.primary }}
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-20 p-8" style={{ backgroundColor: C.bg }}>
        {render()}
      </main>
    </div>
  );
}
