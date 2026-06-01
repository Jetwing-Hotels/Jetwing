import { calculateRevPAR, calculateADR, calculateGOPPAR } from '@/lib/pricing-algorithms';

/**
 * API handler for GET /api/revenue/metrics
 * Returns revenue KPIs
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, dateRange, breakdown } = body;

    // Mock financial data - In production, fetch from PMS/accounting
    const mockRevenueData = {
      propertyId,
      dateRange,
      breakdown: breakdown || 'property',
      metrics: [
        {
          property: 'Jetwing Colombo Seven',
          totalRevenue: 3500000,
          totalNights: 145,
          availableRooms: 50,
          adresse: 12100,
          revpar: 17500,
          goppar: 12500,
          occupancy: 85,
          trend: 'up'
        },
        {
          property: 'Jetwing Yala',
          totalRevenue: 4400000,
          totalNights: 125,
          availableRooms: 60,
          adr: 22000,
          revpar: 18333,
          goppar: 18400,
          occupancy: 78,
          trend: 'up'
        },
        {
          property: 'Jetwing Lake',
          totalRevenue: 2130000,
          totalNights: 100,
          availableRooms: 40,
          adr: 14200,
          revpar: 10875,
          goppar: 9200,
          occupancy: 72,
          trend: 'down'
        }
      ],
      period: 'May 2024'
    };

    return Response.json({
      success: true,
      data: mockRevenueData
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to fetch revenue metrics' },
      { status: 500 }
    );
  }
}

/**
 * API handler for POST /api/revenue/scenario-planning
 * Runs what-if analysis
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { scenarios } = body;

    if (!scenarios || !Array.isArray(scenarios)) {
      return Response.json(
        { success: false, error: 'Invalid scenarios format' },
        { status: 400 }
      );
    }

    // Process each scenario
    const results = scenarios.map(scenario => ({
      name: scenario.name,
      adrAdjustment: scenario.adrChange || 0,
      otaShift: scenario.otaShift || 0,
      estimatedImpact: (scenario.adrChange * 1.2) + (scenario.otaShift * 0.8),
      breakdown: {
        revenueGain: ((scenario.adrChange || 0) * 1.2) + 'M LKR',
        commissionSavings: ((scenario.otaShift || 0) * 0.8) + 'M LKR',
        netBenefit: ((scenario.adrChange * 1.2) + (scenario.otaShift * 0.8)) + 'M LKR'
      }
    }));

    return Response.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to run scenario analysis' },
      { status: 500 }
    );
  }
}
