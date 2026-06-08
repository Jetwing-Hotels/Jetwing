import { NextResponse } from "next/server";
import type { ArticleSummary } from "@/lib/sustainability/insights";
import { filterValidArticleSummaries } from "@/lib/sustainability/news";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") || "Sri Lanka sustainability hotels";
  const limit = Math.min(Number(searchParams.get("limit") || 5), 20);

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "News API key not configured" },
      { status: 500 }
    );
  }

  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("pageSize", String(limit));

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `NewsAPI returned ${response.status}`
      );
    }

    const data = await response.json();

    const articles: ArticleSummary[] = (data.articles || []).map((article: any) => ({
      title: article.title || "Untitled",
      source: article.source?.name || "Unknown",
      publishedAt: article.publishedAt || new Date().toISOString(),
      description: article.description || "",
      url: article.url || "",
      image: article.urlToImage || undefined,
    }));

    const validArticles = await filterValidArticleSummaries(articles);

    return NextResponse.json(
      { data: validArticles },
      {
        headers: {
          "Cache-Control": "public, max-age=600",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch news";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
