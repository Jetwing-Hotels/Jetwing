"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DashboardChart } from '@/components/charts/DashboardChart';
import { 
  ArrowLeft, Star, MapPin, Calendar, DollarSign, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle, Clock, Sparkles, Phone, Mail, MessageSquare, Share2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock data - in production would come from API
const mockGuestData = {
  guestId: '1',
  profile: {
    name: 'Sarah Mitchell',
    email: 'sarah.m@example.com',
    phone: '+44 1234 567890',
    nationality: 'United Kingdom',
    passport: 'AB123456'
  },
  stays: [
    {
      property: 'Jetwing Lake',
      checkIn: '2024-05-10',
      checkOut: '2024-05-13',
      roomType: 'Suite',
      spend: 350000,
      rating: 5
    },
    {
      property: 'Jetwing Yala',
      checkIn: '2024-03-15',
      checkOut: '2024-03-18',
      roomType: 'Suite',
      spend: 300000,
      rating: 5
    },
    {
      property: 'Jetwing Lake',
      checkIn: '2024-01-20',
      checkOut: '2024-01-23',
      roomType: 'Suite',
      spend: 200000,
      rating: 5
    }
  ],
  analytics: {
    guestId: '1',
    profileSummary: {
      name: 'Sarah Mitchell',
      tier: 'Platinum',
      lifetimeValue: 850000,
      totalVisits: 3,
      lastVisit: '2024-05-13'
    },
    sentimentAnalysis: {
      overallScore: 92,
      trend: 'improving',
      topTopics: ['Sustainability', 'Service Quality', 'Room Cleanliness'],
      issues: []
    },
    loyaltyMetrics: {
      score: 88,
      tier: 'Platinum',
      frequencyScore: 24,
      monetaryScore: 25,
      satisfactionScore: 24,
      engagementScore: 15,
      nextMilestone: 'Platinum (Max)'
    },
    churnPrediction: {
      riskScore: 12,
      riskLevel: 'low',
      interventionPriority: 'low',
      reasons: [],
      recommendedActions: ['Continue excellence in service delivery']
    },
    nextVisitPrediction: {
      predictedDate: '2024-07-15',
      confidence: 81,
      daysUntilPredicted: 63
    },
    personalizedRecommendations: [
      {
        title: 'Private Wildlife Photography Safari',
        category: 'activity',
        estimatedValue: 75000,
        conversionProbability: 85
      },
      {
        title: 'Exclusive Wellness Retreat',
        category: 'wellness',
        estimatedValue: 180000,
        conversionProbability: 72
      },
      {
        title: 'Suite Upgrade with Late Checkout',
        category: 'room_upgrade',
        estimatedValue: 50000,
        conversionProbability: 88
      }
    ],
    actionItems: [
      {
        priority: 'low',
        action: 'Send loyalty recognition - "VIP appreciation" email',
        reasoning: 'Platinum tier member with perfect satisfaction',
        expectedImpact: 'Strengthen loyalty and encourage 4th booking'
      }
    ]
  }
};

export default function GuestDetailPage() {
  const params = useParams();
  const guestId = params.id;
  const [data, setData] = useState(mockGuestData);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'history' | 'communication'>('overview');
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);

  useEffect(() => {
    // In production: fetch from API
    // const fetchGuestData = async () => {
    //   const res = await fetch(`/api/guests/${guestId}`);
    //   setData(await res.json());
    // };
    // fetchGuestData();
  }, [guestId]);

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'critical': return '#EF4444';
      case 'high': return '#F97316';
      case 'medium': return '#FFC107';
      case 'low': return '#10B981';
      default: return '#666';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'improving' ? 
      <TrendingUp className="w-4 h-4" style={{color: '#10B981'}} /> :
      trend === 'declining' ?
      <TrendingDown className="w-4 h-4" style={{color: '#EF4444'}} /> :
      <Clock className="w-4 h-4" style={{color: '#FFC107'}} />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/guests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{backgroundColor: '#E91E8C'}}>
                {data.profile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{color: '#1a1a1a'}}>{data.profile.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-1 rounded-full font-bold text-white" style={{backgroundColor: '#E91E8C'}}>
                    {data.analytics.profileSummary.tier}
                  </span>
                  <span className="text-sm" style={{color: '#999'}}>
                    {data.analytics.profileSummary.totalVisits} visits • LKR {data.analytics.profileSummary.lifetimeValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share Profile
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase">Loyalty Score</p>
            <p className="text-2xl font-bold mt-2" style={{color: '#E91E8C'}}>
              {data.analytics.loyaltyMetrics.score}/100
            </p>
            <div className="mt-2 flex items-center gap-1">
              {getTrendIcon('improving')}
              <span className="text-xs" style={{color: '#10B981'}}>Improving</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase">Churn Risk</p>
            <p className="text-2xl font-bold mt-2" style={{color: getRiskColor(data.analytics.churnPrediction.riskLevel)}}>
              {data.analytics.churnPrediction.riskScore}%
            </p>
            <span className="text-xs font-semibold mt-2 inline-block px-2 py-1 rounded" 
              style={{backgroundColor: getRiskColor(data.analytics.churnPrediction.riskLevel) + '20', color: getRiskColor(data.analytics.churnPrediction.riskLevel)}}>
              {data.analytics.churnPrediction.riskLevel}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase">Sentiment</p>
            <p className="text-2xl font-bold mt-2" style={{color: '#8B9E23'}}>
              {data.analytics.sentimentAnalysis.overallScore}/100
            </p>
            <div className="mt-2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3" 
                  style={{color: i < Math.round(data.analytics.sentimentAnalysis.overallScore / 20) ? '#FFC107' : '#E5E5E5'}} 
                  fill="currentColor"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase">Next Visit</p>
            <p className="text-lg font-bold mt-2" style={{color: '#1a1a1a'}}>
              {data.analytics.nextVisitPrediction.daysUntilPredicted}d
            </p>
            <span className="text-xs" style={{color: '#999'}}>
              {data.analytics.nextVisitPrediction.confidence}% confidence
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b" style={{borderColor: '#E5E5E5'}}>
        {(['overview', 'analytics', 'history', 'communication'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-3 font-medium text-sm border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab ? '#8B9E23' : 'transparent',
              color: activeTab === tab ? '#8B9E23' : '#999'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Mail className="w-5 h-5" style={{color: '#8B9E23'}} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Email</p>
                    <p className="font-medium">{data.profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="w-5 h-5" style={{color: '#8B9E23'}} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Phone</p>
                    <p className="font-medium">{data.profile.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="w-5 h-5" style={{color: '#8B9E23'}} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Nationality</p>
                    <p className="font-medium">{data.profile.nationality}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Stays */}
            <Card>
              <CardHeader>
                <CardTitle>Stay History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.stays.map((stay, idx) => (
                    <div key={idx} className="p-4 rounded-lg border" style={{borderColor: '#E5E5E5'}}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{stay.property}</p>
                          <p className="text-sm" style={{color: '#999'}}>{stay.roomType}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">LKR {stay.spend.toLocaleString()}</p>
                          <div className="flex gap-0.5 mt-1 justify-end">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3" 
                                style={{color: i < stay.rating ? '#FFC107' : '#E5E5E5'}} 
                                fill="currentColor"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs" style={{color: '#999'}}>
                        {new Date(stay.checkIn).toLocaleDateString()} - {new Date(stay.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{color: '#FFC107'}} />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.analytics.personalizedRecommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{borderLeftColor: '#8B9E23'}}
                    onClick={() => {
                      setSelectedRecommendation(rec);
                      setShowRecommendationModal(true);
                    }}
                  >
                    <p className="font-semibold text-sm">{rec.title}</p>
                    <p className="text-xs mt-1" style={{color: '#999'}}>Category: {rec.category}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs font-bold" style={{color: '#8B9E23'}}>
                        {rec.conversionProbability}% prob.
                      </span>
                      <span className="text-xs font-semibold">
                        LKR {rec.estimatedValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle>Action Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.analytics.actionItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{backgroundColor: '#f0fbf5', borderLeft: `3px solid #${item.priority === 'low' ? '8B9E23' : item.priority === 'medium' ? 'FFC107' : 'EF4444'}`}}>
                    <p className="font-semibold text-sm">{item.action}</p>
                    <p className="text-xs mt-1" style={{color: '#666'}}>{item.reasoning}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Frequency', value: data.analytics.loyaltyMetrics.frequencyScore, max: 25 },
                { label: 'Monetary', value: data.analytics.loyaltyMetrics.monetaryScore, max: 25 },
                { label: 'Satisfaction', value: data.analytics.loyaltyMetrics.satisfactionScore, max: 25 },
                { label: 'Engagement', value: data.analytics.loyaltyMetrics.engagementScore, max: 25 }
              ].map(metric => (
                <div key={metric.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{metric.label}</span>
                    <span className="text-sm" style={{color: '#8B9E23'}}>{metric.value}/{metric.max}</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{backgroundColor: '#E5E5E5'}}>
                    <div className="h-2 rounded-full" style={{width: `${(metric.value / metric.max) * 100}%`, backgroundColor: '#8B9E23'}}></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Overall Sentiment</p>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold" style={{color: '#8B9E23'}}>
                    {data.analytics.sentimentAnalysis.overallScore}/100
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4" 
                          style={{color: i < Math.round(data.analytics.sentimentAnalysis.overallScore / 20) ? '#FFC107' : '#E5E5E5'}} 
                          fill="currentColor"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-green-600">↑ Improving</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-3">Top Topics</p>
                <div className="flex flex-wrap gap-2">
                  {data.analytics.sentimentAnalysis.topTopics.map(topic => (
                    <span key={topic} className="text-xs px-2 py-1 rounded-full font-medium" 
                      style={{backgroundColor: '#f0f5e6', color: '#8B9E23'}}>
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Stay History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.stays.map((stay, idx) => (
                <div key={idx} className="flex gap-4 pb-6 border-b last:border-b-0" style={{borderColor: '#E5E5E5'}}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#f0f5e6'}}>
                    <Calendar className="w-6 h-6" style={{color: '#8B9E23'}} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{stay.property} - {stay.roomType}</p>
                        <p className="text-sm" style={{color: '#999'}}>
                          {new Date(stay.checkIn).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})} - {new Date(stay.checkOut).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{color: '#1a1a1a'}}>LKR {stay.spend.toLocaleString()}</p>
                        <div className="flex gap-0.5 mt-2 justify-end">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3" 
                              style={{color: i < stay.rating ? '#FFC107' : '#E5E5E5'}} 
                              fill="currentColor"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'communication' && (
        <Card>
          <CardHeader>
            <CardTitle>Communication History & Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 rounded-lg" style={{backgroundColor: '#f5f5f5'}}>
                <p className="font-semibold mb-2">Recommended Communication Strategy</p>
                <ul className="space-y-2 text-sm">
                  <li>• Email preferred (checked email open rates: 78%)</li>
                  <li>• Optimal send time: Tuesday 2-3 PM (based on history)</li>
                  <li>• Personalized luxury travel content resonates best</li>
                  <li>• Frequency: 1-2 emails per month maximum</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-3">Recent Campaigns</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-3 rounded border" style={{borderColor: '#E5E5E5'}}>
                    <span>VIP Exclusive Offer - June 1</span>
                    <span style={{color: '#10B981'}}>Opened</span>
                  </div>
                  <div className="flex justify-between p-3 rounded border" style={{borderColor: '#E5E5E5'}}>
                    <span>Summer Packages - May 15</span>
                    <span style={{color: '#10B981'}}>Opened, Clicked</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation Modal */}
      <Modal
        isOpen={showRecommendationModal}
        onClose={() => setShowRecommendationModal(false)}
        title="Push Recommendation"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowRecommendationModal(false)}>Cancel</Button>
            <Button>Push to Front Desk</Button>
          </>
        }
      >
        {selectedRecommendation && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg">{selectedRecommendation.title}</h3>
              <p className="text-sm mt-2" style={{color: '#666'}}>
                Estimated Value: LKR {selectedRecommendation.estimatedValue.toLocaleString()}
              </p>
              <p className="text-sm" style={{color: '#666'}}>
                Conversion Probability: {selectedRecommendation.conversionProbability}%
              </p>
            </div>
            <p style={{color: '#666'}}>This recommendation will be sent to the front desk staff to present to the guest during the next stay or contact.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
