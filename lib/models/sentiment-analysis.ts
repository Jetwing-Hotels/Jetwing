/**
 * Sentiment Analysis Model
 * NLP-based analysis of guest reviews and feedback
 */

export interface SentimentAnalysisInput {
  text: string;
  rating?: number; // 1-5 stars
  source?: 'tripadviser' | 'google' | 'booking' | 'internal' | 'email';
}

export interface SentimentAnalysisOutput {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // 0-1, where 1 is most positive
  confidence: number; // 0-100
  topics: string[];
  actionItems?: string[];
  keyPhrases: string[];
}

/**
 * Sentiment Analysis Model Implementation
 * Rule-based NLP with keyword matching and pattern recognition
 */
export class SentimentAnalysisModel {
  // Positive sentiment keywords
  private static readonly POSITIVE_KEYWORDS = new Set([
    'excellent', 'amazing', 'wonderful', 'fantastic', 'great', 'love', 'loved',
    'beautiful', 'perfect', 'outstanding', 'impressive', 'exceptional', 'superb',
    'delicious', 'comfortable', 'clean', 'friendly', 'helpful', 'professional',
    'luxury', 'elegant', 'serene', 'peaceful', 'relaxing', 'rejuvenating',
    'memorable', 'unforgettable', 'unique', 'special', 'highly recommend',
    'best', 'stellar', 'brilliant', 'gorgeous', 'breathtaking', 'stunning'
  ]);

  // Negative sentiment keywords
  private static readonly NEGATIVE_KEYWORDS = new Set([
    'terrible', 'horrible', 'awful', 'bad', 'poor', 'disappointing', 'disappointed',
    'dirty', 'noisy', 'rude', 'unprofessional', 'slow', 'cold', 'broken',
    'expensive', 'overpriced', 'waste', 'waste of money', 'worst', 'pathetic',
    'disgusting', 'uncomfortable', 'unwelcoming', 'disorganized', 'chaotic',
    'never again', 'completely unacceptable', 'failed', 'malfunction'
  ]);

  // Topic keywords for categorization
  private static readonly TOPIC_KEYWORDS: Record<string, string[]> = {
    cleanliness: ['clean', 'dirty', 'spotless', 'untidy', 'immaculate', 'dust', 'stain', 'soap', 'towel'],
    service: ['service', 'staff', 'attendant', 'waiter', 'front desk', 'helpful', 'attentive', 'responsive'],
    food: ['food', 'restaurant', 'breakfast', 'lunch', 'dinner', 'cuisine', 'coffee', 'snack', 'buffet'],
    room: ['room', 'suite', 'bedroom', 'bathroom', 'bed', 'pillow', 'view', 'comfortable'],
    location: ['location', 'position', 'view', 'scenery', 'beach', 'mountain', 'city'],
    amenities: ['pool', 'spa', 'gym', 'wifi', 'parking', 'elevator', 'facilities', 'amenities'],
    value: ['price', 'value', 'cheap', 'expensive', 'overpriced', 'worth', 'money', 'cost'],
    sustainability: ['eco', 'green', 'environmental', 'sustainable', 'recycling', 'solar', 'water'],
    entertainment: ['activities', 'entertainment', 'tour', 'experience', 'spa', 'leisure'],
    checkout: ['checkout', 'early checkout', 'late checkout', 'quick check-out']
  };

  /**
   * Analyze sentiment of review text
   */
  static analyzeSentiment(input: SentimentAnalysisInput): SentimentAnalysisOutput {
    const text = input.text.toLowerCase();
    const words = text.split(/\s+/);

    // Count positive and negative keywords
    let positiveCount = 0;
    let negativeCount = 0;
    const usedPositiveKeywords: string[] = [];
    const usedNegativeKeywords: string[] = [];

    words.forEach(word => {
      // Remove punctuation for matching
      const cleanWord = word.replace(/[^a-z0-9 ]/g, '');
      
      if (this.POSITIVE_KEYWORDS.has(cleanWord)) {
        positiveCount++;
        if (!usedPositiveKeywords.includes(cleanWord)) {
          usedPositiveKeywords.push(cleanWord);
        }
      }
      
      if (this.NEGATIVE_KEYWORDS.has(cleanWord)) {
        negativeCount++;
        if (!usedNegativeKeywords.includes(cleanWord)) {
          usedNegativeKeywords.push(cleanWord);
        }
      }
    });

    // Calculate sentiment score (0-1)
    const totalMatches = positiveCount + negativeCount;
    let sentimentScore = 0.5; // Neutral default
    
    if (totalMatches > 0) {
      sentimentScore = positiveCount / (positiveCount + negativeCount);
    }

    // Boost/reduce based on star rating if provided
    if (input.rating) {
      const ratingScore = input.rating / 5;
      sentimentScore = (sentimentScore * 0.7) + (ratingScore * 0.3);
    }

    // Determine sentiment category
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (sentimentScore >= 0.6) {
      sentiment = 'positive';
    } else if (sentimentScore <= 0.4) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    // Calculate confidence
    const confidence = Math.min(100, ((totalMatches / words.length) * 100) + 30);

    // Extract topics
    const topics = this.extractTopics(text);

    // Generate action items for negative sentiment
    const actionItems = sentiment === 'negative' 
      ? this.generateActionItems(usedNegativeKeywords, topics)
      : [];

    // Extract key phrases
    const keyPhrases = this.extractKeyPhrases(text, [...usedPositiveKeywords, ...usedNegativeKeywords]);

    return {
      sentiment,
      score: Math.round(sentimentScore * 100) / 100,
      confidence: Math.round(confidence),
      topics,
      actionItems: actionItems.length > 0 ? actionItems : undefined,
      keyPhrases
    };
  }

