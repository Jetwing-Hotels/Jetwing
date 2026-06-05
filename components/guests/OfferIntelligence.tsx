"use client"

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  Info,
  MoreVertical,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  Eye,
  Plus,
  X,
  User,
  Send,
  Calendar,
  Filter,
  BarChart3,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PASSENGERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Constants for Jetwing Branding
const COLORS = {
  primary: '#8B9E23', // Jetwing Green
  secondary: '#E91E8C', // Jetwing Pink
  accent: '#FFC107', // Jetwing Yellow
  border: '#E5E5E5',
  text: '#1a1a1a',
  muted: '#666',
  white: '#ffffff',
  success: '#10b981',
  error: '#ef4444',
};

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // 0 is Dashboard, 9 is Final Summary

interface Campaign {
  id: string;
  name: string;
  hotel: string;
  date: string;
  status: 'Active' | 'Draft' | 'Completed';
  revenueImpact: string;
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Safari Adventure', hotel: 'Jetwing Yala', date: '15-May-2026', status: 'Active', revenueImpact: '+LKR 4.2M' },
  { id: 'c2', name: 'Wellness Retreat', hotel: 'Jetwing Blue', date: '10-May-2026', status: 'Completed', revenueImpact: '+LKR 2.8M' },
  { id: 'c3', name: 'Coastal Escape', hotel: 'Jetwing Lighthouse', date: '01-May-2026', status: 'Draft', revenueImpact: '+LKR 1.5M' },
];

interface Offer {
  id: string;
  title: string;
  confidence: number;
  reason: string;
  expectedOccupancyImpact: number;
  description: string;
  targetMarkets: string[];
  suggestedHotels: string[];
  recommendedPeriod: string;
  reasoningExtended: string;
  financialPrediction: {
    revenueImpact: string;
    occupancyImpact: string;
    profitChange: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    recommendation: 'APPROVE' | 'REJECT' | 'CAUTION';
  };
}

const MOCK_OFFERS: Offer[] = [
  {
    id: '1',
    title: 'Safari Adventure Package',
    confidence: 91,
    reason: 'German holiday season approaching. Strong historical safari demand.',
    expectedOccupancyImpact: 8,
    description: '20% discount on safari experiences',
    targetMarkets: ['Germany', 'UK', 'France'],
    suggestedHotels: ['Jetwing Yala'],
    recommendedPeriod: '01-Aug-2026 to 31-Aug-2026',
    reasoningExtended: 'Historical safari purchases increased by 32% during German summer holidays.',
    financialPrediction: {
      revenueImpact: '+LKR 4.2M',
      occupancyImpact: '+8%',
      profitChange: '+LKR 2.1M',
      riskLevel: 'Low',
      recommendation: 'APPROVE'
    }
  },
  {
    id: '2',
    title: 'Family Wildlife Package',
    confidence: 87,
    reason: 'Increased interest in family-oriented nature stays during school breaks.',
    expectedOccupancyImpact: 6,
    description: 'Complimentary stay for children under 12 with wildlife educational tours',
    targetMarkets: ['China', 'India', 'Germany'],
    suggestedHotels: ['Jetwing Yala', 'Jetwing Vil Uyana'],
    recommendedPeriod: '15-Jul-2026 to 15-Aug-2026',
    reasoningExtended: 'Family segments show 45% higher retention when wildlife activities are included.',
    financialPrediction: {
      revenueImpact: '+LKR 3.1M',
      occupancyImpact: '+6%',
      profitChange: '+LKR 1.5M',
      riskLevel: 'Low',
      recommendation: 'APPROVE'
    }
  }
];

