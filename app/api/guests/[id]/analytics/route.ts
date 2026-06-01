/**
 * API Route for Individual Guest Analytics and Churn Prediction
 * Endpoint: /api/guests/[id]/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChurnPredictionModel } from '@/lib/models/churn-prediction';
import { GuestService } from '@/lib/services/guest-service';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Mock database function
function getMockGuestData(guestId: string) {
  const guests: Record<string, any> = {
    '1': {
      id: '1',
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@email.com',
      phone: '+94 701 456 789',
      tier: 'Platinum',
      joinDate: '2020-01-15',
      lifetimeValue: 450000,
      totalNights: 45,
      lastStayDate: '2024-11-20',
      daysSinceLastStay: 10,
      averageSpendPerNight: 10000,
      averageRating: 4.7,
      sentimentScore: 0.92,
      loyaltyScore: 95,
      cancellationRate: 0.02,
      reviewCount: 12,
      negativeReviewCount: 0,
      stays: [
        { date: '2024-11-20', property: 'Lake', nights: 3, roomType: 'Suite', rating: 4.8, spend: 35000 },
        { date: '2024-09-10', property: 'Yala', nights: 2, roomType: 'Deluxe', rating: 4.6, spend: 22000 },
        { date: '2024-06-15', property: 'Blue', nights: 4, roomType: 'Suite', rating: 4.9, spend: 42000 }
      ],
      preferences: { roomType: 'Suite', location: 'lakefront', mealPlan: 'breakfast' },
      reviews: [
        { text: 'Exceptional! The service was absolutely wonderful. Beautiful property with comfortable rooms.', rating: 5 },
        { text: 'Amazing experience. Professional staff, excellent food, fantastic amenities.', rating: 5 }
      ]
    },
    '2': {
      id: '2',
      name: 'James Wilson',
      email: 'james.wilson@email.com',
      phone: '+94 701 234 567',
      tier: 'Gold',
      joinDate: '2021-03-22',
      lifetimeValue: 280000,
      totalNights: 28,
      lastStayDate: '2024-10-15',
      daysSinceLastStay: 47,
      averageSpendPerNight: 10000,
      averageRating: 4.4,
      sentimentScore: 0.72,
      loyaltyScore: 72,
      cancellationRate: 0.05,
      reviewCount: 8,
      negativeReviewCount: 1,
      stays: [
        { date: '2024-10-15', property: 'Blue', nights: 5, roomType: 'Family', rating: 4.5, spend: 52000 },
        { date: '2024-08-01', property: 'Lake', nights: 2, roomType: 'Deluxe', rating: 4.3, spend: 18000 }
      ],
      preferences: { roomType: 'Family', location: 'beachfront', mealPlan: 'full-board' },
      reviews: [
        { text: 'Great stay overall. Nice beach, though some service delays during peak times.', rating: 4 },
        { text: 'Very good property with nice amenities and friendly staff.', rating: 4 }
      ]
    },
    '3': {
      id: '3',
      name: 'Elena Rodriguez',
      email: 'elena.rodriguez@email.com',
      phone: '+34 912 345 678',
      tier: 'Silver',
      joinDate: '2022-06-10',
      lifetimeValue: 156000,
      totalNights: 13,
      lastStayDate: '2024-09-05',
      daysSinceLastStay: 87,
      averageSpendPerNight: 12000,
      averageRating: 4.2,
      sentimentScore: 0.65,
      loyaltyScore: 58,
      cancellationRate: 0.08,
      reviewCount: 3,
      negativeReviewCount: 1,
      stays: [
        { date: '2024-09-05', property: 'Colombo', nights: 3, roomType: 'Superior', rating: 4.2, spend: 38000 }
      ],
      preferences: { roomType: 'Superior', location: 'city', mealPlan: 'breakfast' },
      reviews: [
        { text: 'Good experience but a bit expensive. Staff was helpful and location is excellent.', rating: 4 },
        { text: 'Decent property, though could improve in cleanliness and dining options.', rating: 3 }
      ]
    }
  };

  return guests[guestId] || null;
}

/**
 * GET /api/guests/[id]/analytics
 * Get detailed analytics for a specific guest including churn prediction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guestId = params.id;
    const guest = getMockGuestData(guestId);

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

    // Generate guest analytics
    const analytics = GuestService.generateGuestAnalytics(guest, []);

    // Predict churn
    const churnPrediction = ChurnPredictionModel.predictChurn({
      daysSinceLastStay: guest.daysSinceLastStay,
      averageRating: guest.averageRating,
      ratingTrend: 'stable',
      sentimentScore: guest.sentimentScore,
      sentimentTrend: 'stable',
      visitFrequency: guest.totalNights / 4, // years as proxy
      loyaltyScore: guest.loyaltyScore,
      averageSpendPerNight: guest.averageSpendPerNight,
      spendingTrend: 'stable',
      recentSpends: [guest.averageSpendPerNight * 0.9, guest.averageSpendPerNight, guest.averageSpendPerNight * 1.1],
      cancellationRate: guest.cancellationRate,
      reviewCount: guest.reviewCount,
      negativeReviewCount: guest.negativeReviewCount
    });

    // Sentiment analysis on reviews
    const sentimentAnalysis = SentimentAnalysisModel.aggregateSentiment(
      guest.reviews.map((r: any) => r.text)
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        guest,
        analytics,
        churnPrediction,
        sentimentAnalysis,
        stayHistory: guest.stays.map((stay: any) => ({
          ...stay,
          loyaltyPointsEarned: stay.spend / 50, // 1 point per 50 LKR
          memberBenefitApplied: guest.tier
        }))
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

// Import needed for the implementation
import { SentimentAnalysisModel } from '@/lib/models/sentiment-analysis';
