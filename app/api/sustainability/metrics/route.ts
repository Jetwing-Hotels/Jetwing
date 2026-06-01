import { calculateAllMetrics, generateRecommendations } from '@/lib/sustainability-metrics';

/**
 * API handler for GET /api/sustainability/metrics
 * Returns ESG metrics and scores
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const granularity = searchParams.get('granularity') || 'daily';

    // Mock resource data - In production, fetch from IoT sensors/database
    const mockResourceData = {
      electricityKWh: 450,
      waterLiters: 1200,
      wasteKg: 85,
      recycledKg: 72,
      renewableEnergyKWh: 280,
      guestNights: 145
    };

    const metrics = calculateAllMetrics(mockResourceData);
    const recommendations = generateRecommendations(metrics);

    return Response.json({
      success: true,
      metrics,
      recommendations,
      propertyId,
      granularity,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to fetch sustainability metrics' },
      { status: 500 }
    );
  }
}

/**
 * API handler for POST /api/sustainability/log-resources
 * Logs resource consumption data
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, electricityKWh, waterLiters, wasteKg, recycledKg, renewableEnergyKWh } = body;

    // Validation
    if (!propertyId || electricityKWh === undefined) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate metrics
    const metrics = calculateAllMetrics({
      electricityKWh,
      waterLiters: waterLiters || 0,
      wasteKg: wasteKg || 0,
      recycledKg: recycledKg || 0,
      renewableEnergyKWh: renewableEnergyKWh || 0,
      guestNights: 100 // Mock value
    });

    // In production, save to database
    return Response.json({
      success: true,
      message: 'Resource data logged successfully',
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to log resource data' },
      { status: 500 }
    );
  }
}
