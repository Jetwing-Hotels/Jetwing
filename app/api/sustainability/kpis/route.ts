import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Kpi = {
  id: string;
  label: string;
  value: string;
  rawUnit: string;
  delta: string;
  deltaDir: "up" | "down";
  good: boolean;
  prev: string;
  progress?: number;
  target?: string;
  spark: number[];
};

const metricCodes = [
  "carbon_intensity",
  "carbon_reduction_pct",
  "energy_intensity",
  "renewable_share",
  "water_intensity",
  "waste_diversion_rate",
  "local_sourcing_rate",
  "community_programs",
  "overall_sustainability_score",
  "governance_score",
];

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compact(value: number, decimals = 1): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(value);
}

function integer(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function fixed(value: number, decimals = 1): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function toMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function fromMonthIndex(index: number): { year: number; month: number } {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month };
}

function shiftRangeBackByLength(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
) {
  const startIndex = toMonthIndex(startYear, startMonth);
  const endIndex = toMonthIndex(endYear, endMonth);
  const length = endIndex - startIndex + 1;

  if (length <= 0) {
    return null;
  }

  const previousEndIndex = startIndex - 1;
  const previousStartIndex = previousEndIndex - (length - 1);
  const twoPeriodsAgoEndIndex = previousStartIndex - 1;
  const twoPeriodsAgoStartIndex = twoPeriodsAgoEndIndex - (length - 1);

  return {
    current: {
      startYear,
      startMonth,
      endYear,
      endMonth,
    },
    previous: {
      ...fromMonthIndex(previousStartIndex),
      end: fromMonthIndex(previousEndIndex),
    },
    twoPeriodsAgo: {
      ...fromMonthIndex(twoPeriodsAgoStartIndex),
      end: fromMonthIndex(twoPeriodsAgoEndIndex),
    },
  };
}

function delta(
  current: number,
  previous: number,
  lowerIsBetter: boolean,
  suffix = "%"
): Pick<Kpi, "delta" | "deltaDir" | "good"> {
  if (!previous) {
    return {
      delta: "N/A",
      deltaDir: "up",
      good: false,
    };
  }

  const change = ((current - previous) / previous) * 100;
  const deltaDir = change >= 0 ? "up" : "down";
  const good = lowerIsBetter ? change <= 0 : change >= 0;
  const sign = change > 0 ? "+" : "";

  return {
    delta: `${sign}${change.toFixed(1)}${suffix}`,
    deltaDir,
    good,
  };
}

function deltaPoints(
  current: number,
  previous: number,
  higherIsBetter: boolean
): Pick<Kpi, "delta" | "deltaDir" | "good"> {
  const change = current - previous;
  const deltaDir = change >= 0 ? "up" : "down";
  const good = higherIsBetter ? change >= 0 : change <= 0;
  const sign = change > 0 ? "+" : "";

  return {
    delta: `${sign}${change.toFixed(1)} pts`,
    deltaDir,
    good,
  };
}

