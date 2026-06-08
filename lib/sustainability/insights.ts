export interface ArticleSummary {
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  url: string;
  image?: string;
}

export interface Insight {
  type: 'recommendation' | 'carbon' | 'resource' | 'risk' | 'saving';
  title: string;
  body: string;
  impact: string;
}

export interface InsightGenerationRequest {
  metrics: Record<string, number>;
  articles: ArticleSummary[];
}

export interface InsightGenerationResponse {
  data?: Insight[];
  error?: string;
}
