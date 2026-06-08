// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function toMonthIndex(year: number, month: number) {
  return year * 12 + (month - 1);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const startYear = Number(searchParams.get("startYear"));
  const startMonth = Number(searchParams.get("startMonth"));
  const endYear = Number(searchParams.get("endYear"));
  const endMonth = Number(searchParams.get("endMonth"));

  try {
    let query = (await createAdminClient())
      .from("sustainability_community_programs")
      .select("*")
      .order("report_year", { ascending: true })
      .order("report_month", { ascending: true })
      .order("program_name", { ascending: true });

    if (propertyId && propertyId !== "all") {
      query = query.eq("property_id", propertyId);
    }

    if (
      Number.isFinite(startYear) &&
      Number.isFinite(startMonth) &&
      Number.isFinite(endYear) &&
      Number.isFinite(endMonth)
    ) {
      const lower = toMonthIndex(startYear, startMonth);
      const upper = toMonthIndex(endYear, endMonth);

      query = query.gte("report_year", Math.floor(lower / 12));
      query = query.lte("report_year", Math.floor(upper / 12));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const filtered = (data ?? []).filter((row) => {
      if (
        !Number.isFinite(startYear) ||
        !Number.isFinite(startMonth) ||
        !Number.isFinite(endYear) ||
        !Number.isFinite(endMonth)
      ) {
        return true;
      }

      const period = toMonthIndex(Number(row.report_year), Number(row.report_month));
      return period >= toMonthIndex(startYear, startMonth) && period <= toMonthIndex(endYear, endMonth);
    });

    return NextResponse.json({ data: filtered });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}