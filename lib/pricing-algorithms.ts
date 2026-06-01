/**
 * Dynamic Pricing Algorithm Utilities
 * Calculates optimal room rates based on multiple factors
 */

interface PricingInput {
  baseRate: number;
  occupancyRate: number;
  dayOfWeek: number;
  seasonality: number;
  competitorRate: number;
  bookingWindowDays: number;
  demand: number;
}

interface PricingOutput {
  recommendedRate: number;
  confidence: number;
  reasoning: string;
}

/**
 * Main pricing optimization function
 * Factors: occupancy, seasonality, competition, demand patterns
 */
export function calculateOptimalPrice(input: PricingInput): PricingOutput {
  const {
    baseRate,
    occupancyRate,
    dayOfWeek,
    seasonality,
    competitorRate,
    bookingWindowDays,
    demand
  } = input;

  // Occupancy factor (0.7 to 1.3)
  const occupancyFactor = 0.7 + (occupancyRate / 100) * 0.6;

  // Seasonality factor (0.8 to 1.5)
  const seasonalityFactor = seasonality;

  // Competition factor (0.85 to 1.15)
  const competitionFactor = competitorRate ? 0.85 + (competitorRate / (baseRate * 1.5)) * 0.3 : 1.0;

  // Booking window factor (last-minute boost)
  const bookingWindowFactor = bookingWindowDays < 3 ? 1.2 : bookingWindowDays < 7 ? 1.1 : 1.0;

  // Demand factor
  const demandFactor = 1.0 + (demand - 0.5);

  // Combine factors
  const recommendedRate = Math.round(
    baseRate * occupancyFactor * seasonalityFactor * competitionFactor * bookingWindowFactor * demandFactor
  );

  // Calculate confidence (0-100)
  const confidence = Math.min(95, 70 + (occupancyRate * 0.3));

  let reasoning = 'Optimized based on ';
  const factors = [];

  if (occupancyRate > 80) factors.push('high occupancy');
  if (seasonalityFactor > 1.2) factors.push('peak season');
  if (competitionFactor > 1.05) factors.push('competitor pricing');
  if (bookingWindowDays < 7) factors.push('short booking window');
  if (demand > 0.7) factors.push('strong demand');

  reasoning += factors.join(', ') || 'market conditions';

  return {
    recommendedRate,
    confidence: Math.round(confidence),
    reasoning
  };
}

/**
 * Calculate price elasticity
 */
export function calculateElasticity(basePrice: number, pricePoints: number[] = []) {
  if (!Array.isArray(pricePoints) || pricePoints.length === 0) {
    pricePoints = [
      basePrice * 0.7,
      basePrice * 0.85,
      basePrice,
      basePrice * 1.15,
      basePrice * 1.3,
      basePrice * 1.5
    ];
  }

  return pricePoints.map((price, idx) => ({
    price,
    occupancy: Math.max(10, 95 - idx * 15),
    elasticity: ((95 - idx * 15) / 95) * ((basePrice / price) - 1)
  }));
}

/**
 * ADR (Average Daily Rate) calculation
 */
export function calculateADR(totalRevenue: number, totalNights: number): number {
  return totalNights > 0 ? Math.round(totalRevenue / totalNights) : 0;
}

/**
 * RevPAR (Revenue Per Available Room) calculation
 */
export function calculateRevPAR(totalRevenue: number, availableRooms: number, totalNights: number): number {
  const totalAvailableRoomNights = availableRooms * totalNights;
  return totalAvailableRoomNights > 0 ? Math.round(totalRevenue / totalAvailableRoomNights) : 0;
}

/**
 * GOPPAR (Gross Operating Profit Per Available Room)
 */
export function calculateGOPPAR(gopTotal: number, availableRooms: number): number {
  return availableRooms > 0 ? Math.round(gopTotal / availableRooms) : 0;
}
