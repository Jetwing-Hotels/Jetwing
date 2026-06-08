"use client";

import React from "react";
import {
  Lightbulb,
  Leaf,
  Droplets,
  ShieldAlert,
  PiggyBank,
  Trophy,
  Sparkles,
  ExternalLink,
  Loader,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  C,
  KPIS,
  hotelPerformance,
  // aiInsights as staticInsights,
  esgPillars,
  type Insight,
  type HotelPerf,
} from "../data";
import { Card, KpiCard, SectionLabel, ProgressBar, PageHeader } from "../ui";
import { useSustainabilityKpis } from "@/app/hooks/useSustainabilityKpis";
import { useEsgPillars } from "@/app/hooks/useEsgPillars";
import { useHotelPerformanceComparison } from "@/app/hooks/useHotelPerformanceComparison";
import { useSustainabilityNews } from "@/app/hooks/useSustainabilityNews";
import { useSustainabilityInsights } from "@/app/hooks/useSustainabilityInsights";

const insightMeta: Record<
  Insight["type"],
  { icon: React.ElementType; color: string; tag: string }
> = {
  recommendation: { icon: Lightbulb, color: C.primary, tag: "Recommendation" },
  carbon: { icon: Leaf, color: C.green, tag: "Carbon Reduction" },
  resource: { icon: Droplets, color: C.blue, tag: "Resource Optimisation" },
  risk: { icon: ShieldAlert, color: C.red, tag: "Risk Prediction" },
  saving: { icon: PiggyBank, color: C.accent, tag: "Cost Saving" },
};