  /**
   * Extract topics from review text
   */
  private static extractTopics(text: string): string[] {
    const topics: string[] = [];

    Object.entries(this.TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  /**
   * Generate action items for negative feedback
   */
  private static generateActionItems(keywords: string[], topics: string[]): string[] {
    const actions: string[] = [];

    if (keywords.includes('dirty') || keywords.includes('untidy')) {
      actions.push('Review housekeeping procedures');
    }

    if (keywords.includes('rude') || keywords.includes('unprofessional')) {
      actions.push('Staff training and coaching required');
    }

    if (keywords.includes('slow') || keywords.includes('slow service')) {
      actions.push('Improve service speed and efficiency');
    }

    if (keywords.includes('cold') || keywords.includes('broken')) {
      actions.push('Check room equipment and HVAC systems');
    }

    if (keywords.includes('overpriced') || keywords.includes('expensive')) {
      actions.push('Review pricing strategy or value proposition');
    }

    if (topics.includes('cleanliness')) {
      actions.push('Deep clean and maintenance audit needed');
    }

    if (topics.includes('food')) {
      actions.push('Review kitchen quality control and menu');
    }

    return [...new Set(actions)]; // Remove duplicates
  }

  /**
   * Extract key phrases from text
   */
  private static extractKeyPhrases(text: string, keywords: string[]): string[] {
    const phrases: string[] = [];
    const words = text.split(/\s+/);

    keywords.forEach(keyword => {
      // Find context around keyword (2 words before and after)
      const keywordIndex = words.findIndex(w => w.includes(keyword));
      if (keywordIndex !== -1) {
        const start = Math.max(0, keywordIndex - 2);
        const end = Math.min(words.length, keywordIndex + 3);
        const phrase = words.slice(start, end).join(' ');
        phrases.push(phrase);
      }
    });

    return [...new Set(phrases)]; // Remove duplicates
  }

  /**
   * Batch analyze sentiments
   */
  static analyzeSentimentBatch(
    inputs: SentimentAnalysisInput[]
  ): SentimentAnalysisOutput[] {
    return inputs.map(input => this.analyzeSentiment(input));
  }

  /**
   * Calculate aggregate sentiment from multiple reviews
   */
  static aggregateSentiment(analyses: SentimentAnalysisOutput[]): {
    overallSentiment: string;
    averageScore: number;
    sentimentDistribution: Record<string, number>;
    topTopics: string[];
    commonActionItems: string[];
  } {
    if (analyses.length === 0) {
      return {
        overallSentiment: 'neutral',
        averageScore: 0.5,
        sentimentDistribution: {},
        topTopics: [],
        commonActionItems: []
      };
    }

    // Calculate average score
    const averageScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;

    // Sentiment distribution
    const sentimentDistribution: Record<string, number> = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    analyses.forEach(a => {
      sentimentDistribution[a.sentiment]++;
    });

    // Overall sentiment
    let overallSentiment = 'neutral';
    if (averageScore >= 0.6) {
      overallSentiment = 'positive';
    } else if (averageScore <= 0.4) {
      overallSentiment = 'negative';
    }

    // Top topics
    const topicCounts: Record<string, number> = {};
    analyses.forEach(a => {
      a.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    // Common action items
    const actionItemCounts: Record<string, number> = {};
    analyses.forEach(a => {
      a.actionItems?.forEach(item => {
        actionItemCounts[item] = (actionItemCounts[item] || 0) + 1;
      });
    });

    const commonActionItems = Object.entries(actionItemCounts)
      .filter(([, count]) => count >= Math.ceil(analyses.length * 0.3)) // Items appearing in 30%+ of reviews
      .sort((a, b) => b[1] - a[1])
      .map(([item]) => item);

    return {
      overallSentiment,
      averageScore: Math.round(averageScore * 100) / 100,
      sentimentDistribution,
      topTopics,
      commonActionItems
    };
  }

  /**
   * Calculate sentiment trend over time
   */
  static calculateSentimentTrend(
    analyses: SentimentAnalysisOutput[],
    periods: number = 4
  ): { period: number; averageScore: number; sentiment: string }[] {
    if (analyses.length === 0) return [];

    const itemsPerPeriod = Math.ceil(analyses.length / periods);
    const trend: { period: number; averageScore: number; sentiment: string }[] = [];

    for (let i = 0; i < periods; i++) {
      const start = i * itemsPerPeriod;
      const end = Math.min((i + 1) * itemsPerPeriod, analyses.length);
      const periodAnalyses = analyses.slice(start, end);

      if (periodAnalyses.length > 0) {
        const avgScore = periodAnalyses.reduce((sum, a) => sum + a.score, 0) / periodAnalyses.length;
        const sentiment = avgScore >= 0.6 ? 'positive' : avgScore <= 0.4 ? 'negative' : 'neutral';

        trend.push({
          period: i + 1,
          averageScore: Math.round(avgScore * 100) / 100,
          sentiment
        });
      }
    }

    return trend;
  }
}

export default SentimentAnalysisModel;
