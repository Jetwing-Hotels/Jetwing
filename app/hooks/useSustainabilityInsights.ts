import { useState } from "react";
import type { ArticleSummary, Insight } from "@/lib/sustainability/insights";

export function useSustainabilityInsights() {
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async (
    metrics: Record<string, number>,
    articles: ArticleSummary[]
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/sustainability/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics, articles }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error ?? "Failed to generate sustainability insights."
        );
      }

      const body = await response.json();
      setInsights(body.data ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { insights, isLoading, error, generateInsights };
}
