import { GuestStay } from '@/lib/guest-intelligence';

/**
 * Loyalty Score ML Model
 * Calculates guest loyalty and engagement metrics
 */

export interface LoyaltyInput {
  visitCount: number;
  daysSinceFirstVisit: number;
  daysSinceLastVisit: number;
  totalSpend: number;
  averageSpendPerVisit: number;
  averageRating: number;
  reviewCount: number;
  referralCount: number;
  socialMediaMentions: number;
  repeatVisitWithinYear: boolean;
  membershipStatus: 'active' | 'inactive';
  promotionConversions: number;
}

export interface LoyaltyScore {
  overallScore: number; // 0-100
  frequencyScore: number;
  monetaryScore: number;
  satisfactionScore: number;
  engagementScore: number;
  loyaltyTier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  nextMilestoneDetails: {
    nextTier: string | null;
    spendNeeded: number;
    daysNeeded: number;
  };
  recommendations: string[];
}

/**
 * Calculate frequency score (0-25)
 */
function calculateFrequencyScore(
  visitCount: number,
  daysSinceFirstVisit: number,
  repeatWithinYear: boolean
): number {
  let score = 0;

  // Base frequency
  if (visitCount >= 5) score = 20;
  else if (visitCount >= 3) score = 15;
  else if (visitCount >= 2) score = 10;
  else if (visitCount >= 1) score = 5;

  // Bonus for repeat within year
  if (repeatWithinYear) score += 5;

  // Bonus for consistency
  if (visitCount > 1) {
    const avgDaysBetweenVisits = daysSinceFirstVisit / (visitCount - 1);
    if (avgDaysBetweenVisits < 180) score = Math.min(25, score + 3); // Regular visitor
  }

  return Math.min(25, score);
}

/**
 * Calculate monetary score (0-25)
 */
function calculateMonetaryScore(totalSpend: number, avgSpendPerVisit: number): number {
  let score = 0;

  // Total spend tiers
  if (totalSpend >= 1000000) score = 15;
  else if (totalSpend >= 500000) score = 12;
  else if (totalSpend >= 200000) score = 9;
  else if (totalSpend >= 100000) score = 5;
  else score = 1;

  // High spend per visit
  if (avgSpendPerVisit >= 150000) score = Math.min(25, score + 8);
  else if (avgSpendPerVisit >= 100000) score = Math.min(25, score + 5);
  else if (avgSpendPerVisit >= 50000) score = Math.min(25, score + 2);

  return Math.min(25, score);
}

/**
 * Calculate satisfaction score (0-25)
 */
function calculateSatisfactionScore(avgRating: number, reviewCount: number): number {
  let score = 0;

  // Rating based
  if (avgRating >= 4.8) score = 20;
  else if (avgRating >= 4.5) score = 18;
  else if (avgRating >= 4.0) score = 15;
  else if (avgRating >= 3.5) score = 10;
  else score = 5;

  // Bonus for leaving reviews (engagement)
  if (reviewCount >= 5) score = Math.min(25, score + 4);
  else if (reviewCount >= 2) score = Math.min(25, score + 2);

  return Math.min(25, score);
}

/**
 * Calculate engagement score (0-25)
 */
function calculateEngagementScore(
  referralCount: number,
  socialMentions: number,
  promotionConversions: number,
  reviewCount: number
): number {
  let score = 5; // Base score

  // Referrals (strong engagement indicator)
  score += Math.min(8, referralCount * 2);

  // Social mentions (brand advocacy)
  score += Math.min(8, socialMentions * 1.5);

  // Promotion conversions (marketing responsiveness)
  score += Math.min(5, promotionConversions);

  // Reviews (community engagement)
  score += Math.min(3, reviewCount * 0.5);

  return Math.min(25, score);
}

/**
 * Main loyalty calculation function
 */
