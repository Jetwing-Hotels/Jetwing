import { GuestProfile, GuestStay } from '@/lib/guest-intelligence';

/**
 * Sentiment Analysis ML Model
 * Natural Language Processing for guest reviews
 */

interface Review {
  text: string;
  rating: number;
}

interface SentimentResult {
  score: number; // 0-1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
  topics: string[];
}

/**
 * Extract sentiment from text using keyword-based analysis
 * In production, would use Hugging Face or similar ML service
 */
export function analyzeSentiment(text: string, rating: number): SentimentResult {
  const lowerText = text.toLowerCase();

  // Sentiment keywords
  const positiveKeywords = [
    'excellent', 'amazing', 'wonderful', 'fantastic', 'beautiful', 'lovely',
    'great', 'awesome', 'perfect', 'impressed', 'delighted', 'loved',
    'outstanding', 'superb', 'exceptional', 'outstanding', 'phenomenal'
  ];

  const negativeKeywords = [
    'terrible', 'awful', 'horrible', 'bad', 'poor', 'disappointing',
    'dirty', 'rude', 'expensive', 'broken', 'slow', 'loud', 'cold',
    'uncomfortable', 'disgusting', 'dreadful', 'pathetic'
  ];

  const neutralKeywords = [
    'okay', 'fine', 'average', 'decent', 'acceptable', 'so-so'
  ];

  // Count keywords
  let positiveCount = positiveKeywords.filter(k => lowerText.includes(k)).length;
  let negativeCount = negativeKeywords.filter(k => lowerText.includes(k)).length;
  let neutralCount = neutralKeywords.filter(k => lowerText.includes(k)).length;

  // Combine with rating (rating is more reliable)
  const ratingScore = rating / 5;
  const textWeight = 0.3;
  const ratingWeight = 0.7;

  let textScore = 0.5;
  if (positiveCount > negativeCount) {
    textScore = 0.5 + (positiveCount / (Math.max(1, positiveCount + negativeCount))) * 0.5;
  } else if (negativeCount > positiveCount) {
    textScore = 0.5 - (negativeCount / (Math.max(1, positiveCount + negativeCount))) * 0.5;
  }

  const combinedScore = (textScore * textWeight) + (ratingScore * ratingWeight);
  const score = Math.max(0, Math.min(1, combinedScore));

  // Determine label
  let label: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (score > 0.65) label = 'positive';
  else if (score < 0.35) label = 'negative';

  // Extract topics
  const topics = extractTopics(lowerText);

  // Confidence based on text length and keyword matches
  const confidence = Math.min(
    100,
    Math.max(0.5, (text.split(' ').length / 100) * 100 + positiveCount * 10 + negativeCount * 10)
  );

  return {
    score: Math.round(score * 100) / 100,
    label,
    confidence: Math.round(confidence),
    topics
  };
}

/**
 * Extract topics from review text
 */
function extractTopics(text: string): string[] {
  const topics: string[] = [];

  const topicKeywords: Record<string, string[]> = {
    'Service Quality': ['service', 'staff', 'friendly', 'helpful', 'rude', 'polite', 'attentive'],
    'Room Cleanliness': ['clean', 'dirty', 'spotless', 'dusty', 'housekeeping', 'tidy'],
    'Food & Beverage': ['food', 'breakfast', 'dinner', 'restaurant', 'taste', 'delicious', 'cuisine'],
    'Facilities': ['room', 'bed', 'shower', 'bathroom', 'ac', 'air conditioning', 'broken', 'facility'],
    'Location': ['location', 'beach', 'view', 'scenery', 'near', 'accessible', 'remote'],
    'Value for Money': ['price', 'expensive', 'cheap', 'value', 'worth', 'overpriced'],
    'Sustainability': ['eco', 'green', 'sustainable', 'environment', 'solar', 'recyclable'],
    'Airport Transfer': ['transfer', 'pickup', 'airport', 'transport', 'shuttle'],
    'Entertainment': ['entertainment', 'activity', 'entertainment', 'pool', 'spa', 'gym']
  };

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(kw => text.includes(kw))) {
      topics.push(topic);
    }
  });

  return topics.length > 0 ? topics : ['General'];
}

/**
 * Batch sentiment analysis for multiple reviews
 */
export function analyzeSentimentBatch(reviews: Review[]): SentimentResult[] {
  return reviews.map(review => 
    analyzeSentiment(review.text, review.rating)
  );
}

/**
 * Calculate overall sentiment score from multiple reviews
 */
export function calculateAverageSentiment(sentiments: SentimentResult[]): number {
  if (sentiments.length === 0) return 0.5;
  return sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
}

/**
 * Get topic summary from sentiments
 */
export function getTopicSummary(sentiments: SentimentResult[]): Record<string, number> {
  const summary: Record<string, number> = {};

  sentiments.forEach(sentiment => {
    sentiment.topics.forEach(topic => {
      summary[topic] = (summary[topic] || 0) + sentiment.score;
    });
  });

  // Average the scores
  Object.keys(summary).forEach(topic => {
    summary[topic] = summary[topic] / sentiments.length;
  });

  return summary;
}
