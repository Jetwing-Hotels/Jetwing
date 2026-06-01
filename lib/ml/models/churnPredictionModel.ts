import { GuestStay } from '@/lib/guest-intelligence';

/**
 * Churn Prediction ML Model
 * Predicts likelihood of guest returning
 */

export interface ChurnPredictionInput {
  daysSinceLastVisit: number;
  lastRating: number; // 1-5
  visitFrequency: number; // visits per year
  averageSpend: number;
  lastStayLength: number; // days
  totalVisits: number;
  loyaltyTier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  sentimentScore: number; // 0-1
  bookingWindowTrend: number; // -1 to 1 (getting shorter or longer)
}

export interface ChurnPredictionOutput {
  churnRisk: number; // 0-100 (higher = more likely to churn)
  confidence: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  interventionPriority: 'high' | 'medium' | 'low';
  reasons: string[];
  recommendations: string[];
}

/**
 * Calculate recency risk factor
 * Higher recent inactivity = higher churn risk
 */
function calculateRecencyRisk(daysSinceLastVisit: number): number {
  // 180 days = 50% risk
  // 365 days = 85% risk
  // >730 days = 95% risk
  const maxRisk = 100;
  const riskPerDay = 1 / 7.3; // ~0.137 per day after ~2 months

  let recencyRisk = Math.min(maxRisk, (daysSinceLastVisit / 180) * 50);

  if (daysSinceLastVisit > 365) {
    recencyRisk = Math.min(maxRisk, 85 + ((daysSinceLastVisit - 365) / 365) * 10);
  }

  return recencyRisk;
}

/**
 * Calculate satisfaction risk factor
 * Lower ratings = higher churn risk
 */
function calculateSatisfactionRisk(lastRating: number, sentimentScore: number): number {
  const ratingRisk = (5 - lastRating) / 5 * 50;
  const sentimentRisk = (1 - sentimentScore) * 30;
  return Math.min(100, ratingRisk + sentimentRisk);
}

/**
 * Calculate frequency risk factor
 * Lower visit frequency = higher churn risk
 */
function calculateFrequencyRisk(visitFrequency: number, totalVisits: number): number {
  // Loyal guests (2+ visits/year) = low risk
  // Occasional guests (<0.5/year) = high risk
  if (visitFrequency >= 2) return 10;
  if (visitFrequency >= 1) return 30;
  if (visitFrequency >= 0.5) return 50;
  if (totalVisits <= 1) return 70;
  return 85;
}

/**
 * Calculate loyalty tier risk factor
 * Higher tiers are less likely to churn
 */
function calculateTierRisk(tier: string): number {
  const tierRisks: Record<string, number> = {
    'Platinum': 10,
    'Gold': 25,
    'Silver': 45,
    'Bronze': 65
  };
  return tierRisks[tier] || 50;
}

/**
 * Calculate spend trend risk
 * Declining spend = higher churn risk
 */
function calculateSpendTrend(lastSpend: number, averageSpend: number): number {
  const spendTrend = (lastSpend / averageSpend - 1) * 100;
  
  if (spendTrend > 0) return 0; // Increasing spend
  if (spendTrend > -20) return 15;
  if (spendTrend > -50) return 40;
  return 65;
}

/**
 * Main churn prediction function
 */
export function predictChurn(input: ChurnPredictionInput): ChurnPredictionOutput {
  // Calculate individual risk factors
  const recencyRisk = calculateRecencyRisk(input.daysSinceLastVisit);
  const satisfactionRisk = calculateSatisfactionRisk(input.lastRating, input.sentimentScore);
  const frequencyRisk = calculateFrequencyRisk(input.visitFrequency, input.totalVisits);
  const tierRisk = calculateTierRisk(input.loyaltyTier);
  const spendTrend = calculateSpendTrend(input.averageSpend, input.averageSpend);
  const bookingWindowRisk = input.bookingWindowTrend < -0.2 ? 30 : input.bookingWindowTrend > 0.2 ? -20 : 0;

  // Weighted combination
  const weights = {
    recency: 0.35,
    satisfaction: 0.25,
    frequency: 0.15,
    tier: 0.12,
    spend: 0.08,
    bookingWindow: 0.05
  };

  const churnRisk = Math.min(100, Math.max(0,
    (recencyRisk * weights.recency) +
    (satisfactionRisk * weights.satisfaction) +
    (frequencyRisk * weights.frequency) +
    (tierRisk * weights.tier) +
    (spendTrend * weights.spend) +
    (bookingWindowRisk * weights.bookingWindow)
  ));

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (churnRisk > 75) riskLevel = 'critical';
  else if (churnRisk > 60) riskLevel = 'high';
  else if (churnRisk > 40) riskLevel = 'medium';

  // Intervention priority (inverse of loyalty tier importance)
  let interventionPriority: 'high' | 'medium' | 'low' = 'low';
  if (input.loyaltyTier === 'Platinum' && churnRisk > 50) interventionPriority = 'high';
  else if (input.loyaltyTier === 'Gold' && churnRisk > 60) interventionPriority = 'high';
  else if (riskLevel === 'critical') interventionPriority = 'high';
  else if (riskLevel === 'high') interventionPriority = 'medium';

  // Generate reasons
  const reasons: string[] = [];
  if (recencyRisk > 40) reasons.push(`No visit for ${input.daysSinceLastVisit} days`);
  if (input.lastRating <= 3) reasons.push(`Low last rating: ${input.lastRating}/5`);
  if (input.sentimentScore < 0.5) reasons.push('Negative sentiment in recent reviews');
  if (frequencyRisk > 50) reasons.push('Low visit frequency');
  if (input.bookingWindowTrend < -0.3) reasons.push('Booking window lengthening');
  if (spendTrend < -30) reasons.push('Declining spending pattern');

  // Generate recommendations
  const recommendations: string[] = [];
  if (churnRisk > 50) {
    if (input.loyaltyTier === 'Platinum' || input.loyaltyTier === 'Gold') {
      recommendations.push('Send VIP re-engagement offer (20-25% discount)');
    } else {
      recommendations.push('Send targeted incentive offer (15-20% discount)');
    }
  }

  if (input.sentimentScore < 0.6 && input.lastRating <= 3) {
    recommendations.push('Follow up with guest to resolve concerns');
  }

  if (input.daysSinceLastVisit > 180) {
    recommendations.push('Send "We miss you" campaign');
  }

  if (input.visitFrequency < 0.5) {
    recommendations.push('Offer seasonal packages to increase frequency');
  }

  recommendations.push('Personalized email campaign with special offers');

  // Confidence based on data quality
  const confidence = Math.min(95, 60 + (input.totalVisits * 5));

  return {
    churnRisk: Math.round(churnRisk),
    confidence: Math.round(confidence),
    riskLevel,
    interventionPriority,
    reasons,
    recommendations
  };
}

/**
 * Batch churn prediction for multiple guests
 */
export function predictChurnBatch(inputs: ChurnPredictionInput[]): ChurnPredictionOutput[] {
  return inputs.map(input => predictChurn(input));
}

/**
 * Calculate intervention ROI
 */
export function calculateInterventionROI(
  churnRisk: number,
  lifetimeValue: number,
  interventionCost: number
): { expectedValue: number; roi: number } {
  // Expected value = probability of retention × LTV - intervention cost
  const retentionProbability = 1 - (churnRisk / 100);
  const expectedValue = (lifetimeValue * retentionProbability) - interventionCost;
  const roi = (expectedValue / interventionCost) * 100;

  return {
    expectedValue,
    roi
  };
}
