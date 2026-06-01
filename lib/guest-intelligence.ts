/**
 * Guest Intelligence Utilities
 * Customer segmentation, lifetime value, and personalization
 */

export interface GuestProfile {
  guestId: string;
  name: string;
  email: string;
  history: GuestStay[];
}

export interface GuestStay {
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  amountSpent: number;
  rating: number;
  notes: string;
}

export enum GuestTier {
  PLATINUM = 'Platinum',
  GOLD = 'Gold',
  SILVER = 'Silver',
  BRONZE = 'Bronze'
}

export interface GuestSegmentation {
  tier: GuestTier;
  lifetimeValue: number;
  totalNights: number;
  averageSpend: number;
  loyaltyScore: number;
  preferenceScore: number;
  sentimentScore: number;
  churnRisk: number;
}

/**
 * Calculate lifetime value
 */
export function calculateLifetimeValue(stays: GuestStay[]): number {
  return stays.reduce((sum, stay) => sum + stay.amountSpent, 0);
}

/**
 * Calculate total nights stayed
 */
export function calculateTotalNights(stays: GuestStay[]): number {
  return stays.reduce((sum, stay) => {
    const checkIn = new Date(stay.checkInDate);
    const checkOut = new Date(stay.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return sum + nights;
  }, 0);
}

/**
 * Segment guest into tier
 */
export function segmentGuest(lifetimeValue: number): GuestTier {
  if (lifetimeValue >= 1000000) return GuestTier.PLATINUM;
  if (lifetimeValue >= 500000) return GuestTier.GOLD;
  if (lifetimeValue >= 200000) return GuestTier.SILVER;
  return GuestTier.BRONZE;
}

/**
 * Calculate loyalty score (0-100)
 */
export function calculateLoyaltyScore(stays: GuestStay[]): number {
  if (stays.length === 0) return 0;

  const visitCount = stays.length;
  const recencyDays = stays.length > 0 
    ? Math.floor((new Date().getTime() - new Date(stays[stays.length - 1].checkOutDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Higher score for more visits
  const frequencyScore = Math.min(50, visitCount * 10);
  
  // Higher score for recent visits (within 6 months)
  const recencyScore = recencyDays < 180 ? Math.max(0, 50 - (recencyDays / 180) * 50) : 0;
  
  return Math.round(frequencyScore + recencyScore);
}

/**
 * Calculate average spend per night
 */
export function calculateAverageSpendPerNight(stays: GuestStay[]): number {
  const totalSpend = calculateLifetimeValue(stays);
  const totalNights = calculateTotalNights(stays);
  
  return totalNights > 0 ? Math.round(totalSpend / totalNights) : 0;
}

/**
 * Calculate preference score based on room types and visits
 */
export function calculatePreferenceScore(stays: GuestStay[]): number {
  if (stays.length === 0) return 50;

  // Room type consistency
  const roomTypes = stays.map(s => s.roomType);
  const uniqueRooms = new Set(roomTypes).size;
  const specialization = (1 - (uniqueRooms / stays.length)) * 100;

  // Rating consistency
  const avgRating = stays.reduce((sum, s) => sum + s.rating, 0) / stays.length;
  const ratingConsistency = avgRating * 10;

  return Math.round((specialization * 0.4 + ratingConsistency * 0.6) / 10);
}

/**
 * Calculate sentiment score (0-100) based on reviews
 */
export function calculateSentimentScore(stays: GuestStay[]): number {
  if (stays.length === 0) return 50;

  const avgRating = stays.reduce((sum, s) => sum + s.rating, 0) / stays.length;
  return Math.round((avgRating / 5) * 100);
}

/**
 * Calculate churn risk (0-100, higher = more likely to churn)
 */
export function calculateChurnRisk(stays: GuestStay[]): number {
  if (stays.length === 0) return 50;

  const lastStay = stays[stays.length - 1];
  const daysSinceLastVisit = Math.floor((new Date().getTime() - new Date(lastStay.checkOutDate).getTime()) / (1000 * 60 * 60 * 24));
  
  // Last rating
  const lastRating = lastStay.rating;

  // Time decay (higher risk if long time since last visit)
  const timeRisk = Math.min(100, (daysSinceLastVisit / 365) * 50);

  // Rating risk (lower rating = higher risk)
  const ratingRisk = (5 - lastRating) / 5 * 50;

  return Math.round((timeRisk + ratingRisk) / 2);
}

/**
 * Generate personalized recommendations
 */
export function generatePersonalizedRecommendations(profile: GuestProfile): string[] {
  if (profile.history.length === 0) return [];

  const recommendations: string[] = [];
  
  // Most preferred room type
  const roomTypeCounts = profile.history.reduce((acc, stay) => {
    acc[stay.roomType] = (acc[stay.roomType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const preferredRoom = Object.entries(roomTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (preferredRoom) {
    recommendations.push(`Pre-assign ${preferredRoom} for seamless experience`);
  }

  // Visit frequency pattern
  const avgDaysBetweenVisits = profile.history.length > 1 
    ? Math.floor((new Date().getTime() - new Date(profile.history[0].checkOutDate).getTime()) / (1000 * 60 * 60 * 24) / (profile.history.length - 1))
    : 180;

  recommendations.push(`Schedule pre-arrival communication ${Math.max(7, Math.min(30, avgDaysBetweenVisits / 12))} days before expected return`);

  // Special offers based on spend
  const avgSpend = calculateAverageSpendPerNight(profile.history);
  if (avgSpend > 25000) {
    recommendations.push('Offer complimentary spa or premium dining experience');
  }

  // Loyalty reward
  recommendations.push('Enroll in premium loyalty program for exclusive benefits');

  return recommendations;
}
