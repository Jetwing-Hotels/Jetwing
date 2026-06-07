import { useEffect, useState } from "react";
import { C } from "@/components/sustainability/data";
type EsgPillar = {
  name: string;
  score: number;
  color: string;
};

export function useEsgPillars({
  propertyId,
  startYear,
  startMonth,
  endYear,
  endMonth,
}: {
  propertyId?: string | null;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}) {
  const [data, setData] = useState<EsgPillar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const query = new URLSearchParams({
          propertyId: propertyId ?? "all",
          startYear: String(startYear),
          startMonth: String(startMonth),
          endYear: String(endYear),
          endMonth: String(endMonth),
        });

        const response = await fetch(`/api/sustainability/esg-pillars?${query}`);

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to load ESG pillar scores.");
        }

        const body = await response.json();

        const pillars: EsgPillar[] = [
          {
            name: "Environmental",
            score: Math.round(Number(body.environmental_score ?? 0)),
            color: C.green,
          },
          {
            name: "Social",
            score: Math.round(Number(body.social_score ?? 0)),
            color: C.blue,
          },
          {
            name: "Governance",
            score: Math.round(Number(body.governance_score ?? 0)),
            color: C.accent,
          },
        ];

        if (!cancelled) {
          setData(pillars);
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

    load();

    return () => {
      cancelled = true;
    };
  }, [propertyId, startYear, startMonth, endYear, endMonth]);

  return { data, isLoading, error };
}