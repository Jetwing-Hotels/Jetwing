"use client";
import { SectionLabel } from "../ui";

import React, { useState } from "react";
import {
  sumBy,
  toNumber,
  latestByPeriod,
  monthLabel,
} from "@/lib/sustainability/api";
import {
  FileText,
  Download,
  FileSpreadsheet,
  CalendarClock,
  MapPin,
  Bell,
  User,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import {
  C,
  communityByHotel,
  employmentSplit,
  communityInvestment,
  supplierRegions,
  sourcingTrend,
  supplierRatings,
  risks,
  goals,
  reports,
  complianceFrameworks,
  esgPillars,
  type Risk,
  type Goal,
  type ReportRow,
} from "../data";
import type { CommunityProgramRow } from "@/lib/sustainability/types";
import {
  Card,
  ChartCard,
  StatTile,
  Donut,
  HBar,
  AreaTrend,
  ProgressBar,
  SeverityPill,
  PageHeader,
} from "../ui";

function noDataMessage(title: string, subtitle: string) {
  return (
    <Card className="p-6">
      <p className="text-sm font-semibold" style={{ color: C.text }}>
        No sustainability data found for this selection.
      </p>
      <p className="text-xs mt-1" style={{ color: C.subtext }}>
        {title} · {subtitle}
      </p>
    </Card>
  );
}

type CommunityProgramCard = {
  title: string;
  description: string;
  programType: string | null;
  status: string | null;
  participants: number;
  beneficiaries: number;
  volunteerHours: number;
  investmentLkr: number;
  monthsActive: number;
};

function groupCommunityPrograms(
  rows: CommunityProgramRow[],
): CommunityProgramCard[] {
  const buckets = new Map<
    string,
    CommunityProgramCard & { lastPeriod: number }
  >();

  for (const row of rows) {
    const key = row.program_name;
    const period = row.report_year * 12 + row.report_month;
    const existing = buckets.get(key);

    if (!existing) {
      buckets.set(key, {
        title: row.program_name,
        description:
          row.description?.trim() || row.notes?.trim() || "Community programme",
        programType: row.program_type,
        status: row.status,
        participants: row.participants ?? 0,
        beneficiaries: row.beneficiaries ?? 0,
        volunteerHours: Number(row.staff_volunteer_hours ?? 0),
        investmentLkr: Number(row.investment_lkr ?? 0),
        monthsActive: 1,
        lastPeriod: period,
      });
      continue;
    }

    existing.participants += row.participants ?? 0;
    existing.beneficiaries += row.beneficiaries ?? 0;
    existing.volunteerHours += Number(row.staff_volunteer_hours ?? 0);
    existing.investmentLkr += Number(row.investment_lkr ?? 0);
    existing.monthsActive += 1;

    if (period >= existing.lastPeriod) {
      existing.status = row.status;
      existing.programType = row.program_type ?? existing.programType;
      existing.description =
        row.description?.trim() || row.notes?.trim() || existing.description;
      existing.lastPeriod = period;
    }
  }

  return [...buckets.values()]
    .map(({ lastPeriod, ...card }) => card)
    .sort(
      (a, b) =>
        b.participants - a.participants || b.investmentLkr - a.investmentLkr,
    );
}

// ── Community Impact ─────────────────────────────────────────────────────────
export function CommunityImpact({
  rows = [],
  programRows = [],
  programsLoading = false,
  startYear,
  startMonth,
  endYear,
  endMonth,
}: {
  rows?: Record<string, unknown>[];
  programRows?: CommunityProgramRow[];
  programsLoading?: boolean;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
}) {
  if (rows.length === 0) {
    return (
      <div>
        <section data-export-block="true">
          <PageHeader
            title="Community Impact"
            subtitle="Engagement programmes, youth training, local employment and social investment"
          />
          {noDataMessage(
            "Community Impact",
            "Add rows to sustainability_social_monthly_summary",
          )}
        </section>
      </div>
    );
  }

  const communityProgramsCount = sumBy(
    rows,
    (row) => row.community_program_count,
  );
  const participants = sumBy(rows, (row) => row.total_participants);
  const investment = sumBy(rows, (row) => row.community_investment_lkr);

  const communityInvestmentMonthly = rows.map((row) => ({
    month: `${monthLabel(toNumber(row.report_year), toNumber(row.report_month))} ${toNumber(row.report_year)}`,
    amount: toNumber(row.community_investment_lkr) / 1000000,
  }));

  // Build months list from selected range if provided, otherwise infer from rows
  function buildMonthsList() {
    if (
      Number.isInteger(startYear) &&
      Number.isInteger(startMonth) &&
      Number.isInteger(endYear) &&
      Number.isInteger(endMonth)
    ) {
      const list: { year: number; month: number }[] = [];
      let y = startYear as number;
      let m = startMonth as number;
      while (
        y < (endYear as number) ||
        (y === (endYear as number) && m <= (endMonth as number))
      ) {
        list.push({ year: y, month: m });
        m += 1;
        if (m > 12) {
          m = 1;
          y += 1;
        }
      }
      return list;
    }

    const sorted = [...rows].sort((a, b) =>
      toNumber(a.report_year) === toNumber(b.report_year)
        ? toNumber(a.report_month) - toNumber(b.report_month)
        : toNumber(a.report_year) - toNumber(b.report_year),
    );
    if (sorted.length === 0) return [];
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const list: { year: number; month: number }[] = [];
    let y = toNumber(first.report_year);
    let m = toNumber(first.report_month);
    while (
      y < toNumber(last.report_year) ||
      (y === toNumber(last.report_year) && m <= toNumber(last.report_month))
    ) {
      list.push({ year: y, month: m });
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return list;
  }

  const months = buildMonthsList();

  const investmentSeries = months.map(({ year, month }) => {
    const match = rows.find(
      (r) =>
        toNumber(r.report_year) === year && toNumber(r.report_month) === month,
    );
    return {
      month: `${monthLabel(year, month)} ${year}`,
      amount: match ? toNumber(match.community_investment_lkr) / 1000000 : 0,
    };
  });

  const localEmployees = sumBy(rows, (row) => row.same_district_employees);
  const provinceEmployees = sumBy(
    rows,
    (row) => row.same_province_other_district_employees,
  );
  const outsideEmployees = sumBy(rows, (row) => row.outside_province_employees);

  const empTotal = localEmployees + provinceEmployees + outsideEmployees;

  // Weighted percent for selected period (fallback to latest-period percent if no employee counts available)
  const localEmploymentPct =
    empTotal > 0
      ? (localEmployees / empTotal) * 100
      : latestByPeriod(rows)?.same_district_employment_rate_pct || 0;

  const employmentSplitDb =
    empTotal > 0
      ? [
          {
            name: "Within District",
            value: (localEmployees / empTotal) * 100,
            color: C.teal,
          },
          {
            name: "Within Province",
            value: (provinceEmployees / empTotal) * 100,
            color: C.accent,
          },
          {
            name: "Outside Province",
            value: (outsideEmployees / empTotal) * 100,
            color: C.muted,
          },
        ]
      : employmentSplit;

  const groupedPrograms = groupCommunityPrograms(programRows);

  return (
    <div>
      <section data-export-block="true">
        <PageHeader
          title="Community Impact"
          subtitle="Engagement programmes, youth training, local employment and social investment"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Programmes Conducted"
            value={communityProgramsCount.toString()}
            sub="Selected period total"
            accent={C.accent}
          />
          <StatTile
            label="Youth Trained"
            value={participants.toString()}
            sub="Active participants"
            accent={C.primary}
          />
          <StatTile
            label="Community Investment"
            value={`LKR ${(investment / 1000000).toFixed(1)}M`}
            sub="Total spend (selected period)"
            accent={C.blue}
          />
          <StatTile
            label="Local Employment"
            value={`${toNumber(localEmploymentPct).toFixed(0)}%`}
            sub="Within district"
            accent={C.teal}
          />
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ChartCard
              title="Community Investment Trend"
              subtitle="Monthly (LKR millions)"
            >
              <AreaTrend
                data={investmentSeries}
                xKey="month"
                series={[{ key: "amount", name: "Investment", color: C.blue }]}
                height={280}
                unit="M"
              />
            </ChartCard>
          </div>
          <ChartCard title="Employment Breakdown" subtitle="By geography">
            <Donut data={employmentSplitDb} unit="%" />
          </ChartCard>
        </div>
      </section>

      <section data-export-block="true">
        <SectionLabel>Flagship Programmes & Impact</SectionLabel>
        {programsLoading ? (
          <Card className="p-6">
            <p className="text-sm font-semibold" style={{ color: C.text }}>
              Loading community programmes...
            </p>
            <p className="text-xs mt-1" style={{ color: C.subtext }}>
              Fetching programmes for the selected property and date range.
            </p>
          </Card>
        ) : groupedPrograms.length === 0 ? (
          noDataMessage(
            "Flagship Programmes & Impact",
            "Add rows to sustainability_community_programs",
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedPrograms.map((p) => (
              <Card key={p.title} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" style={{ color: C.primary }} />
                    <p className="text-sm font-bold" style={{ color: C.text }}>
                      {p.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {p.programType ? (
                      <span
                        className="text-[11px] px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: C.softGreen,
                          color: C.primary,
                        }}
                      >
                        {p.programType}
                      </span>
                    ) : null}
                    {p.status ? (
                      <span
                        className="text-[11px] px-2 py-1 rounded-full"
                        style={{ backgroundColor: C.bg, color: C.subtext }}
                      >
                        {p.status}
                      </span>
                    ) : null}
                  </div>
                  <div
                    className="rounded-lg px-3 py-2 mb-4"
                    style={{ backgroundColor: C.bg }}
                  >
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: C.subtext }}
                    >
                      {p.description}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: C.border }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: C.muted }}
                  >
                    Active Participants
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: C.primary }}
                  >
                    {p.participants}
                  </span>
                </div>
                <div
                  className="grid grid-cols-2 gap-3 mt-4 text-[11px]"
                  style={{ color: C.subtext }}
                >
                  <div
                    className="rounded-md px-3 py-2"
                    style={{ backgroundColor: C.bg }}
                  >
                    <p className="font-semibold" style={{ color: C.text }}>
                      {Number(p.volunteerHours).toFixed(0)}
                    </p>
                    <p>Volunteer hrs</p>
                  </div>
                  <div
                    className="rounded-md px-3 py-2"
                    style={{ backgroundColor: C.bg }}
                  >
                    <p className="font-semibold" style={{ color: C.text }}>
                      LKR {(p.investmentLkr / 1000000).toFixed(1)}M
                    </p>
                    <p>Investment</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Risk Management ──────────────────────────────────────────────────────────
const riskColor = (score: number) =>
  score >= 16
    ? C.red
    : score >= 10
      ? C.accentDark
      : score >= 5
        ? C.accent
        : C.primary;

function RiskHeatmap() {
  // 5x5 grid: x = probability, y = severity
  const cell = 52;
  const labels = [1, 2, 3, 4, 5];
  const cellRisks = (p: number, s: number) =>
    risks.filter((r) => r.probability === p && r.severity === s);
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex">
        {/* Y axis label */}
        <div className="flex flex-col items-center justify-center pr-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{
              color: C.subtext,
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            Severity →
          </span>
        </div>
        <div>
          <div className="flex">
            {/* grid */}
            <div className="flex flex-col">
              {[5, 4, 3, 2, 1].map((s) => (
                <div key={s} className="flex items-center">
                  <span
                    className="text-[10px] w-4 text-right mr-1"
                    style={{ color: C.muted }}
                  >
                    {s}
                  </span>
                  {labels.map((p) => {
                    const score = p * s;
                    const here = cellRisks(p, s);
                    return (
                      <div
                        key={p}
                        className="flex items-center justify-center m-0.5 rounded-md relative"
                        style={{
                          width: cell,
                          height: cell,
                          backgroundColor: `${riskColor(score)}${here.length ? "FF" : "22"}`,
                        }}
                      >
                        {here.map((r) => (
                          <span
                            key={r.id}
                            className="text-[10px] font-bold text-white px-1"
                          >
                            {r.id}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="flex">
                <span className="w-4 mr-1" />
                {labels.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] text-center"
                    style={{ width: cell, color: C.muted }}
                  >
                    {p}
                  </span>
                ))}
              </div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider text-center mt-1"
                style={{ color: C.subtext, marginLeft: 20 }}
              >
                Probability →
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RiskManagement({
  rows = [],
}: {
  rows?: Record<string, unknown>[];
}) {
  if (rows.length === 0) {
    return (
      <div>
        <section data-export-block="true">
          <PageHeader
            title="Risk Management"
            subtitle="Sustainability risk register and mitigation tracking"
          />
          {noDataMessage(
            "Risk Management",
            "Add rows to sustainability_risk_register_view",
          )}
        </section>
      </div>
    );
  }

  const highRiskCount = rows.filter((row) => row.risk_level === "High").length;
  const averageRiskScore =
    rows.length === 0 ? 0 : sumBy(rows, (row) => row.risk_score) / rows.length;
  const riskColor = (s: number) =>
    s >= 20 ? C.red : s >= 12 ? C.amber : s >= 8 ? C.primary : C.green;

  return (
    <div>
      <section data-export-block="true">
        <PageHeader
          title="Risk Management"
          subtitle="Sustainability risk register and mitigation tracking"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Total Risks"
            value={rows.length.toString()}
            sub="Tracked group-wide"
            accent={C.primary}
          />
          <StatTile
            label="High Risk Items"
            value={highRiskCount.toString()}
            sub="Requires attention"
            accent={C.red}
          />
          <StatTile
            label="Avg Risk Score"
            value={averageRiskScore.toFixed(1)}
            sub="Out of 100"
            accent={C.amber}
          />
        </div>
      </section>
    </div>
  );
}

// ── Sustainability Goals ─────────────────────────────────────────────────────
export function SustainabilityGoals({
  rows = [],
}: {
  rows?: Record<string, unknown>[];
}) {
  if (rows.length === 0) {
    return (
      <div>
        <section data-export-block="true">
          <PageHeader
            title="Sustainability Goals"
            subtitle="Strategic targets and progress tracking toward 2027–2030 commitments"
          />
          {noDataMessage(
            "Sustainability Goals",
            "Add rows to sustainability_goal_progress",
          )}
        </section>
      </div>
    );
  }

  const achieved = rows.filter(
    (row) => row.computed_status === "achieved",
  ).length;
  const atRisk = rows.filter((row) => row.computed_status === "at_risk").length;
  const avgProgress =
    rows.length === 0
      ? 0
      : sumBy(rows, (row) => row.progress_pct) / rows.length;

  return (
    <div>
      <section data-export-block="true">
        <PageHeader
          title="Sustainability Goals"
          subtitle="Strategic targets and progress tracking toward 2027–2030 commitments"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Active Goals"
            value={rows.length.toString()}
            sub="Group-wide targets"
            accent={C.primary}
          />
          <StatTile
            label="Achieved"
            value={achieved.toString()}
            sub="Meeting trajectory"
            accent={C.green}
          />
          <StatTile
            label="At Risk"
            value={atRisk.toString()}
            sub="Needs attention"
            accent={C.amber}
          />
          <StatTile
            label="Avg Progress"
            value={`${avgProgress.toFixed(1)}%`}
            sub="Overall average"
            accent={C.blue}
          />
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rows.map((g) => {
            const pct = Math.round(toNumber(g.progress_pct));
            const statusLevel =
              g.computed_status === "at_risk"
                ? "At Risk"
                : g.computed_status === "achieved"
                  ? "On Track"
                  : "On Track";
            const color =
              g.computed_status === "at_risk"
                ? C.amber
                : g.computed_status === "achieved"
                  ? C.green
                  : C.primary;
            return (
              <Card key={g.goal_name as string} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold" style={{ color: C.text }}>
                      {g.goal_name as string}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                      Target by {new Date(g.due_date as string).getFullYear()}
                    </p>
                  </div>
                  <SeverityPill level={statusLevel} />
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <p
                    className="text-3xl font-bold leading-none"
                    style={{ color: color }}
                  >
                    {toNumber(g.current_value)}
                  </p>
                  <p className="text-sm mb-0.5" style={{ color: C.muted }}>
                    / {toNumber(g.target_value)} target
                  </p>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px]" style={{ color: C.subtext }}>
                    Progress to target
                  </span>
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: color }}
                  >
                    {pct}%
                  </span>
                </div>
                <ProgressBar value={pct} color={color} />
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
function Toggle({ on }: { on: boolean }) {
  const [v, setV] = useState(on);
  return (
    <button
      onClick={() => setV(!v)}
      className="w-10 h-5 rounded-full transition-colors relative"
      style={{ backgroundColor: v ? C.primary : C.border }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: v ? 22 : 2 }}
      />
    </button>
  );
}

export function Settings() {
  const notifs = [
    { label: "Leakage detection alerts", on: true },
    { label: "Risk escalation notifications", on: true },
    { label: "Goal milestone reminders", on: true },
    { label: "Weekly ESG digest email", on: false },
    { label: "Supplier rating changes", on: false },
  ];
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Dashboard preferences, data sources and notifications"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4" style={{ color: C.primary }} />
            <p className="text-sm font-bold" style={{ color: C.text }}>
              Account
            </p>
          </div>
          <div className="space-y-3 text-sm">
            {[
              ["Organisation", "Jetwing Symphony PLC"],
              ["Reporting Standard", "GRI Standards 2021"],
              ["Base Currency", "LKR (Sri Lankan Rupee)"],
              ["Fiscal Year Start", "April"],
              ["Emission Factor Set", "DEFRA 2024 / IPCC AR6"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between py-2 border-b"
                style={{ borderColor: C.border }}
              >
                <span style={{ color: C.subtext }}>{k}</span>
                <span className="font-semibold" style={{ color: C.text }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4" style={{ color: C.primary }} />
            <p className="text-sm font-bold" style={{ color: C.text }}>
              Notifications
            </p>
          </div>
          <div className="space-y-1">
            {notifs.map((n) => (
              <div
                key={n.label}
                className="flex items-center justify-between py-2.5 border-b"
                style={{ borderColor: C.border }}
              >
                <span className="text-sm" style={{ color: C.text }}>
                  {n.label}
                </span>
                <Toggle on={n.on} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal
              className="w-4 h-4"
              style={{ color: C.primary }}
            />
            <p className="text-sm font-bold" style={{ color: C.text }}>
              Display Preferences
            </p>
          </div>
          <div className="space-y-1">
            {[
              ["Show AI insights on overview", true],
              ["Compact KPI cards", false],
              ["Default to last 12 months", true],
              ["Highlight at-risk metrics", true],
            ].map(([label, on]) => (
              <div
                key={label as string}
                className="flex items-center justify-between py-2.5 border-b"
                style={{ borderColor: C.border }}
              >
                <span className="text-sm" style={{ color: C.text }}>
                  {label as string}
                </span>
                <Toggle on={on as boolean} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>
            Data Sources
          </p>
          <div className="space-y-2">
            {[
              ["Building Management Systems", "Connected", C.green],
              ["Smart Energy Meters", "Connected", C.green],
              ["Water Flow Sensors", "Connected", C.green],
              ["Procurement / ERP", "Connected", C.green],
              ["Carbon Accounting Engine", "Syncing", C.accent],
            ].map(([name, status, color]) => (
              <div
                key={name as string}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                style={{ backgroundColor: C.bg }}
              >
                <span className="text-sm font-medium" style={{ color: C.text }}>
                  {name as string}
                </span>
                <span
                  className="flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: color as string }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color as string }}
                  />
                  {status as string}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function EsgReports({
  esgRows = [],
  governanceRows = [],
}: {
  esgRows?: Record<string, unknown>[];
  governanceRows?: Record<string, unknown>[];
}) {
  if (governanceRows.length === 0) {
    return (
      <div>
        <section data-export-block="true">
          <PageHeader
            title="ESG Reports & Compliance"
            subtitle="Framework alignment, disclosures and governance documentation"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatTile
              label="Overall ESG Score"
              value="87"
              sub="Rating: AA"
              accent={C.primary}
            />
            <StatTile
              label="Frameworks"
              value="5"
              sub="Aligned or mapped"
              accent={C.blue}
            />
            <StatTile
              label="Published Reports"
              value="3"
              sub="FY 24/25"
              accent={C.teal}
            />
            <StatTile
              label="Compliance"
              value="94%"
              sub="Mandatory disclosures"
              accent={C.green}
            />
          </div>
        </section>

        <section data-export-block="true">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <ChartCard
              title="Pillar Breakdown"
              subtitle="E, S and G sub-scores"
            >
              <HBar
                data={esgPillars}
                dataKey="score"
                color={C.primary}
                perBarColor
                height={220}
              />
            </ChartCard>
            <div className="lg:col-span-2">
              <ChartCard
                title="Framework Alignment"
                subtitle="Standard mapping coverage"
              >
                <div className="space-y-4">
                  {complianceFrameworks.map((f) => (
                    <div key={f.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: C.text }}
                        >
                          {f.name}
                        </span>
                        <span className="text-xs" style={{ color: C.subtext }}>
                          {f.status} · {f.coverage}%
                        </span>
                      </div>
                      <ProgressBar
                        value={f.coverage}
                        color={f.coverage > 80 ? C.green : C.primary}
                      />
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </div>
        </section>

        <section data-export-block="true">
          <SectionLabel>Reporting Centre</SectionLabel>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr
                    style={{
                      backgroundColor: C.bg,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {["Report Name", "Type", "Period", "Updated", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: C.subtext }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: C.border }}>
                  {reports.map((r: ReportRow) => (
                    <tr key={r.name}>
                      <td
                        className="py-3 px-4 font-semibold"
                        style={{ color: C.text }}
                      >
                        {r.name}
                      </td>
                      <td className="py-3 px-4" style={{ color: C.subtext }}>
                        {r.type}
                      </td>
                      <td
                        className="py-3 px-4 font-medium"
                        style={{ color: C.text }}
                      >
                        {r.period}
                      </td>
                      <td className="py-3 px-4" style={{ color: C.subtext }}>
                        {new Date(r.updated).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <SeverityPill
                          level={
                            r.status === "Published"
                              ? "On Track"
                              : r.status === "Draft"
                                ? "At Risk"
                                : "Behind"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>
    );
  }

  const latestGov = [...governanceRows].sort(
    (a, b) => toNumber(b.report_year) - toNumber(a.report_year),
  )[0];
  const policyScore = latestGov?.policy_disclosure_score || 0;
  const govScore = latestGov?.governance_score || 0;

  const latestEsg =
    esgRows.length > 0
      ? [...esgRows].sort((a, b) => {
          const yearDiff = toNumber(b.report_year) - toNumber(a.report_year);
          if (yearDiff !== 0) return yearDiff;
          return toNumber(b.report_month) - toNumber(a.report_month);
        })[0]
      : null;

  const dbEsgPillars = latestEsg
    ? [
        {
          name: "Environmental",
          score: toNumber(latestEsg.environmental_score),
          color: C.primary,
        },
        {
          name: "Social",
          score: toNumber(latestEsg.social_score),
          color: C.blue,
        },
        {
          name: "Governance",
          score: toNumber(latestEsg.governance_score),
          color: C.accent,
        },
      ]
    : esgPillars;

  const overallEsg = latestEsg ? toNumber(latestEsg.overall_score) : 87;

  return (
    <div>
      <section data-export-block="true">
        <PageHeader
          title="ESG Reports & Compliance"
          subtitle="Framework alignment, disclosures and governance documentation"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Overall ESG Score"
            value={overallEsg.toFixed(0)}
            sub={latestEsg ? "Calculated score" : "Rating: AA"}
            accent={C.primary}
          />
          <StatTile
            label="Governance Score"
            value={toNumber(govScore).toFixed(0)}
            sub="Out of 100"
            accent={C.blue}
          />
          <StatTile
            label="Policy Disclosure"
            value={toNumber(policyScore).toFixed(0)}
            sub="Out of 100"
            accent={C.teal}
          />
          <StatTile
            label="High Risk Items"
            value={(latestGov?.high_risk_count || 0).toString()}
            sub="From risk register"
            accent={C.red}
          />
        </div>
      </section>

      <section data-export-block="true">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ChartCard title="Pillar Breakdown" subtitle="E, S and G sub-scores">
            <HBar
              data={dbEsgPillars}
              dataKey="score"
              color={C.primary}
              perBarColor
              height={220}
            />
          </ChartCard>
          <div className="lg:col-span-2">
            <ChartCard
              title="Framework Alignment"
              subtitle="Standard mapping coverage"
            >
              <div className="space-y-4">
                {complianceFrameworks.map((f) => (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: C.text }}
                      >
                        {f.name}
                      </span>
                      <span className="text-xs" style={{ color: C.subtext }}>
                        {f.status} · {f.coverage}%
                      </span>
                    </div>
                    <ProgressBar
                      value={f.coverage}
                      color={f.coverage > 80 ? C.green : C.primary}
                    />
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      </section>

      <section data-export-block="true">
        <SectionLabel>Reporting Centre</SectionLabel>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr
                  style={{
                    backgroundColor: C.bg,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {["Report Name", "Type", "Period", "Updated", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: C.subtext }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: C.border }}>
                {reports.map((r: ReportRow) => (
                  <tr key={r.name}>
                    <td
                      className="py-3 px-4 font-semibold"
                      style={{ color: C.text }}
                    >
                      {r.name}
                    </td>
                    <td className="py-3 px-4" style={{ color: C.subtext }}>
                      {r.type}
                    </td>
                    <td
                      className="py-3 px-4 font-medium"
                      style={{ color: C.text }}
                    >
                      {r.period}
                    </td>
                    <td className="py-3 px-4" style={{ color: C.subtext }}>
                      {new Date(r.updated).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityPill
                        level={
                          r.status === "Published"
                            ? "On Track"
                            : r.status === "Draft"
                              ? "At Risk"
                              : "Behind"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
