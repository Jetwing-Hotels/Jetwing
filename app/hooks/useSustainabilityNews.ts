import { useEffect, useState } from "react";
import type { ArticleSummary } from "@/lib/sustainability/insights";

type Params = {
  query?: string;
  limit?: number;
};

export function useSustainabilityNews(params?: Params) {
  const [data, setData] = useState<ArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      try {
        setIsLoading(true);
        setError(null);

        const query = new URLSearchParams();
        if (params?.query) query.set("q", params.query);
        if (params?.limit) query.set("limit", String(params.limit));

        const response = await fetch(`/api/sustainability/news?${query}`);

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to load sustainability news.");
        }

        const body = await response.json();

        if (!cancelled) {
          setData(body.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setData([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadNews();

    return () => {
      cancelled = true;
    };
  }, [params?.query, params?.limit]);

  return { data, isLoading, error };
}
