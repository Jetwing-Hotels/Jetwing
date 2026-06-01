/**
 * Guest Preference Learning Engine
 * AI model for learning and predicting guest preferences
 */

export interface GuestPreferences {
  roomType: string;
  location: string;
  floorPreference?: 'ground' | 'low' | 'mid' | 'high';
  mealPlan: string;
  bedConfiguration?: string;
  viewPreference?: string;
  amenityPreferences: string[];
  diningPreferences: string[];
  activityPreferences: string[];
  timeOfStayPreference?: 'peak' | 'shoulder' | 'low';
  groupComposition?: string;
}

export interface PreferenceInsight {
  preference: string;
  confidence: number; // 0-100
  frequency: number; // times selected
  satisfactionWhenMet: number; // 0-100
  upsellPotential: number; // 0-100
  lastUpdated: Date;
}

export interface PersonalizedExperience {
  guestId: string;
  recommendedRoomType: string;
  roomConfidence: number;
  recommendedMealPlan: string;
  mealConfidence: number;
  suggestedActivities: Array<{ activity: string; confidence: number }>;
  recommendedDiningVenues: Array<{ venue: string; cuisineType: string; confidence: number }>;
  personalWelcomeMessage: string;
  specialRequests: string[];
  upcomingPreferences: { season: string; preferences: GuestPreferences }[];
}

/**
 * Preference Learning Engine
 * Learns and predicts guest preferences from behavior
 */
export class PreferenceLearningEngine {
  /**
   * Learn guest preferences from historical stays
   */
  static learnPreferences(guestHistory: any[]): Map<string, PreferenceInsight> {
    const preferences = new Map<string, PreferenceInsight>();

    // Track room type preference
    const roomTypeFreq: Record<string, number> = {};
    const roomTypeSatisfaction: Record<string, number[]> = {};

    // Track meal plan preference
    const mealPlanFreq: Record<string, number> = {};
    const mealPlanSatisfaction: Record<string, number[]> = {};

    // Track dining preferences
    const diningFreq: Record<string, number> = {};

    // Track activity preferences
    const activityFreq: Record<string, number> = {};

    // Process history
    guestHistory.forEach(stay => {
      // Room preference
      roomTypeFreq[stay.roomType] = (roomTypeFreq[stay.roomType] || 0) + 1;
      if (!roomTypeSatisfaction[stay.roomType]) {
        roomTypeSatisfaction[stay.roomType] = [];
      }
      roomTypeSatisfaction[stay.roomType].push(stay.rating || 4);

      // Meal plan
      if (stay.mealPlan) {
        mealPlanFreq[stay.mealPlan] = (mealPlanFreq[stay.mealPlan] || 0) + 1;
        if (!mealPlanSatisfaction[stay.mealPlan]) {
          mealPlanSatisfaction[stay.mealPlan] = [];
        }
        mealPlanSatisfaction[stay.mealPlan].push(stay.rating || 4);
      }

      // Dining venues
      if (stay.diningVenues) {
        stay.diningVenues.forEach((venue: string) => {
          diningFreq[venue] = (diningFreq[venue] || 0) + 1;
        });
      }

      // Activities
      if (stay.activities) {
        stay.activities.forEach((activity: string) => {
          activityFreq[activity] = (activityFreq[activity] || 0) + 1;
        });
      }
    });

    // Calculate insights
    Object.entries(roomTypeFreq).forEach(([roomType, freq]) => {
      const satisfaction = roomTypeSatisfaction[roomType];
      const avgSatisfaction = satisfaction.reduce((a, b) => a + b, 0) / satisfaction.length;
      const totalStays = guestHistory.length;

      preferences.set(`room_${roomType}`, {
        preference: roomType,
        confidence: Math.round((freq / totalStays) * 100),
        frequency: freq,
        satisfactionWhenMet: Math.round(avgSatisfaction * 20), // Convert to 0-100
        upsellPotential: this.calculateUpsellPotential(roomType, avgSatisfaction),
        lastUpdated: new Date()
      });
    });

    Object.entries(mealPlanFreq).forEach(([mealPlan, freq]) => {
      const satisfaction = mealPlanSatisfaction[mealPlan];
      const avgSatisfaction = satisfaction.reduce((a, b) => a + b, 0) / satisfaction.length;

      preferences.set(`meal_${mealPlan}`, {
        preference: mealPlan,
        confidence: Math.round((freq / guestHistory.length) * 100),
        frequency: freq,
        satisfactionWhenMet: Math.round(avgSatisfaction * 20),
        upsellPotential: 35,
        lastUpdated: new Date()
      });
    });

    Object.entries(diningFreq).forEach(([venue, freq]) => {
      preferences.set(`dining_${venue}`, {
        preference: venue,
        confidence: Math.round((freq / guestHistory.length) * 100),
        frequency: freq,
        satisfactionWhenMet: 85,
        upsellPotential: 20,
        lastUpdated: new Date()
      });
    });

    Object.entries(activityFreq).forEach(([activity, freq]) => {
      preferences.set(`activity_${activity}`, {
        preference: activity,
        confidence: Math.round((freq / guestHistory.length) * 100),
        frequency: freq,
        satisfactionWhenMet: 80,
        upsellPotential: 45,
        lastUpdated: new Date()
      });
    });

    return preferences;
  }

