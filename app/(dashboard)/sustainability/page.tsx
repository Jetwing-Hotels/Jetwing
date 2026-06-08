"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, Calendar, Building2 } from "lucide-react";
import { C } from "@/components/sustainability/data";
import { exportSustainabilityReport } from "@/components/sustainability/exportReport";
import Overview from "@/components/sustainability/views/Overview";
import {
  ClimateAction,
  EnergyManagement,
  WaterManagement,
  WasteManagement,
  // Biodiversity,
} from "@/components/sustainability/views/Environment";
import {
  CommunityImpact,
  // EsgReports,
  // RiskManagement,
  // SustainabilityGoals,
} from "@/components/sustainability/views/SocialGov";
import {
  getEnvironmentDashboardRows,
  getCommunityPrograms,
  getProperties,
  getSustainabilityDashboardData,
  getWasteMonthlySummaryRows,
} from "@/lib/sustainability/api";
import type {
  CommunityProgramRow,
  PropertyOption,
  SustainabilityEnvironmentRow,
  SustainabilityWasteMonthlySummaryRow,
} from "@/lib/sustainability/types";

type ViewId =
  | "overview"
  | "climate"
  | "energy"
  | "water"
  | "waste"
  | "community";
// | "biodiversity"
// | "esg"
// | "risk"
// | "goals";

