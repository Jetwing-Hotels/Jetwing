/**
 * API Route for Next-Best-Offer Recommendations
 * Endpoint: /api/guests/[id]/recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { NBORecommendationEngine } from '@/lib/models/nbo-recommendation';
import { GuestService } from '@/lib/services/guest-service';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Mock database
function getMockGuestForNBO(guestId: string) {
  const guests: Record<string, any> = {
    '1': {
      guestId: '1',
      name: 'Sarah Mitchell',
      tier: 'Platinum',
      lifetimeValue: 450000,
      averageSpendPerNight: 10000,
      preferenceScore: 92,
      favoriteRoomType: 'Suite',
      favoriteProperty: 'lake',
      recentSpends: {
        spa: 15000,
        dining: 22000,
        activities: 8000
      },
      lastStayRating: 4.8,
      daysUntilNextBooking: 35,
      seasonality: 'peak'
    },
    '2': {
      guestId: '2',
      name: 'James Wilson',
      tier: 'Gold',
      lifetimeValue: 280000,
      averageSpendPerNight: 10000,
      preferenceScore: 72,
      favoriteRoomType: 'Family',
      favoriteProperty: 'blue',
      recentSpends: {
        spa: 2000,
        dining: 12000,
        activities: 5000
      },
      lastStayRating: 4.5,
      daysUntilNextBooking: 47,
      seasonality: 'shoulder'
    },
    '3': {
      guestId: '3',
      name: 'Elena Rodriguez',
      tier: 'Silver',
      lifetimeValue: 156000,
      averageSpendPerNight: 12000,
      preferenceScore: 65,
      favoriteRoomType: 'Superior',
      favoriteProperty: 'colombo',
      recentSpends: {
        spa: 0,
        dining: 8000,
        activities: 0
      },
      lastStayRating: 4.2,
      daysUntilNextBooking: 87,
      seasonality: 'low'
    }
  };

  return guests[guestId] || null;
}

/**
 * GET /api/guests/[id]/recommendations
 * Generate Next-Best-Offers for a specific guest
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guestId = params.id;
    const guest = getMockGuestForNBO(guestId);

    if (!guest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Guest not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    // Generate NBO recommendations
    const offers = NBORecommendationEngine.generateNBO(guest);

    // Calculate expected uplift
    const uplift = NBORecommendationEngine.calculateExpectedUplift(offers);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        guestId,
        guestName: guest.name,
        guestTier: guest.tier,
        offers,
        summary: {
          totalOffersGenerated: offers.length,
          primaryOffer: offers[0] || null,
          totalPotentialRevenue: uplift.totalPotentialRevenue,
          totalExpectedRevenue: uplift.totalExpectedRevenue,
          expectedConversionRate: uplift.expectedConversion,
          recommendationStrategy: this.getRecommendationStrategy(guest)
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Determine recommendation strategy based on guest profile
 */
function getRecommendationStrategy(guest: any): string {
  if (guest.tier === 'Platinum') {
    return 'VIP retention and premium upsell focus';
  } else if (guest.tier === 'Gold') {
    if (guest.lastStayRating < 4.3) {
      return 'Satisfaction recovery with retention offers';
    }
    return 'Growth acceleration with cross-sell focus';
  } else {
    if (guest.daysUntilNextBooking > 120) {
      return 'Win-back campaign with attractive incentives';
    }
    return 'Tier elevation through premium experiences';
  }
}
