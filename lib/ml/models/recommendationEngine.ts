import { GuestProfile, GuestStay } from '@/lib/guest-intelligence';

/**
 * Recommendation Engine ML Model
 * Suggests personalized offers and experiences
 */

export interface RecommendationInput {
  guestProfile: GuestProfile;
  stays: GuestStay[];
  totalSpend: number;
  loyaltyTier: string;
  sentimentScore: number;
  seasonalityFactor: number; // 0-1
  competitivePresence: boolean;
}

export interface Recommendation {
  title: string;
  description: string;
  category: 'room_upgrade' | 'dining' | 'activity' | 'wellness' | 'early_bird' | 'package';
  property: string;
  estimatedValue: number;
  conversionProbability: number; // 0-100
  targetDate: Date;
  reasoning: string;
}

/**
 * Analyze guest preferences from stay history
 */
function analyzePreferences(stays: GuestStay[]): Record<string, any> {
  const preferences: Record<string, any> = {
    roomTypes: {},
    seasons: {},
    stayLength: [],
    properties: [],
    seasonalPattern: null
  };

  if (stays.length === 0) return preferences;

  stays.forEach(stay => {
    // Room type preferences
    preferences.roomTypes[stay.roomType] = (preferences.roomTypes[stay.roomType] || 0) + 1;

    // Length of stay
    const checkIn = new Date(stay.checkInDate);
    const checkOut = new Date(stay.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    preferences.stayLength.push(nights);

    // Properties visited
    preferences.properties.push(stay.roomType);

    // Seasonal analysis
    const month = new Date(stay.checkInDate).getMonth();
    preferences.seasons[month] = (preferences.seasons[month] || 0) + 1;
  });

  // Calculate average stay length
  const avgStayLength = preferences.stayLength.length > 0
    ? Math.round(preferences.stayLength.reduce((a, b) => a + b) / preferences.stayLength.length)
    : 2;

  // Find preferred season
  const seasonCounts = Object.entries(preferences.seasons).sort((a, b) => b[1] - a[1]);
  preferences.seasonalPattern = seasonCounts[0]?.[0] || null;

  return { ...preferences, avgStayLength };
}

/**
 * Generate room upgrade recommendation
 */
function generateRoomUpgrade(input: RecommendationInput, preferences: any): Recommendation {
  const preferredRoom = Object.entries(preferences.roomTypes)
    .sort((a: any, b: any) => b[1] - a[1])[0]?.[0];

  const upgradeLevel = input.loyaltyTier === 'Platinum' ? 2 : input.loyaltyTier === 'Gold' ? 1 : 0;
  const roomUpgrades: Record<string, string> = {
    'Standard': 'Deluxe',
    'Superior': 'Suite',
    'Deluxe': 'Suite',
    'Suite': 'Presidential Suite'
  };

  const upgradedRoom = roomUpgrades[preferredRoom as string] || 'Suite';

  return {
    title: `Complimentary ${upgradedRoom} Upgrade`,
    description: `Enjoy a free upgrade to our ${upgradedRoom} on your next visit. Based on your preference for ${preferredRoom} accommodations.`,
    category: 'room_upgrade',
    property: 'Jetwing Lake', // Would be determined from preference analysis
    estimatedValue: 50000,
    conversionProbability: input.loyaltyTier === 'Platinum' ? 85 : input.loyaltyTier === 'Gold' ? 72 : 55,
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    reasoning: `${input.guestProfile.name} has shown strong preference for ${preferredRoom} rooms with ${input.stays.length} bookings`
  };
}

/**
 * Generate dining recommendation
 */
function generateDiningRecommendation(input: RecommendationInput): Recommendation {
  const diningOptions: Record<string, { title: string; value: number }> = {
    'Platinum': { title: 'Private Chef Experience (Dinner for 2)', value: 120000 },
    'Gold': { title: 'Wine Pairing Tasting Menu', value: 85000 },
    'Silver': { title: 'Spa Lunch Wellness Package', value: 55000 },
    'Bronze': { title: 'Buffet Breakfast Upgrade', value: 15000 }
  };

  const option = diningOptions[input.loyaltyTier] || diningOptions['Bronze'];

  return {
    title: option.title,
    description: `Experience ${option.title.toLowerCase()} during your next stay. Personalized for your taste preferences.`,
    category: 'dining',
    property: 'Multiple properties',
    estimatedValue: option.value,
    conversionProbability: input.sentimentScore > 0.7 ? 68 : 45,
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    reasoning: `Aligned with ${input.guestProfile.name}'s high spending patterns in dining (${(input.totalSpend * 0.15).toFixed(0)} LKR spent)`
  };
}

/**
 * Generate activity recommendation
 */
function generateActivityRecommendation(input: RecommendationInput): Recommendation {
  const activities = [
    { title: 'Guided Eco-Safari', property: 'Jetwing Yala', value: 45000, prob: 75 },
    { title: 'Tea Plantation Tour', property: 'Jetwing Heaven', value: 35000, prob: 60 },
    { title: 'Whale Watching Adventure', property: 'Jetwing Lighthouse', value: 55000, prob: 70 },
    { title: 'Cultural Heritage Experience', property: 'Jetwing Colombo Seven', value: 40000, prob: 55 }
  ];

  const activity = activities[Math.floor(Math.random() * activities.length)];

  return {
    title: activity.title,
    description: `Discover ${activity.title.toLowerCase()} in ${activity.property}. Perfect for adventurous guests like you.`,
    category: 'activity',
    property: activity.property,
    estimatedValue: activity.value,
    conversionProbability: activity.prob,
    targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    reasoning: 'Based on similar guests\' booking patterns and your profile'
  };
}

/**
 * Generate wellness recommendation
 */
function generateWellnessRecommendation(input: RecommendationInput): Recommendation {
  const wellness = [
    { title: 'Ayurvedic Spa Retreat (3 nights)', value: 180000 },
    { title: 'Yoga & Meditation Package', value: 95000 },
    { title: 'Wellness Consultation & Treatment', value: 65000 }
  ];

  const package_ = input.loyaltyTier === 'Platinum' 
    ? wellness[0]
    : input.loyaltyTier === 'Gold'
    ? wellness[1]
    : wellness[2];

  return {
    title: package_.title,
    description: `Rejuvenate with our exclusive ${package_.title.toLowerCase()} program. Tailored to your wellness preferences.`,
    category: 'wellness',
    property: 'Jetwing Lake',
    estimatedValue: package_.value,
    conversionProbability: input.sentimentScore < 0.5 ? 70 : 55,
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    reasoning: 'Recommended for guests seeking premium relaxation experiences'
  };
}

/**
 * Generate early bird/seasonal offer
 */
function generateEarlyBirdOffer(input: RecommendationInput, seasonalFactor: number): Recommendation {
  const discountTiers: Record<string, number> = {
    'Platinum': 25,
    'Gold': 20,
    'Silver': 15,
    'Bronze': 10
  };

  const discount = discountTiers[input.loyaltyTier] || 10;

  return {
    title: `${discount}% Off Peak Season Bookings`,
    description: `Book now for peak season (Dec-Jan) and save ${discount}% on room rates. Valid for early bookings.`,
    category: 'early_bird',
    property: 'All properties',
    estimatedValue: 120000,
    conversionProbability: seasonalFactor > 0.7 ? 80 : 60,
    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    reasoning: 'Time-sensitive offer to drive early bookings during peak season'
  };
}

/**
 * Generate package recommendation
 */
function generatePackageRecommendation(input: RecommendationInput): Recommendation {
  const packages = [
    {
      title: 'Honeymoon Romance Package',
      description: 'Romantic dinner, couple spa, guided tour included',
      value: 250000
    },
    {
      title: 'Family Adventure Package',
      description: 'Room for 4, activities, kids entertainment included',
      value: 300000
    },
    {
      title: 'Corporate Team Building',
      description: 'Meeting facilities, team activities, catering included',
      value: 400000
    }
  ];

  const package_ = packages[Math.floor(Math.random() * packages.length)];

  return {
    title: package_.title,
    description: package_.description,
    category: 'package',
    property: 'Jetwing Yala',
    estimatedValue: package_.value,
    conversionProbability: 65,
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    reasoning: 'Curated based on guest segment and booking history'
  };
}

/**
 * Main recommendation engine
 */
export function generateRecommendations(input: RecommendationInput): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const preferences = analyzePreferences(input.stays);

  // Generate recommendations based on loyalty tier and profile
  recommendations.push(generateRoomUpgrade(input, preferences));
  recommendations.push(generateDiningRecommendation(input));
  recommendations.push(generateActivityRecommendation(input));

  if (input.sentimentScore < 0.6) {
    // Guest might be dissatisfied - prioritize wellness
    recommendations.push(generateWellnessRecommendation(input));
  }

  if (input.seasonalityFactor > 0.6) {
    recommendations.push(generateEarlyBirdOffer(input, input.seasonalityFactor));
  }

  // Only high-value guests get package offers
  if (input.loyaltyTier === 'Platinum' || input.loyaltyTier === 'Gold') {
    recommendations.push(generatePackageRecommendation(input));
  }

  // Sort by conversion probability
  return recommendations.sort((a, b) => b.conversionProbability - a.conversionProbability);
}

/**
 * Calculate recommendation ROI
 */
export function calculateRecommendationROI(
  recommendation: Recommendation,
  conversionRate: number = recommendation.conversionProbability / 100
): { expectedRevenue: number; recommendationCost: number; roi: number } {
  const expectedRevenue = recommendation.estimatedValue * conversionRate;
  const recommendationCost = 5000; // Fixed cost for recommendation delivery

  return {
    expectedRevenue,
    recommendationCost,
    roi: ((expectedRevenue - recommendationCost) / recommendationCost) * 100
  };
}
