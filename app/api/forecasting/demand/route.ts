import { forecastOccupancy, detectAnomalies, forecastRevenue } from '@/lib/forecasting-algorithms';

/**
 * API handler for GET /api/forecasting/demand
 * Returns demand forecasts for multiple horizons
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const horizon = searchParams.get('horizon') || '30';

    // Mock historical data - In production, fetch from database
    const mockHistoricalData = [
      { date: '2024-05-01', occupancy: 72, demand: 0.65, dayOfWeek: 2, isHoliday: false },
      { date: '2024-05-02', occupancy: 75, demand: 0.68, dayOfWeek: 3, isHoliday: false },
      { date: '2024-05-03', occupancy: 82, demand: 0.78, dayOfWeek: 4, isHoliday: false },
      { date: '2024-05-04', occupancy: 65, demand: 0.55, dayOfWeek: 5, isHoliday: false },
      { date: '2024-05-05', occupancy: 60, demand: 0.48, dayOfWeek: 6, isHoliday: false },
      { date: '2024-05-06', occupancy: 68, demand: 0.58, dayOfWeek: 0, isHoliday: false },
      { date: '2024-05-07', occupancy: 78, demand: 0.68, dayOfWeek: 1, isHoliday: false }
    ];

    const forecasts = forecastOccupancy(mockHistoricalData, parseInt(horizon));

    return Response.json({
      success: true,
      forecasts,
      horizon: `${horizon}-day`,
      propertyId
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to fetch forecasts' },
      { status: 500 }
    );
  }
}
