/**
 * Demand Forecasting Algorithm Utilities
 * Predicts occupancy and demand patterns
 */

export interface HistoricalData {
  date: string;
  occupancy: number;
  demand: number;
  dayOfWeek: number;
  isHoliday: boolean;
}

export interface ForecastOutput {
  date: string;
  occupancy: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  demandSegments: {
    leisure: number;
    corporate: number;
    mice: number;
  };
}

/**
 * Simple exponential smoothing with trend
 */
export function forecastOccupancy(historicalData: HistoricalData[], days: number = 30): ForecastOutput[] {
  const alpha = 0.3; // Smoothing factor
  const beta = 0.1; // Trend factor

  if (historicalData.length === 0) return [];

  const avgOccupancy = historicalData.reduce((sum, d) => sum + d.occupancy, 0) / historicalData.length;
  
  // Calculate trend
  const recentAvg = historicalData.slice(-7).reduce((sum, d) => sum + d.occupancy, 0) / 7;
  const earlyAvg = historicalData.slice(0, 7).reduce((sum, d) => sum + d.occupancy, 0) / 7;
  const trend = (recentAvg - earlyAvg) / 7;

  const forecasts: ForecastOutput[] = [];

  for (let i = 0; i < days; i++) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + i);

    // Add seasonality and day-of-week effect
    const dayOfWeek = baseDate.getDay(); // 0-6
    const dayEffect = dayOfWeek === 5 || dayOfWeek === 6 ? 1.15 : 0.95;
    
    const predictedOccupancy = Math.min(100, Math.max(40, avgOccupancy + trend * i * dayEffect));
    
    // Higher confidence for near-term, lower for far-term
    const daysAhead = i;
    const confidence = Math.max(60, 95 - daysAhead * 0.5);

    // Segment demand
    const leisureRatio = dayOfWeek === 5 || dayOfWeek === 6 ? 0.6 : 0.4;
    const corporateRatio = 0.3;
    const miceRatio = 0.1;

    forecasts.push({
      date: baseDate.toISOString().split('T')[0],
      occupancy: Math.round(predictedOccupancy),
      confidence: Math.round(confidence),
      trend: predictedOccupancy > avgOccupancy ? 'up' : predictedOccupancy < avgOccupancy ? 'down' : 'stable',
      demandSegments: {
        leisure: Math.round(predictedOccupancy * leisureRatio),
        corporate: Math.round(predictedOccupancy * corporateRatio),
        mice: Math.round(predictedOccupancy * miceRatio)
      }
    });
  }

  return forecasts;
}

/**
 * Detect anomalies in demand
 */
export function detectAnomalies(historicalData: HistoricalData[], threshold: number = 2.0) {
  if (historicalData.length < 3) return [];

  const occupied = historicalData.map(d => d.occupancy);
  const mean = occupied.reduce((a, b) => a + b) / occupied.length;
  const variance = occupied.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / occupied.length;
  const stdDev = Math.sqrt(variance);

  return historicalData
    .map((d, idx) => ({
      ...d,
      zScore: Math.abs((d.occupancy - mean) / stdDev),
      isAnomaly: Math.abs((d.occupancy - mean) / stdDev) > threshold
    }))
    .filter(d => d.isAnomaly);
}

/**
 * Calculate booking lead time patterns
 */
export function calculateLeadTimePattern(bookings: Array<{ bookingDate: string; checkInDate: string }>) {
  interface LeadTimeBucket {
    range: string;
    count: number;
    percentage: number;
  }

  const leadTimes: LeadTimeBucket[] = [];
  const buckets = [
    { range: '0-3 days', min: 0, max: 3 },
    { range: '4-7 days', min: 4, max: 7 },
    { range: '8-14 days', min: 8, max: 14 },
    { range: '15-30 days', min: 15, max: 30 },
    { range: '30+ days', min: 31, max: Infinity }
  ];

  const leadTimeCounts = bookings.map(b => {
    const bookDate = new Date(b.bookingDate);
    const checkDate = new Date(b.checkInDate);
    return Math.floor((checkDate.getTime() - bookDate.getTime()) / (1000 * 60 * 60 * 24));
  });

  buckets.forEach(bucket => {
    const count = leadTimeCounts.filter(lt => lt >= bucket.min && lt <= bucket.max).length;
    leadTimes.push({
      range: bucket.range,
      count,
      percentage: (count / bookings.length) * 100
    });
  });

  return leadTimes;
}

/**
 * Forecast revenue based on occupancy
 */
export function forecastRevenue(occupancyForecasts: ForecastOutput[], avgADR: number, rooms: number) {
  return occupancyForecasts.map(forecast => {
    const occupiedRooms = (forecast.occupancy / 100) * rooms;
    const revenue = occupiedRooms * avgADR;
    
    return {
      date: forecast.date,
      occupancy: forecast.occupancy,
      revenue: Math.round(revenue),
      confidence: forecast.confidence
    };
  });
}
