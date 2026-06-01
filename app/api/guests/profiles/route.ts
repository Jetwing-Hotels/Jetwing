import { 
  calculateLifetimeValue, 
  calculateLoyaltyScore, 
  calculatePreferenceScore,
  calculateSentimentScore,
  calculateChurnRisk,
  segmentGuest,
  generatePersonalizedRecommendations
} from '@/lib/guest-intelligence';

/**
 * API handler for GET /api/guests/profiles
 * Returns guest profiles with segmentation
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock guest data - In production, fetch from database
    const mockGuests = [
      {
        id: '1',
        name: 'Sarah Mitchell',
        email: 'sarah.m@example.com',
        history: [
          { checkInDate: '2024-05-10', checkOutDate: '2024-05-13', roomType: 'Suite', amountSpent: 350000, rating: 5, notes: 'VIP guest' },
          { checkInDate: '2024-03-15', checkOutDate: '2024-03-18', roomType: 'Suite', amountSpent: 300000, rating: 5, notes: 'Excellent stay' },
          { checkInDate: '2024-01-20', checkOutDate: '2024-01-23', roomType: 'Suite', amountSpent: 200000, rating: 5, notes: 'Return guest' }
        ]
      },
      {
        id: '2',
        name: 'James Wilson',
        email: 'j.wilson@example.com',
        history: [
          { checkInDate: '2024-03-20', checkOutDate: '2024-03-22', roomType: 'Deluxe', amountSpent: 180000, rating: 4, notes: 'Good stay' },
          { checkInDate: '2024-02-10', checkOutDate: '2024-02-12', roomType: 'Superior', amountSpent: 140000, rating: 4, notes: 'Business trip' }
        ]
      },
      {
        id: '3',
        name: 'Elena Rodriguez',
        email: 'elena.r@example.com',
        history: [
          { checkInDate: '2023-11-05', checkOutDate: '2023-11-07', roomType: 'Standard', amountSpent: 85000, rating: 4, notes: 'Regular guest' }
        ]
      }
    ];

    // Process guests
    const processedGuests = mockGuests.map(guest => {
      const lifetimeValue = calculateLifetimeValue(guest.history);
      const guestTier = segmentGuest(lifetimeValue);

      return {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        tier: guestTier,
        totalSpend: lifetimeValue,
        loyaltyScore: calculateLoyaltyScore(guest.history),
        preferenceScore: calculatePreferenceScore(guest.history),
        sentimentScore: calculateSentimentScore(guest.history),
        churnRisk: calculateChurnRisk(guest.history)
      };
    });

    // Filter by tier if specified
    const filtered = tier ? processedGuests.filter(g => g.tier === tier) : processedGuests;

    return Response.json({
      success: true,
      guests: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to fetch guest profiles' },
      { status: 500 }
    );
  }
}
