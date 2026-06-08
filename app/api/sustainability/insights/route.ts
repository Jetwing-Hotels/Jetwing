import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filterValidArticleSummaries } from "@/lib/sustainability/news";
import type {
  ArticleSummary,
  InsightGenerationRequest,
  InsightGenerationResponse,
  Insight,
} from "@/lib/sustainability/insights";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getMetricValue(metrics: Record<string, number>, matcher: RegExp) {
  const entry = Object.entries(metrics).find(([label]) => matcher.test(label));
  return entry ? entry[1] : undefined;
}

function buildFallbackInsights(
  metrics: Record<string, number>,
  articles: ArticleSummary[]
): Insight[] {
  const carbon = getMetricValue(metrics, /carbon/i);
  const energy = getMetricValue(metrics, /energy/i);
  const water = getMetricValue(metrics, /water/i);
  const waste = getMetricValue(metrics, /waste/i);
  const community = getMetricValue(metrics, /community/i);
  const latestArticle = articles[0];

  const insights: Insight[] = [];

  if (carbon !== undefined) {
    insights.push({
      type: "carbon",
      title: "Keep carbon reduction momentum",
      body:
        `Current carbon emissions are ${formatNumber(carbon)}. Prioritize HVAC tuning, load shifting, and renewable procurement across the highest-intensity properties.`,
      impact: "Potential 5-8% emissions reduction",
    });
  }

  if (energy !== undefined) {
    insights.push({
      type: "resource",
      title: "Reduce energy demand at peak hours",
      body:
        `Energy consumption is ${formatNumber(energy)}. Schedule equipment optimization and occupancy-based controls to flatten the load curve.`,
      impact: "Lower utility spend and improved efficiency",
    });
  }

  if (water !== undefined) {
    insights.push({
      type: "resource",
      title: "Tighten water efficiency controls",
      body:
        `Water use is ${formatNumber(water)}. Expand leak detection, fixture audits, and reuse programs in high-demand sites.`,
      impact: "Reduced water loss and treatment cost",
    });
  }

  if (waste !== undefined) {
    insights.push({
      type: "saving",
      title: "Increase diversion from landfill",
      body:
        `Waste performance is ${formatNumber(waste)}. Improve segregation at source and route more organic waste into composting or biogas recovery.`,
      impact: "Lower disposal cost and stronger diversion rates",
    });
  }

  if (community !== undefined) {
    insights.push({
      type: "recommendation",
      title: "Link community spend to measurable outcomes",
      body:
        `Community programmes are tracking at ${formatNumber(community)}. Tie each initiative to guest engagement, local sourcing, or biodiversity outcomes for clearer reporting.`,
      impact: "Better ESG storytelling and stakeholder value",
    });
  }

  if (latestArticle) {
    insights.unshift({
      type: "recommendation",
      title: latestArticle.title,
      body:
        `${latestArticle.source} highlighted recent sustainability developments. Use this as a cue to review hotel operations and apply the most relevant actions locally.`,
      impact: "Improved responsiveness to industry trends",
    });
  }

  return insights.slice(0, 5);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { metrics, articles } = body as InsightGenerationRequest;

    if (!metrics || typeof metrics !== "object") {
      return NextResponse.json(
        { error: "Invalid request: metrics required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(articles)) {
      return NextResponse.json(
        { error: "Invalid request: articles must be an array" },
        { status: 400 }
      );
    }

    const validArticles = await filterValidArticleSummaries(articles);

    const admin = createAdminClient();
    const headers: Record<string, string> = {};

    if (process.env.EDGE_FUNCTION_SECRET) {
      headers["x-function-secret"] = process.env.EDGE_FUNCTION_SECRET;
    }

    const { data, error } = await (admin as any).functions.invoke(
      "generate-sustainability-insights",
      {
        body: { metrics, articles: validArticles },
        headers,
      }
    );

    if (error) {
      console.error("generate-sustainability-insights invoke failed", error);
      return NextResponse.json({
        data: buildFallbackInsights(metrics, validArticles),
      } satisfies InsightGenerationResponse);
    }

    if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
      return NextResponse.json({
        data: buildFallbackInsights(metrics, validArticles),
      } satisfies InsightGenerationResponse);
    }

    return NextResponse.json(data as InsightGenerationResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("generate-sustainability-insights route failed", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
