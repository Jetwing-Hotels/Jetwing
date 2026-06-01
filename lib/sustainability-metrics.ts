/**
 * Sustainability Metrics Calculation Utilities
 * ESG scoring and environmental impact tracking
 */

export interface ResourceData {
  electricityKWh: number;
  waterLiters: number;
  wasteKg: number;
  recycledKg: number;
  renewableEnergyKWh: number;
  guestNights: number;
}

export interface SustainabilityMetrics {
  energyIntensity: number;
  waterIntensity: number;
  wasteIntensity: number;
  wasteRecyclingRate: number;
  renewableEnergyPercentage: number;
  carbonFootprint: number;
  esgScore: number;
}

/**
 * Calculate energy intensity per guest night
 */
export function calculateEnergyIntensity(electricityKWh: number, guestNights: number): number {
  return guestNights > 0 ? Math.round((electricityKWh / guestNights) * 100) / 100 : 0;
}

/**
 * Calculate water intensity per guest night
 */
export function calculateWaterIntensity(waterLiters: number, guestNights: number): number {
  return guestNights > 0 ? Math.round((waterLiters / guestNights) * 100) / 100 : 0;
}

/**
 * Calculate waste intensity per guest night
 */
export function calculateWasteIntensity(wasteKg: number, guestNights: number): number {
  return guestNights > 0 ? Math.round((wasteKg / guestNights) * 100) / 100 : 0;
}

/**
 * Calculate waste diversion rate
 */
export function calculateWasteDiversion(wasteKg: number, recycledKg: number): number {
  const totalWaste = wasteKg + recycledKg;
  return totalWaste > 0 ? Math.round((recycledKg / totalWaste) * 100) : 0;
}

/**
 * Calculate renewable energy percentage
 */
export function calculateRenewablePercentage(renewableKWh: number, totalKWh: number): number {
  return totalKWh > 0 ? Math.round((renewableKWh / totalKWh) * 100) : 0;
}

/**
 * Calculate carbon footprint (kg CO2e per guest night)
 * Based on typical emission factors
 */
export function calculateCarbonFootprint(electricityKWh: number, waterLiters: number, wasteKg: number, renewableKWh: number, guestNights: number): number {
  if (guestNights === 0) return 0;

  // Emission factors (kg CO2e per unit)
  const gridElectricityCO2 = 0.65; // kg CO2e per kWh (typical for Sri Lanka grid)
  const waterCO2 = 0.0005; // kg CO2e per liter
  const wasteCO2 = 1.5; // kg CO2e per kg waste

  // Calculate non-renewable electricity
  const nonRenewableKWh = electricityKWh - renewableKWh;

  const electricityEmissions = nonRenewableKWh * gridElectricityCO2;
  const waterEmissions = waterLiters * waterCO2;
  const wasteEmissions = wasteKg * wasteCO2;

  const totalCO2e = electricityEmissions + waterEmissions + wasteEmissions;
  const perGuestNight = totalCO2e / guestNights;

  return Math.round(perGuestNight * 100) / 100;
}

/**
 * Calculate comprehensive ESG Score (0-100)
 */
export function calculateESGScore(metrics: Omit<SustainabilityMetrics, 'esgScore'>): number {
  let score = 50; // Base score

  // Energy efficiency (0-25 points)
  const energyScore = Math.max(0, Math.min(25, 25 - (metrics.energyIntensity / 5) * 25));
  
  // Water efficiency (0-20 points)
  const waterScore = Math.max(0, Math.min(20, 20 - (metrics.waterIntensity / 300) * 20));
  
  // Waste management (0-20 points)
  const wasteScore = Math.max(0, (metrics.wasteRecyclingRate / 100) * 20);
  
  // Renewable energy (0-20 points)
  const renewableScore = (metrics.renewableEnergyPercentage / 100) * 20;
  
  // Carbon footprint (0-15 points)
  const carbonScore = Math.max(0, Math.min(15, 15 - (metrics.carbonFootprint / 20) * 15));

  score = energyScore + waterScore + wasteScore + renewableScore + carbonScore;
  
  return Math.min(100, Math.round(score));
}

/**
 * Calculate all sustainability metrics
 */
export function calculateAllMetrics(data: ResourceData): SustainabilityMetrics {
  const energyIntensity = calculateEnergyIntensity(data.electricityKWh, data.guestNights);
  const waterIntensity = calculateWaterIntensity(data.waterLiters, data.guestNights);
  const wasteIntensity = calculateWasteIntensity(data.wasteKg, data.guestNights);
  const wasteRecyclingRate = calculateWasteDiversion(data.wasteKg, data.recycledKg);
  const renewableEnergyPercentage = calculateRenewablePercentage(data.renewableEnergyKWh, data.electricityKWh);
  const carbonFootprint = calculateCarbonFootprint(
    data.electricityKWh,
    data.waterLiters,
    data.wasteKg,
    data.renewableEnergyKWh,
    data.guestNights
  );

  const metricsWithoutScore = {
    energyIntensity,
    waterIntensity,
    wasteIntensity,
    wasteRecyclingRate,
    renewableEnergyPercentage,
    carbonFootprint
  };

  const esgScore = calculateESGScore(metricsWithoutScore);

  return {
    ...metricsWithoutScore,
    esgScore
  };
}

/**
 * Generate sustainability recommendations
 */
export function generateRecommendations(metrics: SustainabilityMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.energyIntensity > 4) {
    recommendations.push('Upgrade to LED lighting in guest rooms to reduce energy consumption by 15-20%');
  }

  if (metrics.waterIntensity > 150) {
    recommendations.push('Install low-flow showerheads and faucet aerators to reduce water usage by 20%');
  }

  if (metrics.wasteRecyclingRate < 70) {
    recommendations.push('Implement comprehensive waste segregation and recycling program for staff');
  }

  if (metrics.renewableEnergyPercentage < 50) {
    recommendations.push('Install additional solar panels to increase renewable energy generation');
  }

  if (metrics.esgScore < 70) {
    recommendations.push('Conduct ESG audit to identify other improvement areas');
  }

  return recommendations;
}
