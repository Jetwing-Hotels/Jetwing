/**
 * Next-Best-Offer (NBO) Recommendation Engine
 * AI model for personalized offer generation and uplift prediction
 */

export interface NBOInput {
  guestId: string;
  tier: string;
  lifetimeValue: number;
  averageSpendPerNight: number;
  preferenceScore: number;
  favoriteRoomType?: string;
  favoriteProperty?: string;
  recentSpends: {
    spa?: number;
    dining?: number;
    activities?: number;
  };
  lastStayRating: number;
  daysUntilNextBooking?: number;
  seasonality?: string;
}

export interface NBOOffer {
  offerId: string;
  offerType: 'upsell' | 'cross_sell' | 'retention' | 'loyalty_reward';
  title: string;
  description: string;
  discount?: number; // percentage
  offerValue: number; // LKR
  estConversionProbability: number; // 0-100
  estNetValue: number; // expected revenue
  channels: string[];
  validDays: number;
  targetSegment: string;
}

/**
 * Next-Best-Offer (NBO) Recommendation Engine
 * Predicts optimal offer for each guest
 */
export class NBORecommendationEngine {
  /**
   * Generate next-best-offer for a guest
   */
  static generateNBO(input: NBOInput): NBOOffer[] {
    const offers: NBOOffer[] = [];

    // 1. Spa & Wellness Upsell
    const spaOffer = this.generateSpaOffer(input);
    if (spaOffer) offers.push(spaOffer);

    // 2. Dining Experience Upsell
    const diningOffer = this.generateDiningOffer(input);
    if (diningOffer) offers.push(diningOffer);

    // 3. Activities & Experiences Cross-sell
    const activitiesOffer = this.generateActivitiesOffer(input);
    if (activitiesOffer) offers.push(activitiesOffer);

    // 4. Room upgrade retention
    const upgradeOffer = this.generateRoomUpgradeOffer(input);
    if (upgradeOffer) offers.push(upgradeOffer);

    // 5. Property cross-sell
    const propertyCrossOffer = this.generatePropertyCrossOffer(input);
    if (propertyCrossOffer) offers.push(propertyCrossOffer);

    // 6. Loyalty rewards for high-value guests
    const loyaltyOffer = this.generateLoyaltyRewardOffer(input);
    if (loyaltyOffer) offers.push(loyaltyOffer);

    // Sort by expected net value (revenue potential)
    return offers.sort((a, b) => b.estNetValue - a.estNetValue);
  }

  /**
   * Generate Spa & Wellness Upsell Offer
   */
  private static generateSpaOffer(input: NBOInput): NBOOffer | null {
    if ((input.recentSpends.spa || 0) > input.averageSpendPerNight * 0.2) {
      return null; // Already high spa spender
    }

    if (input.lastStayRating < 4) {
      return null; // Not satisfied enough for upsell
    }

    const baseValue = input.averageSpendPerNight * 0.15; // Typical spa spend
    const discount = this.calculateDiscount(input.tier);
    const discountedValue = baseValue * (1 - discount / 100);
    const conversionProb = 75 + (input.preferenceScore * 0.1);

    return {
      offerId: `nbo_spa_${input.guestId}`,
      offerType: 'upsell',
      title: 'Premium Spa Escape',
      description: 'Signature wellness treatment tailored to your preferences',
      discount: 20,
      offerValue: baseValue,
      estConversionProbability: Math.min(95, conversionProb),
      estNetValue: discountedValue * (conversionProb / 100),
      channels: ['email', 'sms', 'app', 'front_desk'],
      validDays: 30,
      targetSegment: `${input.tier}_Wellness_Seeker`
    };
  }

  /**
   * Generate Dining Experience Upsell Offer
   */
  private static generateDiningOffer(input: NBOInput): NBOOffer | null {
    if ((input.recentSpends.dining || 0) > input.averageSpendPerNight * 0.25) {
      return null; // Already high dining spender
    }

    if (input.averageSpendPerNight < 15000) {
      return null; // Too low value segment
    }

    const baseValue = input.averageSpendPerNight * 0.2;
    const discount = this.calculateDiscount(input.tier) * 0.7; // Lower discount for dining
    const discountedValue = baseValue * (1 - discount / 100);
    const conversionProb = 82 + (input.tier === 'Platinum' ? 10 : 0);

    return {
      offerId: `nbo_dining_${input.guestId}`,
      offerType: 'upsell',
      title: 'Culinary Journey Package',
      description: 'Multi-course tasting menu at our award-winning restaurants',
      discount: Math.round(discount),
      offerValue: baseValue,
      estConversionProbability: Math.min(95, conversionProb),
      estNetValue: discountedValue * (conversionProb / 100),
      channels: ['email', 'app', 'front_desk'],
      validDays: 45,
      targetSegment: `${input.tier}_Foodie`
    };
  }

  /**
   * Generate Activities & Experiences Cross-sell
   */
  private static generateActivitiesOffer(input: NBOInput): NBOOffer | null {
    if ((input.recentSpends.activities || 0) > input.averageSpendPerNight * 0.15) {
      return null; // Already active
    }

    if (input.averageSpendPerNight < 10000) {
      return null; // Below target segment
    }

    const baseValue = input.averageSpendPerNight * 0.12;
    const conversionProb = 68 + (input.preferenceScore * 0.15);

    return {
      offerId: `nbo_activities_${input.guestId}`,
      offerType: 'cross_sell',
      title: 'Exclusive Experiences',
      description: 'Private guided tours and curated local adventures',
      discount: 15,
      offerValue: baseValue,
      estConversionProbability: Math.min(90, conversionProb),
      estNetValue: baseValue * 0.85 * (conversionProb / 100),
      channels: ['email', 'app', 'in_room'],
      validDays: 60,
      targetSegment: `${input.tier}_Adventure_Seeker`
    };
  }

