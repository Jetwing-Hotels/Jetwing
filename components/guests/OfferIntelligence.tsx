"use client"

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  DollarSign,
  Eye,
  Plus,
  X,
  Send,
  Calendar,
  Filter,
  ThumbsUp,
  Search,
  Briefcase,
  Layers,
  ChevronDown,
  Trash2,
  Copy,
  Pause,
  RefreshCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PASSENGERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Constants for Jetwing Luxury Branding
const COLORS = {
  primary: '#B38B2D', // Jetwing Gold
  secondary: '#1a1a1a', // Black
  accent: '#D4AF37', // Lighter Gold
  border: '#E5E5E5',
  text: '#1a1a1a',
  muted: '#666',
  white: '#ffffff',
  success: '#10b981',
  error: '#ef4444',
  goldGradient: 'linear-gradient(135deg, #B38B2D 0%, #D4AF37 100%)',
};

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // 0 is Dashboard

interface Recommendation {
  id: string;
  title: string;
  image: string;
  confidence: number;
  occupancyImpact: string;
  revenueImpact: string;
  target: string;
  reason: string;
  description: string;
  hotels: string[];
  period: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  reasoningExtended: string;
  financialAnalysis: string;
  historicalResults: string;
}

interface Campaign {
  id: string;
  name: string;
  image: string;
  hotel: string;
  offerType: string;
  audience: string;
  status: 'Draft' | 'Scheduled' | 'Active' | 'Completed' | 'AI Recommended';
  revenueImpact: string;
  performance: string;
  dateCreated: string;
  description?: string;
  propertyCount?: number;
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec1',
    title: 'Safari Adventure Package',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800',
    confidence: 91,
    occupancyImpact: '+8%',
    revenueImpact: '+LKR 4.2M',
    target: 'German Guests',
    reason: 'Strong safari demand during German summer holidays.',
    description: 'A curated 3-day safari experience with luxury tented accommodation and private naturalist guides.',
    hotels: ['Jetwing Yala', 'Jetwing Safari Camp'],
    period: '01-Aug-2026 to 31-Aug-2026',
    riskLevel: 'Low',
    reasoningExtended: 'Historical data shows 32% increase in German occupancy when safari bundles are offered in Q3.',
    financialAnalysis: 'High margin due to internal excursion handling. Estimated ROI: 4.2x.',
    historicalResults: '2025 Summer: +12% German revenue at Yala.'
  },
  {
    id: 'rec2',
    title: 'Wellness Retreat Package',
    image: 'https://images.unsplash.com/photo-1544161515-4af6b1d4640b?auto=format&fit=crop&q=80&w=800',
    confidence: 87,
    occupancyImpact: '+5%',
    revenueImpact: '+LKR 2.8M',
    target: 'Repeat Guests',
    reason: 'Growing trend in wellness-seeking among platinum loyalty members.',
    description: '7-day holistic wellness program including Ayurveda treatments, yoga, and organic dining.',
    hotels: ['Jetwing Vil Uyana', 'Jetwing Ayurveda Pavilions'],
    period: '15-Sep-2026 to 15-Oct-2026',
    riskLevel: 'Low',
    reasoningExtended: 'Loyalty segments show 45% higher retention when wellness activities are included.',
    financialAnalysis: 'Stable revenue stream with high ancillary spend in Spa services.',
    historicalResults: '2025 Autumn: +15% Repeat guest stay duration.'
  },
  {
    id: 'rec3',
    title: 'Family Escape Bundle',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800',
    confidence: 85,
    occupancyImpact: '+12%',
    revenueImpact: '+LKR 3.5M',
    target: 'Indian Markets',
    reason: 'Upcoming Diwali holiday season and school breaks in urban hubs.',
    description: 'Complimentary stay for children under 12, including wildlife educational tours and kids club access.',
    hotels: ['Jetwing St. Andrew’s', 'Jetwing Lake'],
    period: '20-Oct-2026 to 10-Nov-2026',
    riskLevel: 'Medium',
    reasoningExtended: 'Family segment from India is the fastest growing demographic for multi-room bookings.',
    financialAnalysis: 'Increased occupancy offsets children stay cost through F&B revenue.',
    historicalResults: '2025 Festive: +22% Family occupancy.'
  },
  {
    id: 'rec4',
    title: 'Whale Watching Experience',
    image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&q=80&w=800',
    confidence: 82,
    occupancyImpact: '+6%',
    revenueImpact: '+LKR 1.9M',
    target: 'UK Market',
    reason: 'Peak whale watching season in Mirissa aligns with UK school half-terms.',
    description: 'Luxury catamaran whale watching tours with gourmet breakfast on board and coastal villa stays.',
    hotels: ['Jetwing Lighthouse', 'Jetwing Kurulubedda'],
    period: '15-Nov-2026 to 30-Nov-2026',
    riskLevel: 'Low',
    reasoningExtended: 'UK guests show high preference for marine wildlife excursions combined with colonial architecture.',
    financialAnalysis: 'Moderate margin. Partnership with local boat operators. ROI: 3.1x.',
    historicalResults: '2025 Winter: +8% UK revenue in Galle region.'
  },
  {
    id: 'rec5',
    title: 'Luxury Villa Upgrade',
    image: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&q=80&w=800',
    confidence: 89,
    occupancyImpact: '+4%',
    revenueImpact: '+LKR 5.1M',
    target: 'High Spenders',
    reason: 'Underutilized villa inventory during shoulder season for premium segments.',
    description: 'Exclusive upgrade offer to private villas for guests with high historical ancillary spend.',
    hotels: ['Jetwing Vil Uyana', 'Jetwing Saman Villas'],
    period: '01-Sep-2026 to 30-Sep-2026',
    riskLevel: 'Medium',
    reasoningExtended: 'Targeted at guests who spent >LKR 200k on F&B and Spa during previous stays.',
    financialAnalysis: 'High profit margin. Minimal incremental cost for villa occupancy.',
    historicalResults: '2025 Sep: +18% Villa occupancy via targeted upgrades.'
  },
  {
    id: 'rec6',
    title: 'Cultural Discovery Package',
    image: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&q=80&w=800',
    confidence: 84,
    occupancyImpact: '+9%',
    revenueImpact: '+LKR 2.4M',
    target: 'French Guests',
    reason: 'Strong interest in Sri Lankan heritage and sustainable tourism from French market.',
    description: 'Immersive cultural tour including temple visits, local craft workshops, and traditional dining.',
    hotels: ['Jetwing Lake', 'Jetwing Kaduruketha'],
    period: '10-Oct-2026 to 25-Oct-2026',
    riskLevel: 'Low',
    reasoningExtended: 'French segment historically books 4+ nights when cultural tours are bundled.',
    financialAnalysis: 'Good margin. High F&B conversion for traditional dinner experiences.',
    historicalResults: '2025 Autumn: +12% French market growth.'
  }
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Safari Adventure Summer', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Yala', offerType: 'Package', audience: 'German Market', status: 'Active', revenueImpact: 'LKR 4.2M', performance: '18.4%', dateCreated: '15-May-2026', description: 'Summer safari package with tented luxury stays and private guides.', propertyCount: 2 },
  { id: 'c2', name: 'Ayurveda Autumn', image: 'https://images.unsplash.com/photo-1544161515-4af6b1d4640b?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Blue', offerType: 'Wellness', audience: 'Repeat Guests', status: 'Scheduled', revenueImpact: 'LKR 1.5M', performance: '12.1%', dateCreated: '10-May-2026', description: '7-day Ayurveda retreat focused on detox and rejuvenation.', propertyCount: 1 },
  { id: 'c3', name: 'Family Festive Break', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing St. Andrew’s', offerType: 'Family', audience: 'Indian Markets', status: 'Draft', revenueImpact: 'LKR 3.5M', performance: '-', dateCreated: '20-May-2026', description: 'Family package with kids activities and complimentary meals.', propertyCount: 1 },
  { id: 'c4', name: 'Elite Coastal Stay', image: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Lighthouse', offerType: 'Luxury', audience: 'UK Market', status: 'Completed', revenueImpact: 'LKR 2.9M', performance: '21.5%', dateCreated: '01-May-2026', description: 'Luxury coastal villa experiences with private dining.', propertyCount: 3 },
  { id: 'c5', name: 'Whale Watching Galle', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Lighthouse', offerType: 'Excursion', audience: 'UK Market', status: 'Active', revenueImpact: 'LKR 1.2M', performance: '15.2%', dateCreated: '05-Jun-2026', description: 'Coastal whale-watching excursions with gourmet breakfast.', propertyCount: 0 },
  { id: 'rec1-c', name: 'Safari Adventure Package', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Yala', offerType: 'Package', audience: 'German Guests', status: 'AI Recommended', revenueImpact: 'LKR 4.2M', performance: '-', dateCreated: '01-Jul-2026' },
  { id: 'rec2-c', name: 'Wellness Retreat Package', image: 'https://images.unsplash.com/photo-1544161515-4af6b1d4640b?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Vil Uyana', offerType: 'Wellness', audience: 'Repeat Guests', status: 'AI Recommended', revenueImpact: 'LKR 2.8M', performance: '-', dateCreated: '01-Jul-2026' },
  { id: 'rec3-c', name: 'Family Escape Bundle', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing St. Andrew’s', offerType: 'Family', audience: 'Indian Markets', status: 'AI Recommended', revenueImpact: 'LKR 3.5M', performance: '-', dateCreated: '01-Jul-2026' },
  { id: 'rec4-c', name: 'Whale Watching Experience', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Lighthouse', offerType: 'Excursion', audience: 'UK Market', status: 'AI Recommended', revenueImpact: 'LKR 1.9M', performance: '-', dateCreated: '01-Jul-2026' },
  { id: 'rec5-c', name: 'Luxury Villa Upgrade', image: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Vil Uyana', offerType: 'Luxury', audience: 'High Spenders', status: 'AI Recommended', revenueImpact: 'LKR 5.1M', performance: '-', dateCreated: '01-Jul-2026' },
  { id: 'rec6-c', name: 'Cultural Discovery Package', image: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Lake', offerType: 'Cultural', audience: 'French Guests', status: 'AI Recommended', revenueImpact: 'LKR 2.4M', performance: '-', dateCreated: '01-Jul-2026' },
];

export default function OfferIntelligence() {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [selectedOffer, setSelectedOffer] = useState<Recommendation | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState('All Campaigns');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('Offer Type');
  const [dateRange, setDateRange] = useState('Date Range');
  const [showFilters, setShowFilters] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [showCampaignDetails, setShowCampaignDetails] = useState<Campaign | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 5;

  // Wizard State
  const [businessGoal, setBusinessGoal] = useState('Increase occupancy at Jetwing Yala during August.');
  const [additionalContext, setAdditionalContext] = useState('German summer holidays approaching.');
  const [offers, setOffers] = useState<Recommendation[]>(MOCK_RECOMMENDATIONS);
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Experience Yala Like Never Before',
    body: 'Dear {{GuestName}},\n\nEnjoy an exclusive 20% discount on Safari Experiences at Jetwing Yala. Immerse yourself in the wild heart of Sri Lanka...'
  });
  const [smsTemplate, setSmsTemplate] = useState('Enjoy 20% off Safari Experiences at Jetwing Yala. Book now: https://jetwinghotels.com');

  const topMatchingGuests = useMemo(() => {
    return PASSENGERS.slice(0, 5).map((p, i) => ({
      ...p,
      score: 98 - (i * 2)
    }));
  }, []);

  // Fixed filtering logical triggers
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
                            c.name.toLowerCase().includes(searchLower) ||
                            c.hotel.toLowerCase().includes(searchLower) ||
                            c.audience.toLowerCase().includes(searchLower) ||
                            c.offerType.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
      const matchesType = typeFilter === 'Offer Type' || typeFilter === 'All Types' || c.offerType === typeFilter;

      const matchesTab = activeDashboardTab === 'All Campaigns' ||
                        (activeDashboardTab === 'Drafts' && c.status === 'Draft') ||
                        (activeDashboardTab === 'Active' && c.status === 'Active') ||
                        (activeDashboardTab === 'Scheduled' && c.status === 'Scheduled') ||
                        (activeDashboardTab === 'Completed' && c.status === 'Completed') ||
                        (activeDashboardTab === 'AI Recommendations' && c.status === 'AI Recommended');

      return matchesSearch && matchesStatus && matchesType && matchesTab;
    });
  }, [campaigns, searchQuery, statusFilter, typeFilter, activeDashboardTab]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, typeFilter, activeDashboardTab, dateRange]);

  const handleGenerateRecommendations = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentStep(2);
    }, 1500);
  };

  const AISection = () => (
    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
       <div className="h-1.5" style={{ background: COLORS.goldGradient }} />
       <CardContent className="p-8 md:p-12">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-3xl font-serif font-bold text-slate-900">Generate AI Recommendations</h2>
                <p className="mt-2 text-slate-500">Generate personalized offers using guest behavior, booking history, hotel performance, seasonality and market trends.</p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Business Goal</label>
                <textarea
                  value={businessGoal}
                  onChange={(e) => setBusinessGoal(e.target.value)}
                  placeholder="e.g., Increase occupancy at Jetwing Yala during August."
                  className="w-full p-5 rounded-2xl border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all min-h-[100px] text-lg font-light bg-slate-50/50"
                  style={{ border: '1px solid #E2E8F0' }}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Additional Instructions</label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g., Focus on German guests. Avoid high discount campaigns."
                  className="w-full p-5 rounded-2xl border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all min-h-[100px] text-lg font-light bg-slate-50/50"
                  style={{ border: '1px solid #E2E8F0' }}
                />
              </div>

              <button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating}
                className="w-full lg:w-auto px-12 py-5 rounded-2xl text-white text-lg font-bold flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
                style={{ background: COLORS.goldGradient }}
              >
                {isGenerating ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                Generate Recommendations
              </button>
            </div>

            <div className="lg:w-1/3 bg-slate-50 rounded-[2rem] p-8 flex flex-col justify-center border border-slate-100">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">AI-analyzed guest segments</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Predictive occupancy modelling</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Real-time market trend parity</p>
                </div>
                <div className="pt-6 border-t border-slate-200">
                   <p className="text-xs text-slate-400 leading-relaxed italic">
                     "AI is helping marketing managers discover profitable offers before creating campaigns."
                   </p>
                </div>
              </div>
            </div>
          </div>
       </CardContent>
    </Card>
  );

  const handleFinishCampaign = (status: 'Active' | 'Draft') => {
    if (selectedOffer) {
      const newCampaign: Campaign = {
        id: `c${Date.now()}`,
        name: selectedOffer.title,
        image: selectedOffer.image,
        hotel: selectedOffer.hotels[0],
        offerType: 'Package',
        audience: selectedOffer.target,
        status: status,
        revenueImpact: selectedOffer.revenueImpact,
        performance: status === 'Active' ? '0.0%' : '-',
        dateCreated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
      };
      setCampaigns([newCampaign, ...campaigns]);
    }
    setCurrentStep(0);
    setSelectedOffer(null);
  };

  const renderDashboard = () => {
    const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / perPage));
    const paginatedCampaigns = filteredCampaigns.slice((page - 1) * perPage, page * perPage);
    
    return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-medium" style={{ color: COLORS.text }}>Offer Intelligence</h1>
          <p className="mt-2 text-lg font-light text-slate-500">AI-Powered Offer Recommendations & Campaign Management</p>
        </div>
        <button
          onClick={() => setShowAIModal(true)}
          className="px-8 py-4 rounded-full text-white font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          style={{ background: COLORS.goldGradient }}
        >
          <Sparkles className="w-5 h-5" /> Start AI Recommendation
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue Generated', value: 'LKR 12.4M', icon: DollarSign, trend: '+14.2%' },
          { label: 'Avg Conversion Rate', value: '18.4%', icon: TrendingUp, trend: '+1.2%' },
          { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'Active').length.toString(), icon: Target, trend: 'Active' },
          { label: 'AI Recommended Offers', value: '12', icon: Sparkles, trend: '+3 new' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-md hover:shadow-xl transition-all rounded-2xl bg-white ring-1 ring-slate-100">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-slate-50" style={{ color: COLORS.primary }}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{stat.trend}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{stat.label}</p>
              <p className="text-3xl font-bold mt-1 text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAIModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowAIModal(false)} />
          <div className="relative w-full max-w-6xl mx-6 lg:mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-auto max-h-[92vh]">
              <div className="p-4 flex justify-end">
                <Button variant="ghost" onClick={() => setShowAIModal(false)}><X className="w-5 h-5" /></Button>
              </div>
              <div className="p-8 lg:p-10">
                <AISection />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-3xl font-serif font-bold">Campaign Management</h2>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl ring-1 ring-slate-100 overflow-x-auto">
             {['All Campaigns', 'AI Recommendations', 'Drafts', 'Scheduled', 'Active', 'Completed'].map(tab => (
               <button
                key={tab}
                onClick={() => setActiveDashboardTab(tab)}
                className={cn("px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap", activeDashboardTab === tab ? "bg-white shadow-md text-slate-900" : "text-slate-500 hover:text-slate-700")}
               >
                 {tab}
               </button>
             ))}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-44">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-8 text-xs font-medium focus:ring-2 focus:ring-amber-200 outline-none appearance-none transition-all"
              >
                <option value="Date Range">Date Range</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Next 30 Days">Next 30 Days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative flex-1 md:w-40">
              <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-8 text-xs font-medium focus:ring-2 focus:ring-amber-200 outline-none appearance-none transition-all"
              >
                <option value="Offer Type">Offer Type</option>
                <option value="Package">Package</option>
                <option value="Wellness">Wellness</option>
                <option value="Family">Family</option>
                <option value="Excursion">Excursion</option>
                <option value="Luxury">Luxury</option>
                <option value="Cultural">Cultural</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative flex-1 md:w-40">
              <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-8 text-xs font-medium focus:ring-2 focus:ring-amber-200 outline-none appearance-none transition-all"
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
                <option value="AI Recommended">AI Recommended</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-visible bg-white rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Campaign Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Count</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Offer Type</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Financial Impact</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedCampaigns.length > 0 ? (
                    paginatedCampaigns.map((c) => {
                      const desc = c.description || (c.id.endsWith('-c') ? MOCK_RECOMMENDATIONS.find(r => r.id === c.id.replace('-c', ''))?.description : '') || c.audience || '-';
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md border border-slate-100 bg-slate-200">
                                <img src={c.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900 text-[15px] group-hover:text-amber-800 transition-colors">{c.name}</p>
                                <p className="text-sm text-slate-500">{desc.length > 100 ? desc.slice(0, 100) + '...' : desc}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-slate-300" />
                              <span className="text-sm text-slate-600 font-semibold">{c.propertyCount ?? 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                              {c.offerType}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5",
                              c.status === 'Active' ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" :
                              c.status === 'Scheduled' ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100" :
                              c.status === 'Draft' ? "bg-slate-100 text-slate-600 ring-1 ring-slate-200" :
                              c.status === 'AI Recommended' ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" :
                              "bg-slate-50 text-slate-400 ring-1 ring-slate-100"
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full",
                                c.status === 'Active' ? "bg-emerald-500 animate-pulse" :
                                c.status === 'Scheduled' ? "bg-sky-500" :
                                c.status === 'AI Recommended' ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                              )} />
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm font-bold text-slate-800">{c.revenueImpact}</span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <Button variant="ghost" size="sm" className="rounded-full p-2">
                              <MoreVertical className="w-4 h-4 text-slate-400" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                        No campaigns found matching the current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-800">{((page - 1) * perPage) + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(page * perPage, filteredCampaigns.length)}</span> of <span className="font-semibold text-slate-800">{filteredCampaigns.length}</span> campaigns
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/30 p-6 lg:p-12">
      {currentStep === 0 ? renderDashboard() : <div className="text-center p-12 bg-white rounded-3xl shadow-sm border">Wizard Step {currentStep} under construction. <Button onClick={() => setCurrentStep(0)} className="mt-4">Back to Dashboard</Button></div>}
    </div>
  );
}