import { useEffect, useState } from "react";

export type HotelPerf = {
  rank: number;
  name: string;
  score: number;
  energy: number;
  water: number;
  carbon: number;
  community: number;
  esg: string;
  rankingScore: number;
};

export function useHotelPerformanceComparison({
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
  const [data, setData] = useState<HotelPerf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
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

        const response = await fetch(
          `/api/sustainability/hotel-performance?${query}`
        );

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to load hotel comparison.");
        }

        const body = await response.json();

        if (!cancelled) {
          setData(body.rows ?? []);
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

    loadRows();

    return () => {
      cancelled = true;
    };
  }, [propertyId, startYear, startMonth, endYear, endMonth]);

  return { data, isLoading, error };
}