function normalizeScore(
  actualValue: number | null | undefined,
  worstValue: number | null | undefined,
  targetValue: number | null | undefined,
  higherIsBetter: boolean
): number | undefined {
  if (
    actualValue === null ||
    actualValue === undefined ||
    worstValue === null ||
    worstValue === undefined ||
    targetValue === null ||
    targetValue === undefined
  ) {
    return undefined;
  }

  if (targetValue === worstValue) return undefined;

  const rawScore = higherIsBetter
    ? ((actualValue - worstValue) / (targetValue - worstValue)) * 100
    : ((worstValue - actualValue) / (worstValue - targetValue)) * 100;

  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

function latestTargetByMetric(rows: any[]) {
  const map = new Map<string, any>();

  for (const row of rows ?? []) {
    const existing = map.get(row.metric_code);

    if (
      !existing ||
      new Date(row.effective_from).getTime() >
        new Date(existing.effective_from).getTime()
    ) {
      map.set(row.metric_code, row);
    }
  }

  return map;
}

function getProgress(
  targets: Map<string, any>,
  metricCode: string,
  actualValue: number | null | undefined
): number | undefined {
  const target = targets.get(metricCode);
  if (!target) return undefined;

  return normalizeScore(
    actualValue,
    toNumber(target.worst_value),
    toNumber(target.target_value),
    Boolean(target.higher_is_better)
  );
}

function targetText(
  targets: Map<string, any>,
  metricCode: string,
  unit: string
): string | undefined {
  const target = targets.get(metricCode);
  if (!target) return undefined;

  return `${toNumber(target.target_value).toLocaleString()} ${unit}`;
}

function periodLabel(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
) {
  return `${startYear}-${String(startMonth).padStart(2, "0")} to ${endYear}-${String(endMonth).padStart(2, "0")}`;
}

async function fetchSummary(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  propertyId: string | null
) {
  const { data, error } = await supabase.rpc(
    "get_sustainability_kpi_range_summary" as any,
    {
      p_start_year: startYear,
      p_start_month: startMonth,
      p_end_year: endYear,
      p_end_month: endMonth,
      p_property_id: propertyId && propertyId !== "all" ? propertyId : null,
    }
  );

  if (error) throw error;

  return data?.[0] ?? {};
}

function buildKpis({
  current,
  previous,
  twoYearsAgo,
  targets,
}: {
  current: any;
  previous: any;
  twoYearsAgo: any;
  targets: Map<string, any>;
}): Kpi[] {
  const currentCarbon = toNumber(current.total_scope1_2_tco2e);
  const previousCarbon = toNumber(previous.total_scope1_2_tco2e);
  const twoYearsAgoCarbon = toNumber(twoYearsAgo.total_scope1_2_tco2e);

  const carbonReductionPct =
    previousCarbon > 0
      ? ((previousCarbon - currentCarbon) / previousCarbon) * 100
      : 0;

  const previousCarbonReductionPct =
    twoYearsAgoCarbon > 0
      ? ((twoYearsAgoCarbon - previousCarbon) / twoYearsAgoCarbon) * 100
      : 0;

  return [
    {
      id: "carbon",
      label: "Total Carbon Emissions",
      value: fixed(currentCarbon, 1),
      rawUnit: "tCO₂e",
      ...delta(currentCarbon, previousCarbon, true),
      progress: getProgress(
        targets,
        "carbon_intensity",
        toNumber(current.carbon_intensity)
      ),
      target: targetText(
        targets,
        "carbon_intensity",
        "kgCO₂e per occupied room"
      ),
      prev: `${fixed(previousCarbon, 1)} tCO₂e previous period`,
      spark: [],
    },
    {
      id: "carbon-reduction",
      label: "Carbon Reduction",
      value: fixed(carbonReductionPct, 1),
      rawUnit: "%",
      ...deltaPoints(carbonReductionPct, previousCarbonReductionPct, true),
      prev: `${fixed(previousCarbonReductionPct, 1)}% previous period`,
      progress: getProgress(
        targets,
        "carbon_reduction_pct",
        carbonReductionPct
      ),
      target: targetText(targets, "carbon_reduction_pct", "%"),
      spark: [],
    },
    {
      id: "energy",
      label: "Total Energy Consumption",
      value: compact(toNumber(current.total_energy_kwh), 1),
      rawUnit: "kWh",
      ...delta(
        toNumber(current.total_energy_kwh),
        toNumber(previous.total_energy_kwh),
        true
      ),
      prev: `${compact(toNumber(previous.total_energy_kwh), 1)} kWh previous period`,
      progress: getProgress(
        targets,
        "energy_intensity",
        toNumber(current.energy_intensity)
      ),
      target: targetText(
        targets,
        "energy_intensity",
        "kWh per occupied room"
      ),
      spark: [],
    },
    {
      id: "solar",
      label: "Solar Energy Generated",
      value: compact(toNumber(current.solar_pv_kwh), 1),
      rawUnit: "kWh",
      ...delta(
        toNumber(current.solar_pv_kwh),
        toNumber(previous.solar_pv_kwh),
        false
      ),
      prev: `${compact(toNumber(previous.solar_pv_kwh), 1)} kWh previous period`,
      progress: getProgress(
        targets,
        "renewable_share",
        toNumber(current.renewable_share_pct)
      ),
      target: targetText(targets, "renewable_share", "% renewable energy"),
      spark: [],
    },
    {
      id: "water",
      label: "Water Consumption",
      value: compact(toNumber(current.total_water_l), 1),
      rawUnit: "Litres",
      ...delta(
        toNumber(current.total_water_l),
        toNumber(previous.total_water_l),
        true
      ),
      prev: `${compact(toNumber(previous.total_water_l), 1)} L previous period`,
      progress: getProgress(
        targets,
        "water_intensity",
        toNumber(current.water_intensity)
      ),
      target: targetText(
        targets,
        "water_intensity",
        "L per occupied room"
      ),
      spark: [],
    },
    {
      id: "waste",
      label: "Waste Recycled / Diverted",
      value: fixed(toNumber(current.waste_diversion_rate_pct), 1),
      rawUnit: "%",
      ...deltaPoints(
        toNumber(current.waste_diversion_rate_pct),
        toNumber(previous.waste_diversion_rate_pct),
        true
      ),
      prev: `${fixed(toNumber(previous.waste_diversion_rate_pct), 1)}% previous period`,
      progress: getProgress(
        targets,
        "waste_diversion_rate",
        toNumber(current.waste_diversion_rate_pct)
      ),
      target: targetText(targets, "waste_diversion_rate", "%"),
      spark: [],
    },
    {
      id: "sourcing",
      label: "Local Sourcing",
      value: fixed(toNumber(current.local_sourcing_rate_pct), 1),
      rawUnit: "%",
      ...deltaPoints(
        toNumber(current.local_sourcing_rate_pct),
        toNumber(previous.local_sourcing_rate_pct),
        true
      ),
      prev: `${fixed(toNumber(previous.local_sourcing_rate_pct), 1)}% previous period`,
      progress: getProgress(
        targets,
        "local_sourcing_rate",
        toNumber(current.local_sourcing_rate_pct)
      ),
      target: targetText(targets, "local_sourcing_rate", "%"),
      spark: [],
    },
    {
      id: "community",
      label: "Community Programmes",
      value: integer(toNumber(current.community_program_count)),
      rawUnit: "programmes",
      ...delta(
        toNumber(current.community_program_count),
        toNumber(previous.community_program_count),
        false
      ),
      prev: `${integer(toNumber(previous.community_program_count))} previous period`,
      progress: getProgress(
        targets,
        "community_programs",
        toNumber(current.community_program_count)
      ),
      target: targetText(targets, "community_programs", "programmes"),
      spark: [],
    },
    {
      id: "score",
      label: "Sustainability Score",
      value: fixed(toNumber(current.overall_score), 0),
      rawUnit: "/100",
      ...deltaPoints(
        toNumber(current.overall_score),
        toNumber(previous.overall_score),
        true
      ),
      prev: `${fixed(toNumber(previous.overall_score), 0)} previous period`,
      progress: getProgress(
        targets,
        "overall_sustainability_score",
        toNumber(current.overall_score)
      ),
      target: targetText(targets, "overall_sustainability_score", "/100"),
      spark: [],
    },
    {
      id: "esg",
      label: "ESG Compliance Score",
      value: fixed(toNumber(current.governance_score), 0),
      rawUnit: "/100",
      ...deltaPoints(
        toNumber(current.governance_score),
        toNumber(previous.governance_score),
        true
      ),
      prev: `${fixed(toNumber(previous.governance_score), 0)} previous period`,
      progress: getProgress(
        targets,
        "governance_score",
        toNumber(current.governance_score)
      ),
      target: targetText(targets, "governance_score", "/100"),
      spark: [],
    },
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const propertyId = searchParams.get("propertyId");
  const startYear = Number(searchParams.get("startYear") ?? 2025);
  const startMonth = Number(searchParams.get("startMonth") ?? 4);
  const endYear = Number(searchParams.get("endYear") ?? 2025);
  const endMonth = Number(searchParams.get("endMonth") ?? 4);

  if (
    !Number.isInteger(startYear) ||
    !Number.isInteger(startMonth) ||
    !Number.isInteger(endYear) ||
    !Number.isInteger(endMonth) ||
    startMonth < 1 ||
    startMonth > 12 ||
    endMonth < 1 ||
    endMonth > 12
  ) {
    return NextResponse.json(
      { error: "Invalid year or month filters." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createAdminClient();

    const ranges = shiftRangeBackByLength(
      startYear,
      startMonth,
      endYear,
      endMonth
    );

    if (!ranges) {
      return NextResponse.json(
        { error: "The selected date range is invalid." },
        { status: 400 }
      );
    }

    const current = await fetchSummary(
      supabase,
      ranges.current.startYear,
      ranges.current.startMonth,
      ranges.current.endYear,
      ranges.current.endMonth,
      propertyId
    );

    const previous = await fetchSummary(
      supabase,
      ranges.previous.year,
      ranges.previous.month,
      ranges.previous.end.year,
      ranges.previous.end.month,
      propertyId
    );

    const twoYearsAgo = await fetchSummary(
      supabase,
      ranges.twoPeriodsAgo.year,
      ranges.twoPeriodsAgo.month,
      ranges.twoPeriodsAgo.end.year,
      ranges.twoPeriodsAgo.end.month,
      propertyId
    );

    const endDate = `${ranges.current.endYear}-${String(
      ranges.current.endMonth
    ).padStart(2, "0")}-01`;

    const { data: targetRows, error: targetError } = await (supabase as any)
      .from("sustainability_metric_targets")
      .select(
        `
        metric_code,
        metric_name,
        higher_is_better,
        target_value,
        worst_value,
        effective_from,
        effective_to
      `
      )
      .in("metric_code", metricCodes)
      .eq("active", true)
      .lte("effective_from", endDate)
      .or(`effective_to.is.null,effective_to.gte.${endDate}`);

    if (targetError) {
      return NextResponse.json(
        { error: targetError.message },
        { status: 500 }
      );
    }

    const targets = latestTargetByMetric(targetRows ?? []);

    const kpis = buildKpis({
      current,
      previous,
      twoYearsAgo,
      targets,
    });

    return NextResponse.json({
      filters: {
        propertyId: propertyId ?? "all",
        startYear: ranges.current.startYear,
        startMonth: ranges.current.startMonth,
        endYear: ranges.current.endYear,
        endMonth: ranges.current.endMonth,
        previousPeriod: {
          start: periodLabel(
            ranges.previous.year,
            ranges.previous.month,
            ranges.previous.end.year,
            ranges.previous.end.month
          ),
          previous2: periodLabel(
            ranges.twoPeriodsAgo.year,
            ranges.twoPeriodsAgo.month,
            ranges.twoPeriodsAgo.end.year,
            ranges.twoPeriodsAgo.end.month
          ),
        },
      },
      summary: current,
      kpis,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}