  /**
   * Generate personalized experience based on learned preferences
   */
  static generatePersonalizedExperience(
    guestId: string,
    preferences: Map<string, PreferenceInsight>,
    tier: string,
    upcomingStayDetails?: any
  ): PersonalizedExperience {
    // Find most confident room type
    const roomPrefs = Array.from(preferences.values())
      .filter(p => p.preference && p.preference.includes('Suite') || p.preference.includes('Deluxe') || p.preference.includes('Family'))
      .sort((a, b) => b.confidence - a.confidence);

    const recommendedRoom = roomPrefs[0] || { preference: 'Suite', confidence: 60 };

    // Find most confident meal plan
    const mealPrefs = Array.from(preferences.values())
      .filter(p => ['breakfast', 'half-board', 'full-board'].includes(p.preference))
      .sort((a, b) => b.confidence - a.confidence);

    const recommendedMeal = mealPrefs[0] || { preference: 'breakfast', confidence: 70 };

    // Get suggested activities
    const activityPrefs = Array.from(preferences.values())
      .filter(p => p.preference && 
        ['safari', 'spa', 'yoga', 'water-sports', 'hiking', 'meditation', 'cooking-class'].some(a => p.preference.toLowerCase().includes(a)))
      .sort((a, b) => b.satisfactionWhenMet - a.satisfactionWhenMet)
      .slice(0, 3);

    const suggestedActivities = activityPrefs.map(p => ({
      activity: p.preference,
      confidence: p.confidence
    }));

    // Special requests
    const specialRequests = this.generateSpecialRequests(tier, preferences);

    // Generate personalized message
    const personalMessage = this.generateWelcomeMessage(guestId, tier, recommendedRoom.preference);

    // Seasonal preferences
    const upcomingPreferences = this.predictSeasonalPreferences(preferences, upcomingStayDetails);

    return {
      guestId,
      recommendedRoomType: recommendedRoom.preference,
      roomConfidence: recommendedRoom.confidence,
      recommendedMealPlan: recommendedMeal.preference,
      mealConfidence: recommendedMeal.confidence,
      suggestedActivities,
      recommendedDiningVenues: [
        { venue: 'The Lake Restaurant', cuisineType: 'Contemporary', confidence: 80 },
        { venue: 'Beach Club', cuisineType: 'Seafood', confidence: 75 },
        { venue: 'Garden Cafe', cuisineType: 'Asian Fusion', confidence: 70 }
      ],
      personalWelcomeMessage: personalMessage,
      specialRequests,
      upcomingPreferences
    };
  }

  /**
   * Calculate upsell potential for a room type
   */
  private static calculateUpsellPotential(roomType: string, avgSatisfaction: number): number {
    const baseUpsell: Record<string, number> = {
      'Standard': 75,
      'Superior': 65,
      'Deluxe': 55,
      'Suite': 40,
      'Family': 60
    };

    const potential = baseUpsell[roomType] || 50;
    // Adjust based on satisfaction
    return Math.round(potential * (avgSatisfaction / 5));
  }

  /**
   * Generate special requests based on preferences
   */
  private static generateSpecialRequests(tier: string, preferences: Map<string, PreferenceInsight>): string[] {
    const requests: string[] = [];

    // VIP tier gets special treatment
    if (tier === 'Platinum') {
      requests.push('Pre-arrival room setup with preferred temperature');
      requests.push('Welcome gift based on preference history');
      requests.push('Dedicated concierge available 24/7');
    } else if (tier === 'Gold') {
      requests.push('Room requested to be prepared before arrival');
      requests.push('Complimentary welcome beverage');
    }

    // Add preference-based requests
    const roomPref = Array.from(preferences.values()).find(p => p.preference === 'Suite');
    if (roomPref && roomPref.confidence > 80) {
      requests.push('Suite preferred - upgrade if available');
    }

    return requests;
  }

  /**
   * Generate personalized welcome message
   */
  private static generateWelcomeMessage(guestId: string, tier: string, roomType: string): string {
    if (tier === 'Platinum') {
      return `Welcome back to Jetwing! We've prepared your favorite ${roomType} along with your preferred welcome amenities. Our team is honored to serve you.`;
    } else if (tier === 'Gold') {
      return `Welcome! We're delighted to have you back. Your ${roomType} has been prepared with care for your comfort.`;
    }
    return `Welcome to Jetwing! We hope you enjoy your stay in our ${roomType}.`;
  }