export default function OfferIntelligence() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [businessGoal, setBusinessGoal] = useState('Increase occupancy at Jetwing Yala during August');
  const [additionalContext, setAdditionalContext] = useState('German summer holidays approaching.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Experience Yala Like Never Before',
    body: 'Dear {{GuestName}},\n\nEnjoy an exclusive 20% discount on Safari Experiences at Jetwing Yala. Immerse yourself in the wild heart of Sri Lanka...'
  });
  const [smsTemplate, setSmsTemplate] = useState('Enjoy 20% off Safari Experiences at Jetwing Yala. Book now: https://jetwinghotels.com');

  const topMatchingGuests = useMemo(() => {
    return PASSENGERS.slice(0, 3).map((p, i) => ({
      ...p,
      score: 98 - (i * 2)
    }));
  }, []);

  const handleGenerateRecommendations = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentStep(2);
    }, 1500);
  };

  const handleRefine = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setOffers([MOCK_OFFERS[0]]); // Simulate refinement
    }, 1000);
  };

  const handleSelectOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setCurrentStep(6); // Step 6: Generate Guest Audience
  };

  const toggleGuestSelection = (id: number) => {
    setSelectedGuests(prev =>
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    );
  };

  const selectAllGuests = () => {
    setSelectedGuests(topMatchingGuests.map(g => g.id));
  };

  const renderStepHeader = (title: string, subtitle: string, showDashboardButton = false) => (
    <div className="mb-8 flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: COLORS.text }}>{title}</h1>
        <p className="mt-1" style={{ color: COLORS.muted }}>{subtitle}</p>
      </div>
      {showDashboardButton && (
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(0)} className="flex gap-2">
          <X className="w-4 h-4" /> Exit to Dashboard
        </Button>
      )}
    </div>
  );

  // Step 0: Dashboard
  if (currentStep === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-end">
          {renderStepHeader('Offer Intelligence', 'AI-Powered Offer Recommendations & Campaign Management', false)}
          <Button
            onClick={() => setCurrentStep(1)}
            className="mb-8 py-6 px-6 rounded-xl flex gap-2 text-lg shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: COLORS.secondary }}
          >
            <Plus className="w-5 h-5" /> Start AI Recommendation
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Revenue Generated', value: 'LKR 12.4M', icon: DollarSign, color: COLORS.primary },
            { label: 'Avg. Conversion Rate', value: '18.4%', icon: TrendingUp, color: COLORS.accent },
            { label: 'Active Campaigns', value: '4', icon: Target, color: COLORS.secondary },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>{stat.label}</p>
                    <p className="text-2xl font-black" style={{ color: COLORS.text }}>{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="border-b" style={{ borderColor: COLORS.border }}>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Campaigns</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: COLORS.border, backgroundColor: '#FAFAFA' }}>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Campaign Name</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Hotel</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Date</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Status</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-right" style={{ color: COLORS.muted }}>Revenue Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold">{campaign.name}</td>
                      <td className="p-4 text-sm">{campaign.hotel}</td>
                      <td className="p-4 text-sm">{campaign.date}</td>
                      <td className="p-4 text-sm">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                          campaign.status === 'Active' ? "bg-green-100 text-green-700" :
                          campaign.status === 'Draft' ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-700"
                        )}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-right" style={{ color: COLORS.primary }}>{campaign.revenueImpact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Generate Offer Ideas
  if (currentStep === 1) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        {renderStepHeader('Offer Intelligence', 'AI-Powered Offer Recommendations', true)}

        <Card>
          <CardHeader className="border-b" style={{ borderColor: COLORS.border }}>
            <CardTitle>Generate Offer Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>Business Goal</label>
              <textarea
                value={businessGoal}
                onChange={(e) => setBusinessGoal(e.target.value)}
                placeholder="e.g. Increase occupancy at Jetwing Yala during August"
                className="w-full p-4 rounded-xl border outline-none focus:ring-2 transition-all min-h-[100px]"
                style={{ borderColor: COLORS.border }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>Additional Context</label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="e.g. German summer holidays approaching."
                className="w-full p-4 rounded-xl border outline-none focus:ring-2 transition-all min-h-[100px]"
                style={{ borderColor: COLORS.border }}
              />
            </div>

            <Button
              onClick={handleGenerateRecommendations}
              className="w-full py-6 text-lg rounded-xl flex gap-2"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Analyzing Trends & Calendars...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {isGenerating && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 opacity-50 pointer-events-none">
            {['Jetwing occupancy', 'Historical bookings', 'Tourist trends', 'Holiday calendars', 'Weather', 'Campaign performance'].map((item) => (
              <div key={item} className="p-4 rounded-lg border bg-slate-50 flex items-center gap-2 animate-pulse" style={{ borderColor: COLORS.border }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.primary }} />
                <span className="text-xs font-medium">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 2-5: AI Recommended Offers (with details, financials, refine)
  if (currentStep === 2) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          {renderStepHeader('AI Recommended Offers', 'Based on your business context and real-time market data.', true)}
          <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Context
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="relative group">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>{offer.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${COLORS.primary}20`, color: COLORS.primary }}>
                        Confidence: {offer.confidence}%
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-1 rounded-full hover:bg-slate-100 peer">
                      <MoreVertical className="w-5 h-5" style={{ color: COLORS.muted }} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border rounded-xl shadow-xl z-10 hidden peer-hover:block hover:block" style={{ borderColor: COLORS.border }}>
                      <div className="p-2 space-y-1">
                        {[
                          { label: 'View Details', icon: Eye, action: () => { setSelectedOffer(offer); setShowOfferDetails(true); } },
                          { label: 'Evaluate Financial Impact', icon: DollarSign, action: () => { setSelectedOffer(offer); setShowFinancials(true); } },
                          { label: 'Generate Audience', icon: Users, action: () => handleSelectOffer(offer) },
                          { label: 'Generate Email Template', icon: Mail, action: () => { setSelectedOffer(offer); setCurrentStep(7); } },
                          { label: 'Generate SMS Template', icon: MessageSquare, action: () => { setSelectedOffer(offer); setCurrentStep(8); } },
                          { label: 'Edit Offer', icon: Plus, action: () => {} },
                          { label: 'Delete', icon: X, action: () => {}, danger: true },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={item.action}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                              item.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>Reason:</p>
                  <p className="text-sm font-medium" style={{ color: COLORS.text }}>{offer.reason}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border" style={{ borderColor: COLORS.border }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: COLORS.muted }}>Expected Occupancy Impact:</span>
                    <span className="text-lg font-bold" style={{ color: COLORS.primary }}>+{offer.expectedOccupancyImpact}%</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedOffer(offer);
                      setShowOfferDetails(true);
                    }}
                  >
                    <Eye className="w-4 h-4" /> View Details
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleSelectOffer(offer)}
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>

              {/* Dropdown would go here - simplified as buttons for now */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 {/* Logic for More options could be added here */}
              </div>
            </Card>
          ))}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="border-b" style={{ borderColor: COLORS.border }}>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" /> Refine Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm" style={{ color: COLORS.muted }}>Not happy with these? Give AI more instructions to refine the results.</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Show only high-profit offers for Yala."
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                className="flex-1 p-3 rounded-xl border outline-none focus:ring-2 transition-all"
                style={{ borderColor: COLORS.border }}
              />
              <Button onClick={handleRefine} disabled={isGenerating}>
                {isGenerating ? 'Refining...' : 'Refine Results'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Offer Details Modal */}
        {showOfferDetails && selectedOffer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowOfferDetails(false)} />
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.border }}>
                <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>{selectedOffer.title}</h2>
                <button onClick={() => setShowOfferDetails(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-6 h-6" style={{ color: COLORS.muted }} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: COLORS.muted }}>Offer Description</label>
                  <p className="text-lg font-medium">{selectedOffer.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: COLORS.muted }}>Target Markets</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedOffer.targetMarkets.map(m => (
                        <span key={m} className="px-2 py-1 rounded bg-slate-100 text-xs font-bold">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: COLORS.muted }}>Suggested Hotels</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedOffer.suggestedHotels.map(h => (
                        <span key={h} className="px-2 py-1 rounded bg-slate-100 text-xs font-bold" style={{ color: COLORS.primary }}>{h}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: COLORS.muted }}>Recommended Period</label>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Calendar className="w-4 h-4" /> {selectedOffer.recommendedPeriod}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: COLORS.muted }}>Reasoning</label>
                  <p className="text-sm leading-relaxed" style={{ color: COLORS.muted }}>{selectedOffer.reasoningExtended}</p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border space-y-4" style={{ borderColor: COLORS.border }}>
                   <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Revenue Impact</p>
                        <p className="text-lg font-bold" style={{ color: COLORS.primary }}>{selectedOffer.financialPrediction.revenueImpact}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Occupancy Impact</p>
                        <p className="text-lg font-bold" style={{ color: COLORS.primary }}>{selectedOffer.financialPrediction.occupancyImpact}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Confidence</p>
                        <p className="text-lg font-bold" style={{ color: COLORS.primary }}>{selectedOffer.confidence}%</p>
                      </div>
                   </div>
                </div>
              </div>
              <div className="p-6 border-t bg-slate-50 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowFinancials(true)}>
                  Evaluate Financial Impact
                </Button>
                <Button className="flex-1" onClick={() => {
                  setShowOfferDetails(false);
                  handleSelectOffer(selectedOffer);
                }}>
                  Select & Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Financial Feasibility Check Modal */}
        {showFinancials && selectedOffer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowFinancials(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.border }}>
                <h2 className="text-xl font-bold">Financial Evaluation</h2>
                <button onClick={() => setShowFinancials(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                   <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: COLORS.muted }}>Offer</p>
                   <p className="text-lg font-bold">{selectedOffer.title}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: COLORS.border }}>
                    <span className="text-sm font-medium">Predicted Occupancy Change</span>
                    <span className="font-bold text-green-600">{selectedOffer.financialPrediction.occupancyImpact}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: COLORS.border }}>
                    <span className="text-sm font-medium">Predicted Revenue Change</span>
                    <span className="font-bold text-green-600">{selectedOffer.financialPrediction.revenueImpact}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: COLORS.border }}>
                    <span className="text-sm font-medium">Predicted Profit Change</span>
                    <span className="font-bold text-green-600">{selectedOffer.financialPrediction.profitChange}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                  <span className="text-sm font-bold uppercase tracking-wider">Risk Level</span>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    selectedOffer.financialPrediction.riskLevel === 'Low' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {selectedOffer.financialPrediction.riskLevel}
                  </span>
                </div>

                <div className="p-6 rounded-2xl border-2 text-center space-y-2" style={{ borderColor: selectedOffer.financialPrediction.recommendation === 'APPROVE' ? COLORS.primary : COLORS.secondary }}>
                   <p className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Recommendation</p>
                   <p className="text-3xl font-black" style={{ color: selectedOffer.financialPrediction.recommendation === 'APPROVE' ? COLORS.primary : COLORS.secondary }}>
                     {selectedOffer.financialPrediction.recommendation}
                   </p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                 <Button className="w-full" onClick={() => setShowFinancials(false)}>Close Evaluation</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 6: Generate Guest Audience
  if (currentStep === 6) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
          {renderStepHeader('Generate Guest Audience', 'AI Targeting Engine identifies the best match for your offer.', true)}
          <Button variant="outline" onClick={() => setCurrentStep(2)}>Back to Offers</Button>
        </div>

        <Card>
          <CardHeader className="border-b flex flex-row items-center justify-between" style={{ borderColor: COLORS.border }}>
            <CardTitle>Top Matching Guests</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAllGuests}>Select All</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedGuests([])}>Clear</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y" style={{ borderColor: COLORS.border }}>
              {topMatchingGuests.map((guest) => (
                <div key={guest.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleGuestSelection(guest.id)}
                      className={cn(
                        "w-6 h-6 border-2 rounded flex items-center justify-center transition-all",
                        selectedGuests.includes(guest.id) ? "bg-green-600 border-green-600" : "border-slate-300"
                      )}
                      style={{
                        backgroundColor: selectedGuests.includes(guest.id) ? COLORS.primary : 'transparent',
                        borderColor: selectedGuests.includes(guest.id) ? COLORS.primary : '#CBD5E1'
                      }}
                    >
                      {selectedGuests.includes(guest.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: COLORS.primary }}>
                       {guest.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: COLORS.text }}>{guest.name}</p>
                      <p className="text-xs" style={{ color: COLORS.muted }}>{guest.email} • {guest.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Match Score</span>
                    <p className="text-lg font-black" style={{ color: COLORS.primary }}>{guest.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button
            className="px-8 py-6 text-lg rounded-xl flex gap-2"
            disabled={selectedGuests.length === 0}
            onClick={() => setCurrentStep(7)}
          >
            Continue to Messaging <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 7-8: Generate Email & SMS
  if (currentStep === 7 || currentStep === 8) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
          {renderStepHeader(
            currentStep === 7 ? 'Generate Email Template' : 'Generate SMS Template',
            'Personalized messaging based on offer and audience insights.',
            true
          )}
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => setCurrentStep(currentStep === 7 ? 6 : 7)}>
               <ArrowLeft className="w-4 h-4 mr-2" /> Back
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {currentStep === 7 ? (
              <Card>
                <CardHeader className="border-b" style={{ borderColor: COLORS.border }}>
                  <CardTitle>Email Editor</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Subject</label>
                    <input
                      type="text"
                      value={emailTemplate.subject}
                      onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                      className="w-full p-3 rounded-xl border outline-none focus:ring-2"
                      style={{ borderColor: COLORS.border }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Email Content</label>
                    <textarea
                      value={emailTemplate.body}
                      onChange={(e) => setEmailTemplate({...emailTemplate, body: e.target.value})}
                      className="w-full p-4 rounded-xl border outline-none focus:ring-2 min-h-[300px] font-sans"
                      style={{ borderColor: COLORS.border }}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="border-b" style={{ borderColor: COLORS.border }}>
                  <CardTitle>SMS Editor</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                   <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>SMS Template</label>
                    <textarea
                      value={smsTemplate}
                      onChange={(e) => setSmsTemplate(e.target.value)}
                      className="w-full p-4 rounded-xl border outline-none focus:ring-2 min-h-[150px]"
                      style={{ borderColor: COLORS.border }}
                    />
                    <div className="flex justify-between text-[10px] font-bold" style={{ color: COLORS.muted }}>
                      <span>Characters: {smsTemplate.length}</span>
                      <span>Segments: {Math.ceil(smsTemplate.length / 160)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
             <Card className="bg-slate-50 border-dashed" style={{ borderColor: COLORS.primary }}>
               <CardHeader>
                 <CardTitle className="text-sm">AI Insights</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-600 shrink-0" />
                    <p className="text-xs">Subject line has 22% higher open rate for European markets.</p>
                  </div>
                  <div className="flex gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-600 shrink-0" />
                    <p className="text-xs">Mentioning "exclusive" increases CTR by 15%.</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Re-generate Template
                  </Button>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle className="text-sm">Recipient Summary</CardTitle>
               </CardHeader>
               <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: COLORS.muted }}>Selected Guests:</span>
                    <span className="font-bold">{selectedGuests.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: COLORS.muted }}>Primary Hotel:</span>
                    <span className="font-bold">{selectedOffer?.suggestedHotels[0]}</span>
                  </div>
               </CardContent>
             </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
           <Button variant="outline" onClick={() => setCurrentStep(currentStep === 7 ? 8 : 9)}>
             Skip {currentStep === 7 ? 'Email' : 'SMS'}
           </Button>
           <Button
            className="px-8 py-6 text-lg rounded-xl flex gap-2"
            onClick={() => setCurrentStep(currentStep === 7 ? 8 : 9)}
           >
             Next Step <ChevronRight className="w-5 h-5" />
           </Button>
        </div>
      </div>
    );
  }

  // Step 9: Final Approval Screen
  if (currentStep === 9) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        {renderStepHeader('Campaign Summary', 'Review and approve your personalized marketing campaign.', true)}

        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-50 border-b" style={{ borderColor: COLORS.border }}>
            <CardTitle>Final Review</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: COLORS.muted }}>Offer</label>
                    <p className="text-lg font-bold">{selectedOffer?.title}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: COLORS.muted }}>Hotel</label>
                    <p className="font-bold">{selectedOffer?.suggestedHotels.join(', ')}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: COLORS.muted }}>Target Audience</label>
                    <p className="font-bold">{selectedGuests.length} Guests</p>
                  </div>
                </div>
                <div className="space-y-6 p-6 rounded-2xl bg-slate-50 border" style={{ borderColor: COLORS.border }}>
                   <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: COLORS.muted }}>Expected Revenue</label>
                    <p className="text-2xl font-black" style={{ color: COLORS.primary }}>{selectedOffer?.financialPrediction.revenueImpact}</p>
                  </div>
                  <div className="flex gap-4 pt-4">
                     <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: COLORS.success }}>
                        <CheckCircle2 className="w-4 h-4" /> Email Ready
                     </div>
                     <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: COLORS.success }}>
                        <CheckCircle2 className="w-4 h-4" /> SMS Ready
                     </div>
                  </div>
                </div>
             </div>

             <div className="pt-8 border-t space-y-4" style={{ borderColor: COLORS.border }}>
                <p className="text-sm font-medium" style={{ color: COLORS.muted }}>Schedule Campaign</p>
                <div className="flex gap-3">
                   <Button
                    variant="outline"
                    className="flex-1 py-6"
                    onClick={() => {
                      if (selectedOffer) {
                        const newCampaign: Campaign = {
                          id: `c${Date.now()}`,
                          name: selectedOffer.title,
                          hotel: selectedOffer.suggestedHotels[0],
                          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
                          status: 'Draft',
                          revenueImpact: selectedOffer.financialPrediction.revenueImpact
                        };
                        setCampaigns([newCampaign, ...campaigns]);
                      }
                      setCurrentStep(0);
                    }}
                   >
                    Save Draft
                   </Button>
                   <Button variant="outline" className="flex-1 py-6">Schedule for Later</Button>
                   <Button
                    className="flex-[2] py-6 text-xl rounded-xl flex gap-2"
                    style={{ backgroundColor: COLORS.secondary }}
                    onClick={() => {
                      if (selectedOffer) {
                        const newCampaign: Campaign = {
                          id: `c${Date.now()}`,
                          name: selectedOffer.title,
                          hotel: selectedOffer.suggestedHotels[0],
                          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
                          status: 'Active',
                          revenueImpact: selectedOffer.financialPrediction.revenueImpact
                        };
                        setCampaigns([newCampaign, ...campaigns]);
                      }
                      setCurrentStep(0);
                    }}
                   >
                     Send Now <Send className="w-5 h-5" />
                   </Button>
                </div>
             </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
           <button
            onClick={() => setCurrentStep(0)}
            className="text-sm font-bold underline flex items-center gap-1"
            style={{ color: COLORS.muted }}
           >
             <ArrowLeft className="w-4 h-4" /> Back to Dashboard
           </button>
        </div>
      </div>
    );
  }

  return null;
}
