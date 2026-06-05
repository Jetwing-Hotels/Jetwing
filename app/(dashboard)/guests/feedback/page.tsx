"use client"

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { DashboardChart } from '@/components/charts/DashboardChart';
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Star } from 'lucide-react';

const sentimentTrends = [
  { day: 'Mon', positive: 85, neutral: 10, negative: 5 },
  { day: 'Tue', positive: 78, neutral: 15, negative: 7 },
  { day: 'Wed', positive: 92, neutral: 5, negative: 3 },
  { day: 'Thu', positive: 88, neutral: 8, negative: 4 },
  { day: 'Fri', positive: 90, neutral: 6, negative: 4 },
  { day: 'Sat', positive: 95, neutral: 4, negative: 1 },
  { day: 'Sun', positive: 93, neutral: 5, negative: 2 },
];

const recentReviews = [
  { id: 1, source: 'TripAdvisor', author: 'David L.', rating: 5, comment: "The sustainability initiatives at Jetwing Lake are truly impressive. Not just a luxury stay but an ethical one too.", topic: 'Sustainability', sentiment: 'positive' },
  { id: 2, source: 'Google Reviews', author: 'Samantha K.', rating: 4, comment: "Beautiful property but check-in took longer than expected. Staff were very polite though.", topic: 'Service', sentiment: 'neutral' },
  { id: 3, source: 'Post-stay Survey', author: 'Mark T.', rating: 2, comment: "Air conditioning in room 302 was making a loud noise all night. Couldn't sleep well.", topic: 'Facilities', sentiment: 'negative' },
];

export default function FeedbackPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Sentiment Analysis & Feedback</h1>
        <p className="text-slate-500 dark:text-slate-400">NLP-powered analysis of guest reviews and survey responses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Overall Sentiment" value="8.8/10" change={2.5} icon={MessageSquare} trend="up" />
        <StatCard title="Positive Mentions" value="1,240" change={12} icon={ThumbsUp} trend="up" />
        <StatCard title="Negative Mentions" value="42" change={-15} icon={ThumbsDown} trend="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DashboardChart 
            title="Sentiment Trends (Weekly)" 
            data={sentimentTrends} 
            dataKey="day"
            type="bar"
            categories={[
              { key: 'positive', color: '#10b981', name: 'Positive' },
              { key: 'neutral', color: '#94a3b8', name: 'Neutral' },
              { key: 'negative', color: '#ef4444', name: 'Negative' }
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Topic Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { topic: 'Sustainability', score: 95, color: 'bg-emerald-500' },
                  { topic: 'Service Quality', score: 88, color: 'bg-blue-500' },
                  { topic: 'Food & Beverage', score: 92, color: 'bg-amber-500' },
                  { topic: 'Room Cleanliness', score: 85, color: 'bg-indigo-500' },
                  { topic: 'Value for Money', score: 78, color: 'bg-slate-500' },
                ].map((item) => (
                  <div key={item.topic}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{item.topic}</span>
                      <span className="text-sm text-slate-500">{item.score}% Positive</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {recentReviews.map((review) => (
                <div key={review.id} className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800">
                  <div className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full ${
                    review.sentiment === 'positive' ? 'bg-emerald-500' :
                    review.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-400'
                  }`}></div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.source}</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{review.author}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                    ))}
                  </div>
                  <p className="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed">
                    &quot;{review.comment}&quot;
                  </p>
                  <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium text-slate-500">
                    Topic: {review.topic}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-800 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                3 mentions of &quot;noise&quot; at Jetwing Lighthouse in the last 48 hours. Engineering team notified.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