  /**
   * Predict seasonal preferences
   */
  private static predictSeasonalPreferences(
    preferences: Map<string, PreferenceInsight>,
    upcomingDetails?: any
  ): { season: string; preferences: GuestPreferences }[] {
    const seasonalPrefs: { season: string; preferences: GuestPreferences }[] = [];

    // Peak season (high-value stays expected)
    seasonalPrefs.push({
      season: 'peak',
      preferences: {
        roomType: 'Suite',
        location: 'premium',
        mealPlan: 'full-board',
        amenityPreferences: ['spa', 'premium-dining'],
        diningPreferences: ['fine-dining', 'seafood'],
        activityPreferences: ['exclusive-tours', 'water-sports'],
        groupComposition: 'couples'
      }
    });

    // Shoulder season (balanced preferences)
    seasonalPrefs.push({
      season: 'shoulder',
      preferences: {
        roomType: 'Deluxe',
        location: 'standard',
        mealPlan: 'half-board',
        amenityPreferences: ['fitness', 'spa'],
        diningPreferences: ['casual-dining', 'asian-fusion'],
        activityPreferences: ['hiking', 'meditation'],
        groupComposition: 'families'
      }
    });

    // Low season (value-focused)
    seasonalPrefs.push({
      season: 'low',
      preferences: {
        roomType: 'Standard',
        location: 'standard',
        mealPlan: 'breakfast',
        amenityPreferences: ['wifi', 'fitness'],
        diningPreferences: ['casual-dining', 'buffet'],
        activityPreferences: ['self-guided-tours'],
        groupComposition: 'solo-travelers'
      }
    });

    return seasonalPrefs;
  }

  /**
   * Predict LOS (Length of Stay) preference
   */
  static predictLengthOfStay(guestHistory: any[]): {
    averageLOS: number;
    mostCommonLOS: number;
    seasonalLOS: Record<string, number>;
  } {
    if (guestHistory.length === 0) {
      return {
        averageLOS: 3,
        mostCommonLOS: 3,
        seasonalLOS: {}
      };
    }

    const los = guestHistory.map(s => s.nights || 0);
    const avgLOS = los.reduce((a, b) => a + b, 0) / los.length;

    const losFreq: Record<number, number> = {};
    los.forEach(l => {
      losFreq[l] = (losFreq[l] || 0) + 1;
    });

    const mostCommon = Object.entries(losFreq).sort(([, a], [, b]) => b - a)[0][0];

    return {
      averageLOS: Math.round(avgLOS * 10) / 10,
      mostCommonLOS: parseInt(mostCommon),
      seasonalLOS: {
        peak: Math.round(avgLOS * 1.3),
        shoulder: Math.round(avgLOS),
        low: Math.round(avgLOS * 0.8)
      }
    };
  }

  /**
   * Identify preference evolution over time
   */
  static analyzePreferenceEvolution(guestHistory: any[]): {
    evolutionTrend: 'stable' | 'upgrading' | 'downgrading' | 'changing';
    explanation: string;
    recommendations: string[];
  } {
    if (guestHistory.length < 2) {
      return {
        evolutionTrend: 'stable',
        explanation: 'Insufficient history for trend analysis',
        recommendations: ['Collect more data from future stays']
      };
    }

    // Analyze room type evolution
    const firstStays = guestHistory.slice(0, Math.ceil(guestHistory.length / 2));
    const recentStays = guestHistory.slice(Math.ceil(guestHistory.length / 2));

    const initialRoom = this.getMostFrequentRoom(firstStays);
    const recentRoom = this.getMostFrequentRoom(recentStays);

    // Room tier ranking
    const tierRanking = { 'Standard': 1, 'Superior': 2, 'Deluxe': 3, 'Suite': 4, 'Family': 2.5 };
    const initialTier = tierRanking[initialRoom] || 2;
    const recentTier = tierRanking[recentRoom] || 2;

    let trend: 'stable' | 'upgrading' | 'downgrading' | 'changing' = 'stable';
    let explanation = 'Guest preferences remain consistent';
    let recommendations: string[] = [];

    if (recentTier > initialTier + 0.5) {
      trend = 'upgrading';
      explanation = `Guest has upgraded from ${initialRoom} to ${recentRoom}. Shows increasing investment in premium experiences.`;
      recommendations = ['Offer higher-tier room as default', 'Suggest premium add-ons', 'VIP recognition program'];
    } else if (recentTier < initialTier - 0.5) {
      trend = 'downgrading';
      explanation = `Guest has downgraded from ${initialRoom} to ${recentRoom}. May indicate budget constraints or satisfaction issues.`;
      recommendations = ['Investigate satisfaction levels', 'Offer value packages', 'Check for service issues'];
    } else if (recentRoom !== initialRoom) {
      trend = 'changing';
      explanation = `Guest is exploring different room types while maintaining similar tier levels.`;
      recommendations = ['Offer variety in room selections', 'Create package experiences', 'Test new amenities'];
    }

    return { evolutionTrend: trend, explanation, recommendations };
  }

  /**
   * Helper: Get most frequent room type
   */
  private static getMostFrequentRoom(stays: any[]): string {
    const freq: Record<string, number> = {};
    stays.forEach(s => {
      freq[s.roomType] = (freq[s.roomType] || 0) + 1;
    });

    return Object.entries(freq).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Standard';
  }
}

export default PreferenceLearningEngine;