const viewLabels: Record<ViewId, string> = {
  overview: "Dashboard Overview",
  climate: "Climate Action",
  energy: "Energy Management",
  water: "Water Management",
  waste: "Waste Management",
  community: "Community Impact",
  // biodiversity: "Biodiversity",
  // esg: "ESG Reports",
  // risk: "Risk Management",
  // goals: "Sustainability Goals",
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateString: string) {
  if (!dateString) return "Select date";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toYearMonth(dateString: string) {
  return {
    year: Number(dateString.slice(0, 4)),
    month: Number(dateString.slice(5, 7)),
  };
}

function Dropdown({
  icon: Icon,
  options,
  value,
  onChange,
  width = 200,
}: {
  icon: React.ElementType;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" style={{ width }}>
      <button
        onClick={() => setOpen((o) => !o)}
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
        <div
          className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-lg py-1 max-h-72 overflow-y-auto"
          style={{ borderColor: C.border }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onMouseDown={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-slate-50"
              style={{
                color: opt === value ? C.primary : C.text,
                backgroundColor: opt === value ? C.softGreen : "transparent",
                fontWeight: opt === value ? 600 : 400,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2"
      style={{ borderColor: C.border }}
    >
      <Calendar className="w-4 h-4 shrink-0" style={{ color: C.primary }} />
      <div className="flex items-center gap-2">
        <label
          className="flex items-center gap-2 text-sm"
          style={{ color: C.text }}
        >
          <span className="font-medium">From</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="rounded-md border px-2 py-1 text-sm outline-none"
            style={{ borderColor: C.border }}
          />
        </label>
        <span className="text-sm" style={{ color: C.muted }}>
          to
        </span>
        <label
          className="flex items-center gap-2 text-sm"
          style={{ color: C.text }}
        >
          <span className="font-medium">To</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="rounded-md border px-2 py-1 text-sm outline-none"
            style={{ borderColor: C.border }}
          />
        </label>
      </div>
    </div>
  );
}

export default function SustainabilityPage() {
  const [view, setView] = useState<ViewId>("overview");
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [environmentRows, setEnvironmentRows] = useState<
    SustainabilityEnvironmentRow[]
  >([]);
  const [wasteSummaryRows, setWasteSummaryRows] = useState<
    SustainabilityWasteMonthlySummaryRow[]
  >([]);
  // const [biodiversityRows, setBiodiversityRows] = useState<
  //   Record<string, unknown>[]
  // >([]);
  const [socialRows, setSocialRows] = useState<Record<string, unknown>[]>([]);
  // const [riskRows, setRiskRows] = useState<Record<string, unknown>[]>([]);
  // const [goalRows, setGoalRows] = useState<Record<string, unknown>[]>([]);
  // const [governanceRows, setGovernanceRows] = useState<
  //   Record<string, unknown>[]
  // >([]);
  // const [esgRows, setEsgRows] = useState<Record<string, unknown>[]>([]);
  const [communityProgramRows, setCommunityProgramRows] = useState<
    CommunityProgramRow[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [environmentLoading, setEnvironmentLoading] = useState<boolean>(true);
  const [environmentError, setEnvironmentError] = useState<string | null>(null);
  const [communityProgramsLoading, setCommunityProgramsLoading] =
    useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 15);
    return toDateInputValue(date);
  });
  const [endDate, setEndDate] = useState<string>(() =>
    toDateInputValue(new Date()),
  );
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setView(customEvent.detail.view as ViewId);
    };

    window.addEventListener("sustainabilityViewChange", handleViewChange);
    return () =>
      window.removeEventListener("sustainabilityViewChange", handleViewChange);
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError(null);

        const [propertyRows, dashboardData] = await Promise.all([
          getProperties(),
          getSustainabilityDashboardData(),
        ]);

        setProperties(propertyRows);
        // setBiodiversityRows(
        //   (dashboardData?.biodiversity as Record<string, unknown>[]) || [],
        // );
        setSocialRows(
          (dashboardData?.social as Record<string, unknown>[]) || [],
        );
        // setRiskRows((dashboardData?.risks as Record<string, unknown>[]) || []);
        // setGoalRows((dashboardData?.goals as Record<string, unknown>[]) || []);
        // setGovernanceRows(
        //   (dashboardData?.governance as Record<string, unknown>[]) || [],
        // );
        // setEsgRows((dashboardData?.esg as Record<string, unknown>[]) || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load sustainability data from Supabase.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadEnvironmentRows() {
      try {
        setEnvironmentLoading(true);
        setEnvironmentError(null);

        const start = toYearMonth(startDate);
        const end = toYearMonth(endDate);

        const [rows, wasteRows] = await Promise.all([
          getEnvironmentDashboardRows({
            propertyId: selectedPropertyId,
            startYear: start.year,
            startMonth: start.month,
            endYear: end.year,
            endMonth: end.month,
          }),
          getWasteMonthlySummaryRows({
            propertyId: selectedPropertyId,
            startYear: start.year,
            startMonth: start.month,
            endYear: end.year,
            endMonth: end.month,
          }),
        ]);

        setEnvironmentRows(rows);
        setWasteSummaryRows(wasteRows);
      } catch (err) {
        console.error(err);
        setEnvironmentRows([]);
        setWasteSummaryRows([]);
        setEnvironmentError("Failed to load environment data from Supabase.");
      } finally {
        setEnvironmentLoading(false);
      }
    }

    loadEnvironmentRows();
  }, [selectedPropertyId, startDate, endDate]);

  useEffect(() => {
    async function loadCommunityPrograms() {
      try {
        setCommunityProgramsLoading(true);

        const start = toYearMonth(startDate);
        const end = toYearMonth(endDate);

        const rows = await getCommunityPrograms({
          propertyId: selectedPropertyId,
          startYear: start.year,
          startMonth: start.month,
          endYear: end.year,
          endMonth: end.month,
        });

        setCommunityProgramRows(rows);
      } catch (err) {
        console.error(err);
        setCommunityProgramRows([]);
      } finally {
        setCommunityProgramsLoading(false);
      }
    }

    loadCommunityPrograms();
  }, [selectedPropertyId, startDate, endDate]);

  const propertyOptions = [
    "All Properties",
    ...properties.map((p) => p.property_name),
  ];

  const selectedPropertyName =
    selectedPropertyId === "all"
      ? "All Properties"
      : (properties.find((p) => p.property_id === selectedPropertyId)
          ?.property_name ?? "All Properties");

  function handlePropertyChange(propertyName: string) {
    if (propertyName === "All Properties") {
      setSelectedPropertyId("all");
      return;
    }

    const matchedProperty = properties.find(
      (p) => p.property_name === propertyName,
    );
    setSelectedPropertyId(matchedProperty?.property_id ?? "all");
  }

  function filterByProperty<T extends { property_id?: string }>(rows: T[]) {
    if (selectedPropertyId === "all") return rows;
    return rows.filter((row) => row.property_id === selectedPropertyId);
  }

  function filterByDate<
    T extends { report_year?: number; report_month?: number },
  >(rows: T[]) {
    const s = toYearMonth(startDate);
    const e = toYearMonth(endDate);
    return rows.filter((row) => {
      const ry = Number(row.report_year ?? NaN);
      const rm = Number(row.report_month ?? NaN);
      if (!Number.isFinite(ry) || !Number.isFinite(rm)) return false;
      const afterStart = ry > s.year || (ry === s.year && rm >= s.month);
      const beforeEnd = ry < e.year || (ry === e.year && rm <= e.month);
      return afterStart && beforeEnd;
    });
  }

  const handleExportReport = async () => {
    if (!exportRef.current || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      await exportSustainabilityReport(exportRef.current, {
        title: `JetMind Sustainability Report - ${viewLabels[view]}`,
        subtitle: `Property: ${selectedPropertyName} | Period: ${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`,
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
      return <div className="p-6 text-sm text-red-600">{error}</div>;
    }

    switch (view) {
      case "overview":
        const start = toYearMonth(startDate);
        const end = toYearMonth(endDate);
        return (
          <Overview
            propertyId={
              selectedPropertyId === "all" ? undefined : selectedPropertyId
            }
            startYear={start.year}
            startMonth={start.month}
            endYear={end.year}
            endMonth={end.month}
          />
        );
      case "climate":
        return environmentLoading ? (
          <div className="p-6 text-sm" style={{ color: C.subtext }}>
            Loading climate data...
          </div>
        ) : environmentError ? (
          <div className="p-6 text-sm text-red-600">{environmentError}</div>
        ) : (
          (() => {
            const s = toYearMonth(startDate);
            const e = toYearMonth(endDate);
            return (
              <ClimateAction
                rows={environmentRows}
                showHotelComparison={selectedPropertyId === "all"}
                startYear={s.year}
                startMonth={s.month}
                endYear={e.year}
                endMonth={e.month}
              />
            );
          })()
        );
      case "energy":
        return environmentLoading ? (
          <div className="p-6 text-sm" style={{ color: C.subtext }}>
            Loading energy data...
          </div>
        ) : environmentError ? (
          <div className="p-6 text-sm text-red-600">{environmentError}</div>
        ) : (
          (() => {
            const s = toYearMonth(startDate);
            const e = toYearMonth(endDate);
            return (
              <EnergyManagement
                rows={environmentRows}
                showHotelComparison={selectedPropertyId === "all"}
                startYear={s.year}
                startMonth={s.month}
                endYear={e.year}
                endMonth={e.month}
              />
            );
          })()
        );
      case "water":
        return environmentLoading ? (
          <div className="p-6 text-sm" style={{ color: C.subtext }}>
            Loading water data...
          </div>
        ) : environmentError ? (
          <div className="p-6 text-sm text-red-600">{environmentError}</div>
        ) : (
          (() => {
            const s = toYearMonth(startDate);
            const e = toYearMonth(endDate);
            return (
              <WaterManagement
                rows={environmentRows}
                startYear={s.year}
                startMonth={s.month}
                endYear={e.year}
                endMonth={e.month}
              />
            );
          })()
        );
      case "waste":
        return environmentLoading ? (
          <div className="p-6 text-sm" style={{ color: C.subtext }}>
            Loading waste data...
          </div>
        ) : environmentError ? (
          <div className="p-6 text-sm text-red-600">{environmentError}</div>
        ) : (
          (() => {
            const s = toYearMonth(startDate);
            const e = toYearMonth(endDate);
            return (
              <WasteManagement
                rows={wasteSummaryRows}
                startYear={s.year}
                startMonth={s.month}
                endYear={e.year}
                endMonth={e.month}
                showHotelComparison={selectedPropertyId === "all"}
              />
            );
          })()
        );
      // case "biodiversity":
      //   return (
      //     <Biodiversity
      //       rows={filterByDate(filterByProperty(biodiversityRows))}
      //     />
      //   );
      case "community":
        return (() => {
          const s = toYearMonth(startDate);
          const e = toYearMonth(endDate);
          return (
            <CommunityImpact
              rows={filterByDate(filterByProperty(socialRows))}
              programRows={communityProgramRows}
              programsLoading={communityProgramsLoading}
              startYear={s.year}
              startMonth={s.month}
              endYear={e.year}
              endMonth={e.month}
            />
          );
        })();
      // case "esg":
      //   return (
      //     <EsgReports
      //       esgRows={filterByDate(filterByProperty(esgRows))}
      //       governanceRows={filterByDate(filterByProperty(governanceRows))}
      //     />
      //   );
      // case "risk":
      //   return (
      //     <RiskManagement rows={filterByDate(filterByProperty(riskRows))} />
      //   );
      // case "goals":
      //   return (
      //     <SustainabilityGoals
      //       rows={filterByDate(filterByProperty(goalRows))}
      //     />
      //   );
    }
  };
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Top filter bar — sticky so it does not cover the page header */}
      <div
        className="sticky top-[-32px] z-20 flex items-center justify-between gap-4 px-8 py-2 border-b bg-white shadow-sm"
        style={{ borderColor: C.border, backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-3">
          <Dropdown
            icon={Building2}
            options={propertyOptions}
            value={selectedPropertyName}
            onChange={handlePropertyChange}
            width={210}
          />
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
        <button
          onClick={handleExportReport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            backgroundColor: C.primary,
            opacity: isExporting ? 0.75 : 1,
          }}
        >
          <Download className="w-4 h-4" />
          {isExporting ? "Exporting..." : "Export Report"}
        </button>
      </div>

      {/* Main content */}
      <main
        className="flex-1 overflow-y-auto px-8 pb-8 pt-4"
        style={{ backgroundColor: C.bg }}
      >
        <div ref={exportRef}>{render()}</div>
      </main>
    </div>
  );
}
