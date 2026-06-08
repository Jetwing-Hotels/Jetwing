import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const propertyId = searchParams.get("propertyId");
  const startYear = Number(searchParams.get("startYear") ?? 2025);
  const startMonth = Number(searchParams.get("startMonth") ?? 4);
  const endYear = Number(searchParams.get("endYear") ?? 2025);
  const endMonth = Number(searchParams.get("endMonth") ?? 4);

  try {
    const supabase = await createAdminClient();

    const { data, error } = await (supabase as any).rpc(
      "get_sustainability_esg_pillar_scores",
      {
        p_start_year: startYear,
        p_start_month: startMonth,
        p_end_year: endYear,
        p_end_month: endMonth,
        p_property_id: propertyId && propertyId !== "all" ? propertyId : null,
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = data?.[0] ?? {};

    return NextResponse.json({
      environmental_score: toNumber(row.environmental_score),
      social_score: toNumber(row.social_score),
      governance_score: toNumber(row.governance_score),
      overall_score: toNumber(row.overall_score),
      snapshot_count: toNumber(row.snapshot_count),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}