function InsightCard({ insight }: { insight: Insight }) {
  const m = insightMeta[insight.type];
  const Icon = m.icon;
  return (
    <div
      className="rounded-lg border p-4 bg-white"
      style={{ borderColor: C.border }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${m.color}1A` }}
        >
          <Icon className="w-4 h-4" style={{ color: m.color }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold" style={{ color: C.text }}>
              {insight.title}
            </p>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ color: m.color, backgroundColor: `${m.color}14` }}
            >
              {m.tag}
            </span>
          </div>
          <p
            className="text-xs mt-1.5 leading-relaxed"
            style={{ color: C.subtext }}
          >
            {insight.body}
          </p>
          <p className="text-xs mt-2 font-bold" style={{ color: m.color }}>
            Impact: {insight.impact}
          </p>
        </div>
      </div>
    </div>
  );
}

function NewsCard({
  title,
  source,
  publishedAt,
  description,
  url,
  image,
}: {
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  url: string;
  image?: string;
}) {
  const date = new Date(publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border p-3 bg-white hover:bg-opacity-75 transition-colors block h-full"
      style={{ borderColor: C.border }}
    >
      {image && (
        <div className="w-full h-32 bg-gray-200 rounded-md mb-3 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold" style={{ color: C.primary }}>
          {source}
        </p>
        <ExternalLink className="w-3 h-3 shrink-0" style={{ color: C.muted }} />
      </div>
      <p className="text-xs font-bold mb-1" style={{ color: C.text }}>
        {title}
      </p>
      <p className="text-xs line-clamp-2 mb-2" style={{ color: C.subtext }}>
        {description}
      </p>
      <p className="text-[10px]" style={{ color: C.muted }}>
        {date}
      </p>
    </a>
  );
}

const esgColor = (r: string) =>
  r === "AA"
    ? C.green
    : r === "A"
      ? C.primary
      : r === "BBB"
        ? C.accent
        : C.muted;

function ScoreBar({
  value,
  max = 100,
  color,
}: {
  value: number;
  max?: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full"
        style={{ backgroundColor: C.border }}
      >
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-xs font-semibold w-7 text-right"
        style={{ color: C.text }}
      >
        {value}
      </span>
    </div>
  );
}

export default function Overview({
  propertyId,
  startYear,
  startMonth,
  endYear,
  endMonth,
}: {
  propertyId?: string | null;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
}) {
  // const ranked = [...hotelPerformance].sort((a, b) => b.score - a.score);
  // Defaults when no props provided
  const now = new Date();
  const sYear = startYear ?? now.getFullYear();
  const sMonth = startMonth ?? 1;
  const eYear = endYear ?? now.getFullYear();
  const eMonth = endMonth ?? now.getMonth() + 1;
  const selectedPropertyId: string | undefined = propertyId ?? undefined;
  const [activeNewsIndex, setActiveNewsIndex] = React.useState(0);
  const {
    data: ranked,
    isLoading: rankedLoading,
    error: rankedError,
  } = useHotelPerformanceComparison({
    propertyId: selectedPropertyId,
    startYear: sYear,
    startMonth: sMonth,
    endYear: eYear,
    endMonth: eMonth,
  });
  const {
    data: esgPillars,
    isLoading: esgPillarsLoading,
    error: esgPillarsError,
  } = useEsgPillars({
    propertyId: selectedPropertyId,
    startYear: sYear,
    startMonth: sMonth,
    endYear: eYear,
    endMonth: eMonth,
  });
  const {
    data: KPIS,
    isLoading: kpisLoading,
    error: kpisError,
  } = useSustainabilityKpis({
    propertyId: selectedPropertyId,
    startYear: sYear,
    startMonth: sMonth,
    endYear: eYear,
    endMonth: eMonth,
  });

  const {
    data: newsArticles,
    isLoading: newsLoading,
    error: newsError,
  } = useSustainabilityNews({
    query: "Sri Lanka hotels sustainability",
    limit: 5,
  });

  const {
    insights: generatedInsights,
    isLoading: insightsLoading,
    error: insightsError,
    generateInsights,
  } = useSustainabilityInsights();

  const displayInsights = generatedInsights ?? [];
  // const displayInsights = generatedInsights
  //   ? [...generatedInsights, ...staticInsights]
  //   : staticInsights;

  React.useEffect(() => {
    setActiveNewsIndex((current) => {
      if (newsArticles.length === 0) {
        return 0;
      }

      return Math.min(current, newsArticles.length - 1);
    });
  }, [newsArticles.length]);

  const handleGenerateInsights = async () => {
    const metricsObj: Record<string, number> = {};
    KPIS.forEach((kpi) => {
      const value = parseFloat(kpi.value.replace(/,/g, ""));
      if (!Number.isNaN(value)) {
        metricsObj[kpi.label] = value;
      }
    });

    await generateInsights(
      metricsObj,
      newsArticles.map((a) => ({
        title: a.title,
        source: a.source,
        description: a.description,
        url: a.url,
        publishedAt: a.publishedAt,
      })),
    );
  };

  if (kpisLoading) {
    return (
      <div className="p-6 text-sm" style={{ color: C.subtext }}>
        Loading sustainability KPIs...
      </div>
    );
  }

  if (kpisError) {
    return <div>{kpisError}</div>;
  }
  const kpiColors = [
    C.green,
    C.primary,
    C.blue,
    C.accent,
    C.teal,
    C.primaryDark,
    C.primaryLight,
    C.purple,
    C.secondary,
    C.blueDark,
  ];

  const showHotelComparison =
    !selectedPropertyId || selectedPropertyId === "all";

  const displayNews = newsArticles[activeNewsIndex];

  const handlePreviousNews = () => {
    if (newsArticles.length <= 1) return;
    setActiveNewsIndex(
      (current) => (current - 1 + newsArticles.length) % newsArticles.length,
    );
  };

  const handleNextNews = () => {
    if (newsArticles.length <= 1) return;
    setActiveNewsIndex((current) => (current + 1) % newsArticles.length);
  };

  return (
    <div>
      <section data-export-block="true">
        <PageHeader
          title="Dashboard Overview"
          subtitle="Sustainability performance at a glance"
        />

        {newsError && (
          <div className="mb-4 p-3 rounded text-xs" style={{ color: C.red }}>
            {newsError}
          </div>
        )}

        {/* KPI grid */}
        <SectionLabel>Key Performance Indicators</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {KPIS.map((k, i) => (
            <KpiCard
              key={k.id}
              label={k.label}
              value={k.value}
              unit={k.rawUnit}
              delta={k.delta}
              dir={k.deltaDir}
              good={k.good}
              prev={k.prev}
              progress={k.progress ?? 0}
              target={k.target ?? ""}
              spark={k.spark}
              color={kpiColors[i % kpiColors.length]}
            />
          ))}
        </div>
      </section>

      <section data-export-block="true">
        {/* ESG pillars + news + AI insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="space-y-4">
            <SectionLabel>ESG Pillar Scores</SectionLabel>
            {esgPillarsLoading ? (
              <div className="text-sm" style={{ color: C.subtext }}>
                Loading ESG pillar scores...
              </div>
            ) : esgPillarsError ? (
              <div className="text-sm" style={{ color: C.red }}>
                {esgPillarsError}
              </div>
            ) : null}
            {esgPillars.map((p) => (
              <Card key={p.name} className="p-4" accent={p.color}>
                <div className="flex items-end justify-between">
                  <p className="text-sm font-bold" style={{ color: C.text }}>
                    {p.name}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: p.color }}>
                    {p.score}
                    <span className="text-sm" style={{ color: C.muted }}>
                      /100
                    </span>
                  </p>
                </div>

                <div className="mt-3">
                  <ProgressBar value={p.score} color={p.color} />
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: C.primary }} />
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: C.subtext }}
                  >
                    Latest Sustainability News
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePreviousNews}
                    disabled={newsLoading || newsArticles.length <= 1}
                    className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40"
                    style={{ borderColor: C.border, backgroundColor: "#fff" }}
                    aria-label="Previous news article"
                  >
                    <ChevronLeft
                      className="w-4 h-4"
                      style={{ color: C.text }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextNews}
                    disabled={newsLoading || newsArticles.length <= 1}
                    className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40"
                    style={{ borderColor: C.border, backgroundColor: "#fff" }}
                    aria-label="Next news article"
                  >
                    <ChevronRight
                      className="w-4 h-4"
                      style={{ color: C.text }}
                    />
                  </button>
                </div>
              </div>

              {newsLoading ? (
                <Card className="p-4 h-[300px] flex-1">
                  <div className="text-sm" style={{ color: C.subtext }}>
                    Loading latest sustainability news...
                  </div>
                </Card>
              ) : newsArticles.length > 0 && displayNews ? (
                <div className="space-y-3 h-[300px] flex flex-col">
                  <NewsCard
                    title={displayNews.title}
                    source={displayNews.source}
                    publishedAt={displayNews.publishedAt}
                    description={displayNews.description}
                    url={displayNews.url}
                    image={displayNews.image}
                  />
                  <div
                    className="flex items-center justify-between text-[11px] px-1 mt-auto"
                    style={{ color: C.muted }}
                  >
                    <span>
                      {activeNewsIndex + 1} of {newsArticles.length}
                    </span>
                    <span className="truncate">
                      Use the arrows to browse more news
                    </span>
                  </div>
                </div>
              ) : (
                <Card className="p-4 h-[300px] flex-1">
                  <div className="text-sm" style={{ color: C.subtext }}>
                    No sustainability news is available right now.
                  </div>
                </Card>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: C.primary }} />
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: C.subtext }}
                  >
                    AI Sustainability Insights
                  </p>
                </div>
                <button
                  onClick={handleGenerateInsights}
                  disabled={
                    insightsLoading || newsArticles.length === 0 || newsLoading
                  }
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: C.primary,
                    color: "#fff",
                  }}
                >
                  {insightsLoading ? (
                    <span className="flex items-center gap-1">
                      <Loader className="w-3 h-3 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    "Generate AI Insights"
                  )}
                </button>
              </div>

              {insightsError && (
                <div
                  className="mb-3 p-2 rounded text-xs"
                  style={{ color: C.red }}
                >
                  {insightsError}
                </div>
              )}

              <div
                className="rounded-xl border bg-white p-3 max-h-[300px] overflow-y-auto space-y-3"
                style={{ borderColor: C.border }}
              >
                {displayInsights.map((ins, i) => (
                  <InsightCard key={`${ins.title}-${i}`} insight={ins} />
                ))}
                {!displayInsights.length && (
                  <div className="text-sm p-2" style={{ color: C.subtext }}>
                    Generate insights to populate this panel.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showHotelComparison && (
        <section data-export-block="true">
          {/* Hotel comparison + ranking */}
          <SectionLabel>Hotel Performance Comparison & Ranking</SectionLabel>
          <Card className="overflow-hidden mb-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: C.bg }}>
                    {[
                      "Rank",
                      "Hotel",
                      "Sustainability",
                      "Energy Eff.",
                      "Water Eff.",
                      "Carbon (tCO₂)",
                      "Community",
                      "Internal ESG Grade",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: C.subtext }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((row: HotelPerf, i) => (
                    <tr
                      key={row.name}
                      style={{ borderTop: `1px solid ${C.border}` }}
                    >
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor:
                              i === 0 ? C.accent : i < 3 ? C.softGreen : C.bg,
                            color:
                              i === 0 ? "#fff" : i < 3 ? C.primary : C.subtext,
                          }}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 font-semibold"
                        style={{ color: C.text }}
                      >
                        {row.name}
                      </td>
                      <td className="py-3 px-4 w-40">
                        <ScoreBar value={row.score} color={C.primary} />
                      </td>
                      <td className="py-3 px-4 w-32">
                        <ScoreBar value={row.energy} color={C.accent} />
                      </td>
                      <td className="py-3 px-4 w-32">
                        <ScoreBar value={row.water} color={C.blue} />
                      </td>
                      <td
                        className="py-3 px-4 font-medium"
                        style={{ color: C.text }}
                      >
                        {row.carbon.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 w-32">
                        <ScoreBar value={row.community} color={C.teal} />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold"
                          style={{
                            color: esgColor(row.esg),
                            backgroundColor: `${esgColor(row.esg)}1A`,
                          }}
                        >
                          {row.esg}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs" style={{ color: C.muted }}>
            Ranking is weighted across sustainability score, resource
            efficiency, carbon footprint and community impact.
          </p>
        </section>
      )}
    </div>
  );
}
