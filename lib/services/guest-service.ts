/**
 * Guest Intelligence Service
 * Core business logic for guest management and analytics
 */

import { 
  calculateLifetimeValue,
  calculateLoyaltyScore,
  calculatePreferenceScore,
  calculateSentimentScore,
  calculateChurnRisk,
  segmentGuest,
  generatePersonalizedRecommendations
} from './guest-intelligence';

export interface Guest {
  id: string;
  email: string;
  name: string;
  phone?: string;
  nationality?: string;
  dateOfBirth?: string;
  preferences?: GuestPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface GuestPreferences {
  roomView?: string;
  highestFloor?: boolean;
  dietaryRestrictions?: string[];
  languages?: string[];
  specialRequests?: string[];
  doNotDisturb?: boolean;
}

export interface GuestStayRecord {
  stayId: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  ratePerNight: number;
  totalSpend: number;
  rating: number;
  comments?: string;
  roomNumber?: string;
  additionalServices?: {
    spa?: number;
    dining?: number;
    activities?: number;
  };
}

export interface GuestAnalytics {
  guestId: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  lifetimeValue: number;
  totalNights: number;
  averageSpendPerNight: number;
  totalStays: number;
  loyaltyScore: number;
  preferenceScore: number;
  sentimentScore: number;
  churnRisk: number;
  lastStayDate: string;
  predictedNextStayDate?: string;
  favoriteProperty?: string;
  favoriteRoomType?: string;
  averageRating: number;
}

export interface GuestRecommendation {
  recommendationId: string;
  guestId: string;
  recommendationType: 'upsell' | 'cross_sell' | 'win_back' | 'loyalty_reward';
  title: string;
  description: string;
  offerDetails: string;
  confidence: number; // 0-100
  estimatedValue: number;
  expiryDate: string;
  channels: ('email' | 'sms' | 'app' | 'front_desk')[];
  targetProperty?: string;
}

/**
 * Guest Service Class
 */
export class GuestService {
  /**
   * Generate complete guest analytics profile
   */
  static generateGuestAnalytics(guest: Guest, stays: GuestStayRecord[]): GuestAnalytics {
    const lifetimeValue = calculateLifetimeValue(
      stays.map(s => ({
        checkInDate: s.checkInDate,
        checkOutDate: s.checkOutDate,
        roomType: s.roomType,
        amountSpent: s.totalSpend,
        rating: s.rating,
        notes: s.comments || ''
      }))
    );

    const guestStays = stays.map(s => ({
      checkInDate: s.checkInDate,
      checkOutDate: s.checkOutDate,
      roomType: s.roomType,
      amountSpent: s.totalSpend,
      rating: s.rating,
      notes: s.comments || ''
    }));

    const averageRating = stays.length > 0 
      ? Math.round((stays.reduce((sum, s) => sum + s.rating, 0) / stays.length) * 10) / 10
      : 0;

    const totalNights = stays.reduce((sum, stay) => {
      const checkIn = new Date(stay.checkInDate);
      const checkOut = new Date(stay.checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + nights;
    }, 0);

    const lastStay = stays.length > 0 ? stays[stays.length - 1].checkOutDate : new Date().toISOString();

    return {
      guestId: guest.id,
      tier: segmentGuest(lifetimeValue),
      lifetimeValue,
      totalNights,
      averageSpendPerNight: totalNights > 0 ? Math.round(lifetimeValue / totalNights) : 0,
      totalStays: stays.length,
      loyaltyScore: calculateLoyaltyScore(guestStays),
      preferenceScore: calculatePreferenceScore(guestStays),
      sentimentScore: calculateSentimentScore(guestStays),
      churnRisk: calculateChurnRisk(guestStays),
      lastStayDate: lastStay,
      favoriteProperty: this.getFavoriteProperty(stays),
      favoriteRoomType: this.getFavoriteRoomType(stays),
      averageRating
    };
  }

  /**
   * Generate personalized recommendations
   */
  static generateRecommendations(
    guest: Guest,
    analytics: GuestAnalytics,
    stays: GuestStayRecord[]
  ): GuestRecommendation[] {
    const recommendations: GuestRecommendation[] = [];
    
    // Upsell recommendations based on history
    if (analytics.loyaltyScore > 70 && analytics.averageRating >= 4.5) {
      const spendByCategory = this.analyzeSpendByCategory(stays);
      
      if (spendByCategory.spa === 0 || spendByCategory.spa < analytics.averageSpendPerNight * 0.1) {
        recommendations.push({
          recommendationId: `rec_${guest.id}_spa_upsell`,
          guestId: guest.id,
          recommendationType: 'upsell',
          title: 'Premium Spa Experience',
          description: 'Exclusive spa treatment tailored to your preferences',
          offerDetails: '20% discount on signature treatments',
          confidence: 78,
          estimatedValue: 25000,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          channels: ['email', 'app', 'front_desk'],
          targetProperty: analytics.favoriteProperty
        });
      }

      if (spendByCategory.dining < analytics.averageSpendPerNight * 0.15) {
        recommendations.push({
          recommendationId: `rec_${guest.id}_dining_upsell`,
          guestId: guest.id,
          recommendationType: 'upsell',
          title: 'Culinary Journey Package',
          description: 'Multi-course dining at our award-winning restaurants',
          offerDetails: 'Complimentary wine pairing + 15% discount',
          confidence: 85,
          estimatedValue: 35000,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          channels: ['email', 'sms', 'front_desk']
        });
      }
    }

    // Win-back for at-risk guests
    if (analytics.churnRisk > 60) {
      recommendations.push({
        recommendationId: `rec_${guest.id}_winback`,
        guestId: guest.id,
        recommendationType: 'win_back',
        title: 'We Miss You Exclusive Offer',
        description: 'Special rate on your favorite room type',
        offerDetails: '25% discount + free room upgrade',
        confidence: 72,
        estimatedValue: 50000,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        channels: ['email', 'phone'],
        targetProperty: analytics.favoriteProperty
      });
    }

    // Cross-sell based on property diversity
    if (!stays.some(s => s.propertyId === 'yala') && analytics.favoriteProperty === 'lake') {
      recommendations.push({
        recommendationId: `rec_${guest.id}_crosssell_yala`,
        guestId: guest.id,
        recommendationType: 'cross_sell',
        title: 'Discover Jetwing Yala Safari',
        description: 'Experience our premier wildlife destination',
        offerDetails: '3-night package at special rate + safari experience',
        confidence: 68,
        estimatedValue: 180000,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        channels: ['email', 'app']
      });
    }

    // Loyalty rewards for Platinum members
    if (analytics.tier === 'Platinum' && analytics.loyaltyScore > 80) {
      recommendations.push({
        recommendationId: `rec_${guest.id}_loyalty`,
        guestId: guest.id,
        recommendationType: 'loyalty_reward',
        title: 'Platinum Privilege Benefits',
        description: 'Exclusive perks for our most valued guests',
        offerDetails: 'Free room upgrade + late checkout + complimentary transfers',
        confidence: 95,
        estimatedValue: 40000,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        channels: ['email', 'sms', 'app', 'front_desk']
      });
    }

    return recommendations;
  }

  /**
   * Identify guests at risk of churning
   */
  static identifyChurnRiskGuests(
    allGuests: GuestAnalytics[]
  ): GuestAnalytics[] {
    return allGuests
      .filter(g => g.churnRisk > 60)
      .sort((a, b) => b.churnRisk - a.churnRisk);
  }

  /**
   * Identify high-value growth opportunities
   */
  static identifyGrowthOpportunities(
    allGuests: GuestAnalytics[]
  ): GuestAnalytics[] {
    return allGuests
      .filter(g => 
        g.tier === 'Silver' && g.loyaltyScore > 60 ||
        g.tier === 'Gold' && g.sentimentScore > 80
      )
      .sort((a, b) => (b.lifetimeValue - b.averageSpendPerNight) - (a.lifetimeValue - a.averageSpendPerNight));
  }

  /**
   * Segment guests by behavioral patterns
   */
  static segmentGuestsByBehavior(
    allGuests: GuestAnalytics[]
  ): Record<string, GuestAnalytics[]> {
    return {
      loyal: allGuests.filter(g => g.loyaltyScore > 70),
      highValue: allGuests.filter(g => g.lifetimeValue > 500000),
      atRisk: allGuests.filter(g => g.churnRisk > 60),
      satisfied: allGuests.filter(g => g.sentimentScore > 80),
      new: allGuests.filter(g => g.totalStays <= 2),
      seasonal: allGuests.filter(g => g.totalStays >= 3 && g.totalNights < 15)
    };
  }

  /**
   * Calculate sentiment trend
   */
  static calculateSentimentTrend(
    ratings: number[]
  ): 'improving' | 'declining' | 'stable' {
    if (ratings.length < 2) return 'stable';
    
    const recent = ratings.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, ratings.length);
    const earlier = ratings.slice(0, Math.min(3, ratings.length - 1)).reduce((a, b) => a + b, 0) / Math.min(3, ratings.length - 1);
    
    if (recent > earlier + 0.3) return 'improving';
    if (recent < earlier - 0.3) return 'declining';
    return 'stable';
  }

  /**
   * Private helper: Get favorite property
   */
  private static getFavoriteProperty(stays: GuestStayRecord[]): string | undefined {
    if (stays.length === 0) return undefined;
    
    const propertyCounts = stays.reduce((acc, stay) => {
      acc[stay.propertyId] = (acc[stay.propertyId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(propertyCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  /**
   * Private helper: Get favorite room type
   */
  private static getFavoriteRoomType(stays: GuestStayRecord[]): string | undefined {
    if (stays.length === 0) return undefined;
    
    const roomCounts = stays.reduce((acc, stay) => {
      acc[stay.roomType] = (acc[stay.roomType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  /**
   * Private helper: Analyze spending by category
   */
  private static analyzeSpendByCategory(stays: GuestStayRecord[]): Record<string, number> {
    return {
      spa: stays.reduce((sum, s) => sum + (s.additionalServices?.spa || 0), 0),
      dining: stays.reduce((sum, s) => sum + (s.additionalServices?.dining || 0), 0),
      activities: stays.reduce((sum, s) => sum + (s.additionalServices?.activities || 0), 0)
    };
  }
}

export default GuestService;
