/**
 * Churn Prediction Model
 * Machine Learning model to predict guest churn risk
 */

export interface ChurnPredictionInput {
  daysSinceLastStay: number;
  lastRating: number;
  averageRating: number;
  totalStays: number;
  bookingFrequencyDays: number; // Average days between stays
  lastSpend: number;
  averageSpend: number;
  loyaltyScore: number;
  sentimentScore: number;
  cancellationRate: number; // % of bookings cancelled
  reviewCount: number;
  negativeReviewCount: number;
}

export interface ChurnPredictionOutput {
  churnProbability: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    factor: string;
    weight: number;
    impact: number;
    recommendation?: string;
  }[];
  interventionSuggestion?: string;
  timeToChurnEstimate?: number; // days
}

/**
 * Churn Prediction Model Implementation
 * Uses weighted feature analysis and pattern recognition
 */
export class ChurnPredictionModel {
  /**
   * Predict guest churn probability
   * Model: Weighted combination of behavioral factors
   */
  static predictChurn(input: ChurnPredictionInput): ChurnPredictionOutput {
    const factors: ChurnPredictionOutput['factors'] = [];
    let churnScore = 50; // Base score

    // 1. Recency Factor (40% weight) - Most important
    const recencyRisk = this.calculateRecencyRisk(
      input.daysSinceLastStay,
      input.bookingFrequencyDays,
      factors
    );
    churnScore += recencyRisk * 0.40;

    // 2. Satisfaction Factor (25% weight)
    const satisfactionRisk = this.calculateSatisfactionRisk(
      input.lastRating,
      input.averageRating,
      input.sentimentScore,
      factors
    );
    churnScore += satisfactionRisk * 0.25;

    // 3. Engagement Factor (20% weight)
    const engagementRisk = this.calculateEngagementRisk(
      input.totalStays,
      input.loyaltyScore,
      input.reviewCount,
      factors
    );
    churnScore += engagementRisk * 0.20;

    // 4. Spending Pattern Factor (10% weight)
    const spendingRisk = this.calculateSpendingRisk(
      input.lastSpend,
      input.averageSpend,
      factors
    );
    churnScore += spendingRisk * 0.10;

    // 5. Reliability Factor (5% weight)
    const reliabilityRisk = this.calculateReliabilityRisk(
      input.cancellationRate,
      factors
    );
    churnScore += reliabilityRisk * 0.05;

    // Normalize score to 0-100
    churnScore = Math.max(0, Math.min(100, churnScore));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (churnScore < 30) riskLevel = 'low';
    else if (churnScore < 50) riskLevel = 'medium';
    else if (churnScore < 75) riskLevel = 'high';
    else riskLevel = 'critical';

    // Calculate time to churn estimate
    const timeToChurnEstimate = this.estimateTimeToChurn(
      input.daysSinceLastStay,
      input.bookingFrequencyDays,
      churnScore
    );

    // Generate intervention suggestion
    const interventionSuggestion = this.generateIntervention(
      riskLevel,
      factors
    );

    return {
      churnProbability: Math.round(churnScore),
      riskLevel,
      factors: factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
      interventionSuggestion,
      timeToChurnEstimate
    };
  }

  /**
   * Calculate recency risk (0-100)
   * Guests who haven't visited recently are more likely to churn
   */
  private static calculateRecencyRisk(
    daysSinceLastStay: number,
    bookingFrequencyDays: number,
    factors: ChurnPredictionOutput['factors']
  ): number {
    let risk = 0;

    if (daysSinceLastStay > 365 * 2) {
      risk = 90; // 2+ years = critical
    } else if (daysSinceLastStay > 365) {
      risk = 70; // 1-2 years = high
    } else if (daysSinceLastStay > 180) {
      risk = 50; // 6-12 months = medium
    } else if (daysSinceLastStay > bookingFrequencyDays * 1.5) {
      risk = 30; // Late compared to usual
    } else {
      risk = 10; // Recent
    }

    factors.push({
      factor: 'Recency',
      weight: 0.40,
      impact: risk - 50,
      recommendation: risk > 60 
        ? 'Send immediate win-back campaign with personalized offer'
        : risk > 40
        ? 'Keep engagement through email marketing'
        : 'Maintain relationship with regular communications'
    });

    return risk;
  }

  /**
   * Calculate satisfaction risk (0-100)
   * Low ratings and sentiment indicate potential dissatisfaction
   */
  private static calculateSatisfactionRisk(
    lastRating: number,
    averageRating: number,
    sentimentScore: number,
    factors: ChurnPredictionOutput['factors']
  ): number {
    let risk = 50; // Base

    // Last rating impact
    if (lastRating <= 2) {
      risk += 30;
    } else if (lastRating === 3) {
      risk += 15;
    } else if (lastRating >= 4.5) {
      risk -= 20;
    }

    // Average rating trend
    if (averageRating < lastRating) {
      risk += 10; // Declining satisfaction
    }

    // Sentiment impact
    risk -= (sentimentScore / 100) * 20; // Higher sentiment = lower risk

    factors.push({
      factor: 'Satisfaction',
      weight: 0.25,
      impact: risk - 50,
      recommendation: risk > 60 
        ? 'Address specific complaints and offer service recovery'
        : 'Continue quality assurance and follow-up'
    });

    return Math.max(0, Math.min(100, risk));
  }

