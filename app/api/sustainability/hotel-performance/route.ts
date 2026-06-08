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

    const { data, error } = await supabase.rpc(
      // cast the function name to any to satisfy the generated RPC name union types
      ("get_sustainability_hotel_performance_comparison" as any),
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

    const rows = (data ?? []).map((row: any) => ({
      rank: toNumber(row.rank_position),
      name: row.name,
      score: toNumber(row.score),
      energy: toNumber(row.energy),
      water: toNumber(row.water),
      carbon: toNumber(row.carbon),
      community: toNumber(row.community),
      esg: row.esg ?? "D",
      rankingScore: toNumber(row.ranking_score),
    }));

    return NextResponse.json({ rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}