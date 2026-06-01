import { calculateOptimalPrice, calculateRevPAR, calculateADR, calculateGOPPAR } from '@/lib/pricing-algorithms';

/**
 * API handler for GET /api/dashboard/kpis
 * Returns key performance indicators for the dashboard
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyIds = searchParams.getAll('propertyId');
    const dateRange = searchParams.get('dateRange') || '30';

    // Mock data - In production, fetch from database
    const mockKPIs = {
      totalGroupRevenue: 'LKR 142.5M',
      averageRevPAR: 16840,
      groupOccupancy: 74.2,
      sustainabilityScore: 88,
      trend: {
        revenueChange: 12.5,
        revparChange: 8.2,
        occupancyChange: -2.4,
        sustainabilityChange: 4.1
      },
      properties: [
        {
          name: 'Jetwing Colombo Seven',
          revpar: 18500,
          occupancy: 85,
          trend: 'up'
        },
        {
          name: 'Jetwing Yala',
          revpar: 22000,
          occupancy: 78,
          trend: 'up'
        },
        {
          name: 'Jetwing Lake',
          revpar: 14200,
          occupancy: 72,
          trend: 'down'
        }
      ]
    };

    return Response.json({ success: true, data: mockKPIs });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}