  /**
   * Generate Room Upgrade Offer (Retention)
   */
  private static generateRoomUpgradeOffer(input: NBOInput): NBOOffer | null {
    if (input.tier !== 'Platinum' && input.tier !== 'Gold') {
      return null; // Only for high-value guests
    }

    if (input.lastStayRating >= 4.5) {
      return null; // Already satisfied
    }

    // Retention offer to regain satisfaction
    const upgradeValue = input.averageSpendPerNight * 0.3;
    const conversionProb = 85; // High probability for retention

    return {
      offerId: `nbo_upgrade_${input.guestId}`,
      offerType: 'retention',
      title: 'Complimentary Suite Upgrade',
      description: 'Experience our finest room with premium amenities',
      discount: 0,
      offerValue: upgradeValue,
      estConversionProbability: conversionProb,
      estNetValue: upgradeValue * 0.5 * (conversionProb / 100), // Lower margin
      channels: ['email', 'phone', 'front_desk'],
      validDays: 120,
      targetSegment: `${input.tier}_Retention`
    };
  }

  /**
   * Generate Property Cross-Sell Offer
   */
  private static generatePropertyCrossOffer(input: NBOInput): NBOOffer | null {
    if (input.favoriteProperty === undefined) {
      return null; // No favorite property to cross-sell from
    }

    // Suggest sister property with complementary experience
    const suggestionMap: Record<string, string> = {
      'lake': 'yala',     // Lake -> Safari
      'yala': 'blue',     // Safari -> Beach
      'blue': 'lake',     // Beach -> Nature
      'colombo': 'lake'   // City -> Nature
    };

    const targetProperty = suggestionMap[input.favoriteProperty];
    if (!targetProperty) return null;

    const stayValue = input.averageSpendPerNight * 3; // 3-night package
    const conversionProb = 55 + (input.tier === 'Platinum' ? 15 : 5);

    return {
      offerId: `nbo_property_${input.guestId}`,
      offerType: 'cross_sell',
      title: `Experience Jetwing ${this.propertyNameMap(targetProperty)}`,
      description: 'Discover our sister property with exclusive preview rates',
      discount: 25,
      offerValue: stayValue,
      estConversionProbability: conversionProb,
      estNetValue: stayValue * 0.75 * (conversionProb / 100),
      channels: ['email', 'app'],
      validDays: 90,
      targetSegment: `${input.tier}_Cross_Property`
    };
  }

  /**
   * Generate Loyalty Reward Offer
   */
  private static generateLoyaltyRewardOffer(input: NBOInput): NBOOffer | null {
    if (input.tier !== 'Platinum' && input.tier !== 'Gold') {
      return null; // Only for high-value guests
    }

    if (input.lifetimeValue < 300000) {
      return null; // Minimum LTV threshold
    }

    // Calculate reward points earned
    const rewardPoints = Math.floor(input.lifetimeValue / 10000); // 1 point per 10K LKR
    const rewardValue = rewardPoints * 100; // 100 LKR per point

    return {
      offerId: `nbo_loyalty_${input.guestId}`,
      offerType: 'loyalty_reward',
      title: 'Exclusive Platinum Privileges',
      description: `Enjoy ${rewardPoints} loyalty points + exclusive member benefits`,
      discount: 0,
      offerValue: rewardValue,
      estConversionProbability: 90,
      estNetValue: rewardValue * 0.3 * 0.9, // Lower margin, but high prob
      channels: ['email', 'sms', 'app'],
      validDays: 365,
      targetSegment: 'Platinum_Member'
    };
  }

  /**
   * Calculate dynamic discount based on tier
   */
  private static calculateDiscount(tier: string): number {
    const discountMap: Record<string, number> = {
      'Platinum': 25,
      'Gold': 20,
      'Silver': 15,
      'Bronze': 10
    };
    return discountMap[tier] || 10;
  }

  /**
   * Map property code to display name
   */
  private static propertyNameMap(code: string): string {
    const nameMap: Record<string, string> = {
      'lake': 'Lake',
      'yala': 'Yala',
      'blue': 'Blue',
      'colombo': 'Colombo Seven',
      'lighthouse': 'Lighthouse'
    };
    return nameMap[code] || code;
  }

  /**
   * Batch generate NBO for multiple guests
   */
  static generateNBOBatch(inputs: NBOInput[]): Map<string, NBOOffer[]> {
    const recommendations = new Map<string, NBOOffer[]>();
    
    inputs.forEach(input => {
      recommendations.set(input.guestId, this.generateNBO(input));
    });

    return recommendations;
  }

  /**
   * Calculate expected uplift from NBO
   */
  static calculateExpectedUplift(offers: NBOOffer[]): {
    totalPotentialRevenue: number;
    totalExpectedRevenue: number;
    expectedConversion: number;
    recommendedOffer: NBOOffer | null;
  } {
    if (offers.length === 0) {
      return {
        totalPotentialRevenue: 0,
        totalExpectedRevenue: 0,
        expectedConversion: 0,
        recommendedOffer: null
      };
    }

    const totalPotentialRevenue = offers.reduce((sum, o) => sum + o.offerValue, 0);
    const totalExpectedRevenue = offers.reduce((sum, o) => sum + o.estNetValue, 0);
    const avgConversion = offers.reduce((sum, o) => sum + o.estConversionProbability, 0) / offers.length;
    const recommendedOffer = offers[0]; // Already sorted by net value

    return {
      totalPotentialRevenue,
      totalExpectedRevenue: Math.round(totalExpectedRevenue),
      expectedConversion: Math.round(avgConversion),
      recommendedOffer
    };
  }
}

export default NBORecommendationEngine;
