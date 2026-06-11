// Shapes returned by the dashboard aggregate endpoints and consumed by the
// Executive Dashboard and Guest Analytics views.

export interface ExecutiveDashboard {
  period: string; // e.g. "April 2025"
  kpis: {
    totalRevenueLkr: number;
    revenueChangePct: number | null;
    avgRevparLkr: number;
    revparChangePct: number | null;
    occupancyPct: number;
    occupancyChangePct: number | null;
    repeatGuestPct: number;
    repeatChangePct: number | null;
  };
  trends: { month: string; revpar: number; occupancy: number }[];
  properties: { name: string; revpar: number; occupancy: number; trend: 'up' | 'down' | 'neutral' }[];
  // Full extent of available data (YYYY-MM), so the UI can bound/default the date pickers.
  availableRange: { min: string; max: string } | null;
}

export interface GuestAnalytics {
  kpis: {
    totalGuests: number;
    totalBookings: number;
    totalRevenueLkr: number;
    directBookings: number;
    otaBookings: number;
    futureBookings: number;
    newGuests: number;
    returningGuests: number;
  };
  growth: { month: string; guests: number }[];
  bookingSources: { month: string; Direct: number; OTA: number; TravelAgent: number; Other: number }[];
  revenueByHotel: { name: string; revenue: number }[];
  nationalities: { name: string; value: number }[];
}
