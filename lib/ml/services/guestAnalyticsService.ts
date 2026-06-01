import { GuestProfile, GuestStay } from '@/lib/guest-intelligence';
import { analyzeSentiment, analyzeSentimentBatch, calculateAverageSentiment } from '@/lib/ml/models/sentimentModel';
import { predictChurn, ChurnPredictionInput } from '@/lib/ml/models/churnPredictionModel';
import { calculateLoyalty, predictNextVisitDate, LoyaltyInput } from '@/lib/ml/models/loyaltyModel';
import { generateRecommendations, RecommendationInput } from '@/lib/ml/models/recommendationEngine';

/**
 * Complete Guest Analytics Service
 * Integrates all ML models for comprehensive guest intelligence
 */

export interface GuestAnalytics {
  guestId: string;
  profileSummary: {
    name: string;
    tier: string;
    lifetimeValue: number;
    totalVisits: number;
    lastVisit: string;
  };
  sentimentAnalysis: {
    overallScore: number;
    trend: 'improving' | 'declining' | 'stable';
    topTopics: string[];
    issues: string[];
  };
  loyaltyMetrics: {
    score: number;
    tier: string;
    frequencyScore: number;
    monetaryScore: number;
    satisfactionScore: number;
    engagementScore: number;
    nextMilestone: string;
  };
  churnPrediction: {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    interventionPriority: 'high' | 'medium' | 'low';
    reasons: string[];
    recommendedActions: string[];
  };
  nextVisitPrediction: {
    predictedDate: string;
    confidence: number;
    daysUntilPredicted: number;
  };
  personalizedRecommendations: Array<{
    title: string;
    category: string;
    estimatedValue: number;
    conversionProbability: number;
  }>;
  actionItems: {
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    reasoning: string;
    expectedImpact: string;
  }[];
}

/**
 * Comprehensive guest analysis service
 */
