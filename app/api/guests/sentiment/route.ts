/**
 * API Route for Sentiment Analysis
 * Endpoint: /api/guests/sentiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { SentimentAnalysisModel } from '@/lib/models/sentiment-analysis';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * POST /api/guests/sentiment
 * Analyze sentiment of guest reviews
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviews, guestRatings } = body;

    if (!reviews || !Array.isArray(reviews)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input: reviews must be an array',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Analyze individual reviews
    const analyzedReviews = reviews.map((review: any, index: number) => ({
      ...review,
      analysis: SentimentAnalysisModel.analyzeSentiment(
        review.text || review,
        guestRatings?.[index]
      )
    }));

    // Aggregate sentiment
    const aggregatedSentiment = SentimentAnalysisModel.aggregateSentiment(
      reviews.map((r: any) => r.text || r)
    );

    // Calculate sentiment trend
    const sentimentTrend = SentimentAnalysisModel.calculateSentimentTrend(
      analyzedReviews.map((r: any) => r.analysis.score)
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        individualAnalysis: analyzedReviews,
        aggregateSentiment: {
          ...aggregatedSentiment,
          trend: sentimentTrend
        },
        summary: {
          totalReviews: reviews.length,
          positiveCount: analyzedReviews.filter((r: any) => r.analysis.sentiment === 'positive').length,
          neutralCount: analyzedReviews.filter((r: any) => r.analysis.sentiment === 'neutral').length,
          negativeCount: analyzedReviews.filter((r: any) => r.analysis.sentiment === 'negative').length,
          averageSentimentScore: analyzedReviews.reduce((sum: number, r: any) => sum + r.analysis.score, 0) / reviews.length,
          topIssues: aggregatedSentiment.commonActionItems?.slice(0, 3) || [],
          topPositiveAspects: this.extractTopPositiveAspects(analyzedReviews)
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
 * GET /api/guests/sentiment
 * Get sentiment analysis for mock guest reviews
 */
export async function GET(request: NextRequest) {
  try {
    // Mock guest reviews
    const mockReviews = [
      {
        id: 'review_1',
        guestId: '1',
        guestName: 'Sarah Mitchell',
        text: 'Absolutely wonderful experience! The rooms were beautiful and comfortable, the staff was exceptional and very professional. The dining was excellent with amazing food. Totally would recommend!',
        rating: 5,
        date: '2024-11-25'
      },
      {
        id: 'review_2',
        guestId: '2',
        guestName: 'James Wilson',
        text: 'Good stay, nice beach property. However, the service was a bit slow during peak times and the cleanliness could be improved in some areas. Overall decent experience.',
        rating: 4,
        date: '2024-10-20'
      },
      {
        id: 'review_3',
        guestId: '3',
        guestName: 'Elena Rodriguez',
        text: 'Disappointing experience. The room was dirty when we arrived, service was rude, and the food was terrible. Very expensive for what you get. Would not recommend.',
        rating: 2,
        date: '2024-09-10'
      },
      {
        id: 'review_4',
        guestId: '1',
        guestName: 'Sarah Mitchell',
        text: 'Amazing stay! Fantastic amenities, beautiful location by the lake, and the staff treated us like royalty. The restaurant food was wonderful. Perfect wellness retreat!',
        rating: 5,
        date: '2024-06-20'
      },
      {
        id: 'review_5',
        guestId: '2',
        guestName: 'James Wilson',
        text: 'The property is located well but accommodations were average. Some amenities were broken, the checkout process was terrible.',
        rating: 3,
        date: '2024-08-05'
      }
    ];

    // Analyze all reviews
    const analyzedReviews = mockReviews.map(review => ({
      ...review,
      analysis: SentimentAnalysisModel.analyzeSentiment(review.text, review.rating)
    }));

    // Aggregate
    const aggregatedSentiment = SentimentAnalysisModel.aggregateSentiment(
      mockReviews.map(r => r.text)
    );

    // By guest
    const byGuest = this.groupReviewsByGuest(analyzedReviews);

    // Trend analysis
    const sentimentTrend = SentimentAnalysisModel.calculateSentimentTrend(
      analyzedReviews.map(r => r.analysis.score)
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        reviews: analyzedReviews,
        aggregateSentiment: {
          ...aggregatedSentiment,
          trend: sentimentTrend
        },
        byGuest,
        summary: {
          totalReviews: mockReviews.length,
          positiveCount: analyzedReviews.filter(r => r.analysis.sentiment === 'positive').length,
          neutralCount: analyzedReviews.filter(r => r.analysis.sentiment === 'neutral').length,
          negativeCount: analyzedReviews.filter(r => r.analysis.sentiment === 'negative').length,
          averageSentimentScore: (analyzedReviews.reduce((sum, r) => sum + r.analysis.score, 0) / mockReviews.length).toFixed(2),
          confidenceLevel: 'High'
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
 * Helper: Extract positive aspects from reviews
 */
function extractTopPositiveAspects(reviews: any[]): string[] {
  const topicCounts: Record<string, number> = {};

  reviews.forEach(review => {
    if (review.analysis.sentiment === 'positive' && review.analysis.topics) {
      review.analysis.topics.forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    }
  });

  return Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([topic]) => topic);
}

/**
 * Helper: Group reviews by guest
 */
function groupReviewsByGuest(reviews: any[]): Record<string, any> {
  const grouped: Record<string, any> = {};

  reviews.forEach(review => {
    if (!grouped[review.guestId]) {
      grouped[review.guestId] = {
        guestName: review.guestName,
        reviews: [],
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        averageSentimentScore: 0
      };
    }

    grouped[review.guestId].reviews.push({
      date: review.date,
      text: review.text,
      rating: review.rating,
      sentiment: review.analysis.sentiment,
      score: review.analysis.score
    });

    grouped[review.guestId].sentimentDistribution[review.analysis.sentiment]++;
  });

  // Calculate averages
  Object.values(grouped).forEach((group: any) => {
    group.averageSentimentScore = (
      group.reviews.reduce((sum: number, r: any) => sum + r.score, 0) / group.reviews.length
    ).toFixed(2);
  });

  return grouped;
}
