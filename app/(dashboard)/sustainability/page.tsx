"use client"

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, Calendar, Building2 } from 'lucide-react';
import { C, DATE_RANGES } from '@/components/sustainability/data';
import { exportSustainabilityReport } from '@/components/sustainability/exportReport';
import Overview from '@/components/sustainability/views/Overview';
import { ClimateAction, EnergyManagement, WaterManagement, WasteManagement, Biodiversity } from '@/components/sustainability/views/Environment';
import { CommunityImpact, EsgReports, RiskManagement, SustainabilityGoals } from '@/components/sustainability/views/SocialGov';
import { getEnvironmentDashboardRows, getProperties, getSustainabilityDashboardData } from '@/lib/sustainability/api';
import type { PropertyOption, SustainabilityEnvironmentRow } from '@/lib/sustainability/types';

type ViewId = 'overview' | 'climate' | 'energy' | 'water' | 'waste' | 'biodiversity' | 'community' | 'esg' | 'risk' | 'goals';

const viewLabels: Record<ViewId, string> = {
  overview: 'Dashboard Overview',
  climate: 'Climate Action',
  energy: 'Energy Management',
  water: 'Water Management',
  waste: 'Waste Management',
  biodiversity: 'Biodiversity',
  community: 'Community Impact',
  esg: 'ESG Reports',
  risk: 'Risk Management',
  goals: 'Sustainability Goals',
};

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
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [environmentRows, setEnvironmentRows] = useState<SustainabilityEnvironmentRow[]>([]);
  const [biodiversityRows, setBiodiversityRows] = useState<Record<string, unknown>[]>([]);
  const [socialRows, setSocialRows] = useState<Record<string, unknown>[]>([]);
  const [riskRows, setRiskRows] = useState<Record<string, unknown>[]>([]);
  const [goalRows, setGoalRows] = useState<Record<string, unknown>[]>([]);
  const [governanceRows, setGovernanceRows] = useState<Record<string, unknown>[]>([]);
  const [esgRows, setEsgRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<string>(DATE_RANGES[2]);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setView(customEvent.detail.view as ViewId);
    };

    window.addEventListener('sustainabilityViewChange', handleViewChange);
    return () => window.removeEventListener('sustainabilityViewChange', handleViewChange);
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError(null);


        const [propertyRows, dashboardRows, dashboardData] = await Promise.all([
          getProperties(),
          getEnvironmentDashboardRows(),
          getSustainabilityDashboardData(),
        ]);

        setProperties(propertyRows);
        setEnvironmentRows(dashboardRows);
        setBiodiversityRows((dashboardData?.biodiversity as Record<string, unknown>[]) || []);
        setSocialRows((dashboardData?.social as Record<string, unknown>[]) || []);
        setRiskRows((dashboardData?.risks as Record<string, unknown>[]) || []);
        setGoalRows((dashboardData?.goals as Record<string, unknown>[]) || []);
        setGovernanceRows((dashboardData?.governance as Record<string, unknown>[]) || []);
        setEsgRows((dashboardData?.esg as Record<string, unknown>[]) || []);

      } catch (err) {
        console.error(err);
        setError('Failed to load sustainability data from Supabase.');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const propertyOptions = ['All Properties', ...properties.map((p) => p.property_name)];

  const selectedPropertyName =
    selectedPropertyId === 'all'
      ? 'All Properties'
      : properties.find((p) => p.property_id === selectedPropertyId)?.property_name ?? 'All Properties';

  function handlePropertyChange(propertyName: string) {
    if (propertyName === 'All Properties') {
      setSelectedPropertyId('all');
      return;
    }

    const matchedProperty = properties.find((p) => p.property_name === propertyName);
    setSelectedPropertyId(matchedProperty?.property_id ?? 'all');
  }

  const visibleRows =
    selectedPropertyId === 'all'
      ? environmentRows
      : environmentRows.filter((row) => row.property_id === selectedPropertyId);


  function filterByProperty<T extends { property_id?: string }>(rows: T[]) {
    if (selectedPropertyId === 'all') return rows;
    return rows.filter((row) => row.property_id === selectedPropertyId);
  }

  const handleExportReport = async () => {
    if (!exportRef.current || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      await exportSustainabilityReport(exportRef.current, {
        title: `JetMind Sustainability Report - ${viewLabels[view]}`,
        subtitle: `Property: ${selectedPropertyName} | Period: ${range}`,
        generatedAt: `Generated: ${new Date().toLocaleString()}`,
        filename: `jetmind-sustainability-${view}.pdf`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const render = () => {
    if (loading) {
      return (
        <div className="p-6 text-sm" style={{ color: C.subtext }}>
          Loading sustainability data...
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6 text-sm text-red-600">
          {error}
        </div>
      );
    }


    switch (view) {
      case 'overview': return <Overview />;
      case 'climate': return <ClimateAction rows={visibleRows} />;
      case 'energy': return <EnergyManagement rows={visibleRows} />;
      case 'water': return <WaterManagement rows={visibleRows} />;
      case 'waste': return <WasteManagement rows={visibleRows} />;
      case 'biodiversity': return <Biodiversity rows={filterByProperty(biodiversityRows)} />;
      case 'community': return <CommunityImpact rows={filterByProperty(socialRows)} />;
      case 'esg': return <EsgReports esgRows={filterByProperty(esgRows)} governanceRows={filterByProperty(governanceRows)} />;
      case 'risk': return <RiskManagement rows={filterByProperty(riskRows)} />;
      case 'goals': return <SustainabilityGoals rows={filterByProperty(goalRows)} />;
    }
  };
return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Top filter bar — fixed */}
      <div className="fixed top-0 left-64 right-0 z-20 flex items-center justify-between gap-4 px-8 py-3 border-b bg-white" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-3">
          <Dropdown icon={Building2} options={propertyOptions} value={selectedPropertyName} onChange={handlePropertyChange} width={210} />
          <Dropdown icon={Calendar} options={DATE_RANGES} value={range} onChange={setRange} width={180} />
        </div>
        <button
          onClick={handleExportReport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: C.primary, opacity: isExporting ? 0.75 : 1 }}
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export Report'}
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-20 p-8" style={{ backgroundColor: C.bg }}>
        <div ref={exportRef}>
          {render()}
        </div>
      </main>
    </div>
  );
}