export async function analyzeGuest(
  profile: GuestProfile,
  stays: GuestStay[],
  reviews: Array<{ text: string; rating: number }> = []
): Promise<GuestAnalytics> {
  const lifetimeValue = stays.reduce((sum, stay) => sum + stay.amountSpent, 0);
  const totalVisits = stays.length;

  // 1. Sentiment Analysis
  const sentiments = reviews.length > 0 ? analyzeSentimentBatch(reviews) : [];
  const overallSentimentScore = calculateAverageSentiment(sentiments);
  const topTopics = sentiments.length > 0
    ? [...new Set(sentiments.flatMap(s => s.topics))].slice(0, 3)
    : [];

  // Identify negative topics
  const negativeTopics = sentiments
    .filter(s => s.score < 0.4)
    .flatMap(s => s.topics);

  // 2. Loyalty Analysis
  const loyaltyInput: LoyaltyInput = {
    visitCount: totalVisits,
    daysSinceFirstVisit: stays.length > 0
      ? Math.floor((new Date().getTime() - new Date(stays[0].checkInDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    daysSinceLastVisit: stays.length > 0
      ? Math.floor((new Date().getTime() - new Date(stays[stays.length - 1].checkOutDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    totalSpend: lifetimeValue,
    averageSpendPerVisit: totalVisits > 0 ? lifetimeValue / totalVisits : 0,
    averageRating: reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 4,
    reviewCount: reviews.length,
    referralCount: 0, // Would come from booking system
    socialMediaMentions: 0, // Would come from social integration
    repeatVisitWithinYear: stays.length > 1 && stays[stays.length - 1].amountSpent > 0,
    membershipStatus: 'active',
    promotionConversions: 0 // Would come from marketing system
  };

  const loyaltyScore = calculateLoyalty(loyaltyInput);

  // 3. Churn Prediction
  const churnInput: ChurnPredictionInput = {
    daysSinceLastVisit: loyaltyInput.daysSinceLastVisit,
    lastRating: reviews.length > 0 ? reviews[reviews.length - 1].rating : 4,
    visitFrequency: totalVisits > 1 ? totalVisits / (loyaltyInput.daysSinceFirstVisit / 365) : 0,
    averageSpend: loyaltyInput.averageSpendPerVisit,
    lastStayLength: stays.length > 0
      ? Math.ceil(
          (new Date(stays[stays.length - 1].checkOutDate).getTime() -
            new Date(stays[stays.length - 1].checkInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0,
    totalVisits: totalVisits,
    loyaltyTier: (loyaltyScore.loyaltyTier as 'Platinum' | 'Gold' | 'Silver' | 'Bronze'),
    sentimentScore: overallSentimentScore,
    bookingWindowTrend: 0 // Would come from booking pace analysis
  };

  const churnPrediction = predictChurn(churnInput);

  // 4. Next Visit Prediction
  const nextVisitPrediction = predictNextVisitDate(stays, loyaltyScore.overallScore);

  // 5. Personalized Recommendations
  const seasonalityFactor = new Date().getMonth() >= 10 ? 1.0 : 0.5; // Higher in peak season
  const recommendationInput: RecommendationInput = {
    guestProfile: profile,
    stays,
    totalSpend: lifetimeValue,
    loyaltyTier: loyaltyScore.loyaltyTier,
    sentimentScore: overallSentimentScore,
    seasonalityFactor,
    competitivePresence: false
  };

  const recommendations = generateRecommendations(recommendationInput).slice(0, 5);

  // 6. Action Items
  const actionItems: GuestAnalytics['actionItems'] = [];

  if (churnPrediction.riskLevel === 'critical') {
    actionItems.push({
      priority: 'critical',
      action: 'Executive outreach - VIP retention call',
      reasoning: `${profile.name} has extreme churn risk (${churnPrediction.churnRisk}%)`,
      expectedImpact: `${loyaltyScore.loyaltyTier} tier guest worth LKR ${lifetimeValue.toLocaleString()}`
    });
  } else if (churnPrediction.riskLevel === 'high') {
    actionItems.push({
      priority: 'high',
      action: 'Send retention offer with personalized incentive',
      reasoning: churnPrediction.reasons[0] || 'High churn risk detected',
      expectedImpact: `Potential recovery of LKR ${(lifetimeValue * 0.3).toLocaleString()} annual value`
    });
  }

  if (overallSentimentScore < 0.4) {
    actionItems.push({
      priority: 'high',
      action: 'Quality assurance review and recovery program',
      reasoning: `Low satisfaction score (${(overallSentimentScore * 10).toFixed(1)}/10)`,
      expectedImpact: 'Prevent negative word-of-mouth and improve reputation'
    });
  }

  if (loyaltyScore.nextMilestoneDetails.nextTier) {
    actionItems.push({
      priority: 'medium',
      action: `Tier upgrade campaign - ${loyaltyScore.nextMilestoneDetails.nextTier} benefits`,
      reasoning: `${profile.name} is close to next loyalty tier`,
      expectedImpact: `Increase annual spend by LKR ${(loyaltyScore.nextMilestoneDetails.spendNeeded * 0.5).toLocaleString()}`
    });
  }

  if (recommendations.length > 0 && recommendations[0].conversionProbability > 70) {
    actionItems.push({
      priority: 'medium',
      action: `Push high-conversion offer: ${recommendations[0].title}`,
      reasoning: `${recommendations[0].conversionProbability}% conversion probability`,
      expectedImpact: `LKR ${recommendations[0].estimatedValue.toLocaleString()} revenue opportunity`
    });
  }

  return {
    guestId: profile.guestId,
    profileSummary: {
      name: profile.name,
      tier: loyaltyScore.loyaltyTier,
      lifetimeValue,
      totalVisits,
      lastVisit: stays.length > 0 ? stays[stays.length - 1].checkOutDate : 'Never'
    },
    sentimentAnalysis: {
      overallScore: Math.round(overallSentimentScore * 100),
      trend: overallSentimentScore > 0.7 ? 'improving' : overallSentimentScore < 0.4 ? 'declining' : 'stable',
      topTopics,
      issues: [...new Set(negativeTopics)]
    },
    loyaltyMetrics: {
      score: loyaltyScore.overallScore,
      tier: loyaltyScore.loyaltyTier,
      frequencyScore: loyaltyScore.frequencyScore,
      monetaryScore: loyaltyScore.monetaryScore,
      satisfactionScore: loyaltyScore.satisfactionScore,
      engagementScore: loyaltyScore.engagementScore,
      nextMilestone: loyaltyScore.nextMilestoneDetails.nextTier || 'Platinum (Max)'
    },
    churnPrediction: {
      riskScore: churnPrediction.churnRisk,
      riskLevel: churnPrediction.riskLevel,
      interventionPriority: churnPrediction.interventionPriority,
      reasons: churnPrediction.reasons,
      recommendedActions: churnPrediction.recommendations
    },
    nextVisitPrediction: {
      predictedDate: nextVisitPrediction.predictedDate.toISOString().split('T')[0],
      confidence: Math.round(nextVisitPrediction.confidence),
      daysUntilPredicted: Math.floor((nextVisitPrediction.predictedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    },
    personalizedRecommendations: recommendations.map(r => ({
      title: r.title,
      category: r.category,
      estimatedValue: r.estimatedValue,
      conversionProbability: r.conversionProbability
    })),
    actionItems: actionItems.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
  };
}

/**
 * Batch analysis for multiple guests
 */
export async function analyzeGuestsBatch(
  guests: Array<{ profile: GuestProfile; stays: GuestStay[] }>
): Promise<GuestAnalytics[]> {
  return Promise.all(
    guests.map(g => analyzeGuest(g.profile, g.stays, []))
  );
}

/**
 * Search and filter guests by risk level
 */
export function filterGuestsByChurnRisk(
  analytics: GuestAnalytics[],
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
): GuestAnalytics[] {
  return analytics.filter(a => a.churnPrediction.riskLevel === riskLevel);
}

/**
 * Get high-value guests at risk
 */
export function getHighValueAtRiskGuests(analytics: GuestAnalytics[]): GuestAnalytics[] {
  return analytics.filter(
    a =>
      a.profileSummary.lifetimeValue > 500000 &&
      (a.churnPrediction.riskLevel === 'high' || a.churnPrediction.riskLevel === 'critical')
  );
}

/**
 * Get upsell opportunities
 */
export function getUpsellOpportunities(analytics: GuestAnalytics[]): Array<{
  guest: string;
  opportunity: string;
  value: number;
  probability: number;
}> {
  return analytics
    .flatMap(a =>
      a.personalizedRecommendations.map(r => ({
        guest: a.profileSummary.name,
        opportunity: r.title,
        value: r.estimatedValue,
        probability: r.conversionProbability
      }))
    )
    .sort((a, b) => b.probability - a.probability);
}