  /**
   * Calculate engagement risk (0-100)
   * Low engagement (few stays, low loyalty) indicates risk
   */
  private static calculateEngagementRisk(
    totalStays: number,
    loyaltyScore: number,
    reviewCount: number,
    factors: ChurnPredictionOutput['factors']
  ): number {
    let risk = 50;

    // Visit frequency
    if (totalStays <= 1) {
      risk += 30; // One-time visitor
    } else if (totalStays <= 3) {
      risk += 10;
    } else if (totalStays >= 5) {
      risk -= 20; // Regular visitor
    }

    // Loyalty score
    risk -= (loyaltyScore / 100) * 25;

    // Review engagement
    if (reviewCount === 0) {
      risk += 10;
    } else if (reviewCount > 2) {
      risk -= 10;
    }

    factors.push({
      factor: 'Engagement',
      weight: 0.20,
      impact: risk - 50,
      recommendation: totalStays <= 2 
        ? 'Nurture relationship through loyalty program'
        : 'Maintain engagement with exclusive member benefits'
    });

    return Math.max(0, Math.min(100, risk));
  }

  /**
   * Calculate spending risk (0-100)
   * Decreasing spending indicates potential churn
   */
  private static calculateSpendingRisk(
    lastSpend: number,
    averageSpend: number,
    factors: ChurnPredictionOutput['factors']
  ): number {
    let risk = 50;

    if (lastSpend === 0) {
      risk = 80;
    } else if (averageSpend > 0) {
      const spendRatio = lastSpend / averageSpend;
      if (spendRatio < 0.5) {
        risk = 75; // Spending significantly decreased
      } else if (spendRatio < 0.8) {
        risk = 60;
      } else if (spendRatio > 1.2) {
        risk = 20; // Spending increased
      } else {
        risk = 40;
      }
    }

    factors.push({
      factor: 'Spending',
      weight: 0.10,
      impact: risk - 50,
      recommendation: risk > 60 
        ? 'Investigate reason for spending decline and offer value'
        : 'Promote premium offerings and experiences'
    });

    return Math.max(0, Math.min(100, risk));
  }

  /**
   * Calculate reliability risk (0-100)
   * High cancellation rates indicate unreliable guests
   */
  private static calculateReliabilityRisk(
    cancellationRate: number,
    factors: ChurnPredictionOutput['factors']
  ): number {
    let risk = 50;

    if (cancellationRate > 0.3) {
      risk = 80; // 30%+ cancellation
    } else if (cancellationRate > 0.15) {
      risk = 65;
    } else if (cancellationRate > 0.05) {
      risk = 45;
    } else {
      risk = 20;
    }

    factors.push({
      factor: 'Reliability',
      weight: 0.05,
      impact: risk - 50,
      recommendation: cancellationRate > 0.15 
        ? 'Consider tighter booking terms or pre-authorization'
        : 'Maintain standard policies'
    });

    return risk;
  }

  /**
   * Estimate when guest will churn (in days)
   */
  private static estimateTimeToChurn(
    daysSinceLastStay: number,
    bookingFrequencyDays: number,
    churnScore: number
  ): number {
    if (churnScore < 40) return 365 * 2; // 2 years
    if (churnScore < 60) return 365; // 1 year
    if (churnScore < 80) return Math.round(bookingFrequencyDays * 2);
    return Math.round(bookingFrequencyDays); // Imminent
  }

  /**
   * Generate intervention suggestion based on risk level
   */
  private static generateIntervention(
    riskLevel: string,
    factors: ChurnPredictionOutput['factors']
  ): string {
    const topFactors = factors.slice(0, 2);

    if (riskLevel === 'critical') {
      return `URGENT: ${topFactors[0]?.recommendation || 'Contact immediately'} and offer 30% discount + room upgrade. Consider phone call from GM.`;
    } else if (riskLevel === 'high') {
      return `HIGH PRIORITY: ${topFactors[0]?.recommendation || 'Send personalized win-back offer'} within 7 days.`;
    } else if (riskLevel === 'medium') {
      return `${topFactors[0]?.recommendation || 'Maintain engagement through marketing campaigns'}`;
    }
    return 'Continue standard relationship management.';
  }

  /**
   * Batch predict churn for multiple guests
   */
  static predictChurnBatch(guests: ChurnPredictionInput[]): Map<string, ChurnPredictionOutput> {
    const predictions = new Map<string, ChurnPredictionOutput>();
    
    guests.forEach((guest, index) => {
      predictions.set(`guest_${index}`, this.predictChurn(guest));
    });

    return predictions;
  }
}

export default ChurnPredictionModel;
