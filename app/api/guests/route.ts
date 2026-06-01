/**
 * API Routes for Guest Intelligence Module
 * Endpoints: /api/guests/*
 */

import { NextRequest, NextResponse } from 'next/server';
import { GuestService } from '@/lib/services/guest-service';
import { ChurnPredictionModel } from '@/lib/models/churn-prediction';
import { SentimentAnalysisModel } from '@/lib/models/sentiment-analysis';
import { NBORecommendationEngine } from '@/lib/models/nbo-recommendation';

// Type definitions for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * GET /api/guests
 * Retrieve list of all guests with analytics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tier = searchParams.get('tier'); // Filter by tier

    // Mock guest profiles (would come from database)
    const mockGuests = [
      {
        id: '1',
        name: 'Sarah Mitchell',
        email: 'sarah.mitchell@email.com',
        phone: '+94 701 456 789',
        tier: 'Platinum',
        joinDate: '2020-01-15',
        lifetimeValue: 450000,
        totalNights: 45,
        lastStayDate: '2024-11-20',
        averageSpendPerNight: 10000,
        stays: [
          { date: '2024-11-20', property: 'Lake', nights: 3, roomType: 'Suite', rating: 4.8 },
          { date: '2024-09-10', property: 'Yala', nights: 2, roomType: 'Deluxe', rating: 4.6 }
        ],
        preferences: { roomType: 'Suite', location: 'lakefront', mealPlan: 'breakfast' },
        reviews: [
          { text: 'Exceptional! The service was absolutely wonderful. Beautiful property with comfortable rooms.', rating: 5 },
          { text: 'Amazing experience. Professional staff, excellent food, fantastic amenities.', rating: 5 }
        ]
      },
      {
        id: '2',
        name: 'James Wilson',
        email: 'james.wilson@email.com',
        phone: '+94 701 234 567',
        tier: 'Gold',
        joinDate: '2021-03-22',
        lifetimeValue: 280000,
        totalNights: 28,
        lastStayDate: '2024-10-15',
        averageSpendPerNight: 10000,
        stays: [
          { date: '2024-10-15', property: 'Blue', nights: 5, roomType: 'Family', rating: 4.5 },
          { date: '2024-08-01', property: 'Lake', nights: 2, roomType: 'Deluxe', rating: 4.3 }
        ],
        preferences: { roomType: 'Family', location: 'beachfront', mealPlan: 'full-board' },
        reviews: [
          { text: 'Great stay overall. Nice beach, though some service delays during peak times.', rating: 4 },
          { text: 'Very good property with nice amenities and friendly staff.', rating: 4 }
        ]
      },
      {
        id: '3',
        name: 'Elena Rodriguez',
        email: 'elena.rodriguez@email.com',
        phone: '+34 912 345 678',
        tier: 'Silver',
        joinDate: '2022-06-10',
        lifetimeValue: 156000,
        totalNights: 13,
        lastStayDate: '2024-09-05',
        averageSpendPerNight: 12000,
        stays: [
          { date: '2024-09-05', property: 'Colombo', nights: 3, roomType: 'Superior', rating: 4.2 }
        ],
        preferences: { roomType: 'Superior', location: 'city', mealPlan: 'breakfast' },
        reviews: [
          { text: 'Good experience but a bit expensive. Staff was helpful and location is excellent.', rating: 4 }
        ]
      }
    ];

    // Filter by tier if provided
    let filteredGuests = mockGuests;
    if (tier) {
      filteredGuests = mockGuests.filter(g => g.tier === tier);
    }

    // Apply pagination
    const paginatedGuests = filteredGuests.slice(offset, offset + limit);

    // Generate analytics for each guest using GuestService
    const guestsWithAnalytics = paginatedGuests.map(guest => {
      const analytics = GuestService.generateGuestAnalytics(
        guest as any,
        []  // Empty interactions for mock
      );

      return {
        ...guest,
        analytics
      };
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        guests: guestsWithAnalytics,
        total: filteredGuests.length,
        limit,
        offset
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