export function calculateLoyalty(input: LoyaltyInput): LoyaltyScore {
  const frequencyScore = calculateFrequencyScore(input.visitCount, input.daysSinceFirstVisit, input.repeatVisitWithinYear);
  const monetaryScore = calculateMonetaryScore(input.totalSpend, input.averageSpendPerVisit);
  const satisfactionScore = calculateSatisfactionScore(input.averageRating, input.reviewCount);
  const engagementScore = calculateEngagementScore(
    input.referralCount,
    input.socialMediaMentions,
    input.promotionConversions,
    input.reviewCount
  );

  const overallScore = frequencyScore + monetaryScore + satisfactionScore + engagementScore;

  // Determine tier based on score and spend
  let loyaltyTier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' = 'Bronze';
  if (overallScore >= 85 && input.totalSpend >= 500000) loyaltyTier = 'Platinum';
  else if (overallScore >= 70 && input.totalSpend >= 300000) loyaltyTier = 'Gold';
  else if (overallScore >= 50 && input.totalSpend >= 100000) loyaltyTier = 'Silver';

  // Calculate next milestone
  let nextMilestoneDetails: { nextTier: string | null; spendNeeded: number; daysNeeded: number } = {
    nextTier: null,
    spendNeeded: 0,
    daysNeeded: 0
  };

  switch (loyaltyTier) {
    case 'Bronze':
      nextMilestoneDetails = {
        nextTier: 'Silver',
        spendNeeded: Math.max(0, 100000 - input.totalSpend),
        daysNeeded: Math.max(0, 365 - input.daysSinceLastVisit)
      };
      break;
    case 'Silver':
      nextMilestoneDetails = {
        nextTier: 'Gold',
        spendNeeded: Math.max(0, 300000 - input.totalSpend),
        daysNeeded: Math.max(0, 180 - input.daysSinceLastVisit)
      };
      break;
    case 'Gold':
      nextMilestoneDetails = {
        nextTier: 'Platinum',
        spendNeeded: Math.max(0, 500000 - input.totalSpend),
        daysNeeded: Math.max(0, 180 - input.daysSinceLastVisit)
      };
      break;
    case 'Platinum':
      nextMilestoneDetails = {
        nextTier: null,
        spendNeeded: 0,
        daysNeeded: 0
      };
  }

  // Recommendations
  const recommendations: string[] = [];

  if (loyaltyTier === 'Platinum') {
    recommendations.push('Offer exclusive VIP experiences (private dinners, personalized itineraries)');
  } else if (loyaltyTier === 'Gold') {
    recommendations.push('Invite to exclusive Gold member events');
    recommendations.push(`Spend LKR ${nextMilestoneDetails.spendNeeded.toLocaleString()} more to reach Platinum`);
  }

  if (input.daysSinceLastVisit > 180) {
    recommendations.push('Send personalized win-back offer');
  }

  if (input.referralCount === 0 && loyaltyTier !== 'Bronze') {
    recommendations.push('Encourage referrals with incentive program');
  }

  if (input.socialMediaMentions === 0 && loyaltyTier !== 'Bronze') {
    recommendations.push('Engage on social media with UGC campaigns');
  }

  if (input.promotionConversions < 2 && input.visitCount >= 2) {
    recommendations.push('Personalize promotional offers');
  }

  return {
    overallScore: Math.round(overallScore),
    frequencyScore: Math.round(frequencyScore),
    monetaryScore: Math.round(monetaryScore),
    satisfactionScore: Math.round(satisfactionScore),
    engagementScore: Math.round(engagementScore),
    loyaltyTier,
    nextMilestoneDetails: {
      ...nextMilestoneDetails,
      spendNeeded: Math.round(nextMilestoneDetails.spendNeeded)
    },
    recommendations
  };
}

/**
 * Predict next likely visit date
 */
export function predictNextVisitDate(
  visitHistory: GuestStay[],
  loyaltyScore: number
): {
  predictedDate: Date;
  confidence: number;
  reactivationOffer: string;
} {
  if (visitHistory.length === 0) {
    return {
      predictedDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      confidence: 20,
      reactivationOffer: 'Welcome back offer'
    };
  }

  // Calculate average days between visits
  let totalDays = 0;
  for (let i = 1; i < visitHistory.length; i++) {
    const prev = new Date(visitHistory[i - 1].checkOutDate).getTime();
    const curr = new Date(visitHistory[i].checkOutDate).getTime();
    totalDays += (curr - prev) / (1000 * 60 * 60 * 24);
  }

  const avgDaysBetweenVisits = visitHistory.length > 1 ? Math.round(totalDays / (visitHistory.length - 1)) : 180;

  // Adjust for loyalty (loyal guests visit more frequently)
  const loyaltyAdjustment = 1 - (loyaltyScore / 100) * 0.3;
  const predictedDays = Math.round(avgDaysBetweenVisits * loyaltyAdjustment);

  const lastVisit = new Date(visitHistory[visitHistory.length - 1].checkOutDate);
  const predictedDate = new Date(lastVisit.getTime() + predictedDays * 24 * 60 * 60 * 1000);

  return {
    predictedDate,
    confidence: Math.min(95, 50 + (loyaltyScore / 2)),
    reactivationOffer: loyaltyScore > 70 ? 'Premium loyalty gift + 15% discount' : '10% discount for next booking'
  };
}
