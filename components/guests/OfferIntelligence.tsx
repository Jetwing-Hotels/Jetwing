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
  { id: 'c1', name: 'Safari Adventure Summer', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Yala', offerType: 'Package', audience: 'German Market', status: 'Active', revenueImpact: 'LKR 4.2M', performance: '18.4%', dateCreated: '15-May-2026' },
  { id: 'c2', name: 'Ayurveda Autumn', image: 'https://images.unsplash.com/photo-1544161515-4af6b1d4640b?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Blue', offerType: 'Wellness', audience: 'Repeat Guests', status: 'Scheduled', revenueImpact: 'LKR 1.5M', performance: '12.1%', dateCreated: '10-May-2026' },
  { id: 'c3', name: 'Family Festive Break', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing St. Andrew’s', offerType: 'Family', audience: 'Indian Markets', status: 'Draft', revenueImpact: 'LKR 3.5M', performance: '-', dateCreated: '20-May-2026' },
  { id: 'c4', name: 'Elite Coastal Stay', image: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Lighthouse', offerType: 'Luxury', audience: 'UK Market', status: 'Completed', revenueImpact: 'LKR 2.9M', performance: '21.5%', dateCreated: '01-May-2026' },
  { id: 'c5', name: 'Whale Watching Galle', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Lighthouse', offerType: 'Excursion', audience: 'UK Market', status: 'Active', revenueImpact: 'LKR 1.2M', performance: '15.2%', dateCreated: '05-Jun-2026' },
  { id: 'rec1-c', name: 'Safari Adventure Package', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Yala', offerType: 'Package', audience: 'German Guests', status: 'AI Recommended', revenueImpact: 'LKR 4.2M', performance: '-', dateCreated: '01-Jul-2026' },
  { id: 'rec2-c', name: 'Wellness Retreat Package', image: 'https://images.unsplash.com/photo-1544161515-4af6b1d4640b?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Vil Uyana', offerType: 'Wellness', audience: 'Repeat Guests', status: 'AI Recommended', revenueImpact: 'LKR 2.8M', performance: '-', dateCreated: '01-Jul-2026' },
  { id: 'rec3-c', name: 'Family Escape Bundle', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing St. Andrew’s', offerType: 'Family', audience: 'Indian Markets', status: 'AI Recommended', revenueImpact: 'LKR 3.5M', performance: '-', dateCreated: '01-Jul-2026' },
  { id: 'rec4-c', name: 'Whale Watching Experience', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Lighthouse', offerType: 'Excursion', audience: 'UK Market', status: 'AI Recommended', revenueImpact: 'LKR 1.9M', performance: '-', dateCreated: '01-Jul-2026' },
  { id: 'rec5-c', name: 'Luxury Villa Upgrade', image: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Vil Uyana', offerType: 'Luxury', audience: 'High Spenders', status: 'AI Recommended', revenueImpact: 'LKR 5.1M', performance: '-', dateCreated: '01-Jul-2026' },
  { id: 'rec6-c', name: 'Cultural Discovery Package', image: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&q=80&w=800', hotel: 'Jetwing Lake', offerType: 'Cultural', audience: 'French Guests', status: 'AI Recommended', revenueImpact: 'LKR 2.4M', performance: '-', dateCreated: '01-Jul-2026' },
];

export default function OfferIntelligence() {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [selectedOffer, setSelectedOffer] = useState<Recommendation | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState('All Campaigns');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [dateRange, setDateRange] = useState('All Time');
  const [showFilters, setShowFilters] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [showCampaignDetails, setShowCampaignDetails] = useState<Campaign | null>(null);

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

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
                           c.name.toLowerCase().includes(searchLower) ||
                           c.hotel.toLowerCase().includes(searchLower) ||
                           c.audience.toLowerCase().includes(searchLower) ||
                           c.offerType.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
      const matchesType = typeFilter === 'Offer Type' || c.offerType === typeFilter;

      const matchesTab = activeDashboardTab === 'All Campaigns' ||
                        (activeDashboardTab === 'Drafts' && c.status === 'Draft') ||
                        (activeDashboardTab === 'Active' && c.status === 'Active') ||
                        (activeDashboardTab === 'Scheduled' && c.status === 'Scheduled') ||
                        (activeDashboardTab === 'Completed' && c.status === 'Completed') ||
                        (activeDashboardTab === 'AI Recommendations' && c.status === 'AI Recommended');

      return matchesSearch && matchesStatus && matchesType && matchesTab;
    });
  }, [campaigns, searchQuery, statusFilter, typeFilter, activeDashboardTab]);

  const handleGenerateRecommendations = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentStep(2);
    }, 1500);
  };

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

  const renderDashboard = () => (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-medium" style={{ color: COLORS.text }}>Offer Intelligence</h1>
          <p className="mt-2 text-lg font-light text-slate-500">AI-Powered Offer Recommendations & Campaign Management</p>
        </div>
        <button
          onClick={() => {
            const el = document.getElementById('ai-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
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

      {/* AI Recommendation Section - PRIMARY FOCUS */}
      <section id="ai-section" className="scroll-mt-10">
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

                  <Button
                    onClick={handleGenerateRecommendations}
                    disabled={isGenerating}
                    className="w-full lg:w-auto px-12 py-7 rounded-2xl text-lg font-bold flex gap-3 shadow-xl hover:shadow-2xl transition-all"
                    style={{ background: COLORS.goldGradient }}
                  >
                    {isGenerating ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    Generate Recommendations
                  </Button>
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
      </section>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-3xl font-serif font-bold">Campaign Management</h2>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl ring-1 ring-slate-100">
             {['All Campaigns', 'AI Recommendations', 'Drafts', 'Scheduled', 'Active', 'Completed'].map(tab => (
               <button
                key={tab}
                onClick={() => setActiveDashboardTab(tab)}
                className={cn("px-5 py-2.5 rounded-xl text-xs font-bold transition-all", activeDashboardTab === tab ? "bg-white shadow-md text-slate-900" : "text-slate-500 hover:text-slate-700")}
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
                <option>Date Range</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Next 30 Days</option>
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
                <option>Offer Type</option>
                <option>Package</option>
                <option>Wellness</option>
                <option>Family</option>
                <option>Excursion</option>
                <option>Luxury</option>
                <option>Cultural</option>
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
                <option>All Status</option>
                <option>Active</option>
                <option>Scheduled</option>
                <option>Draft</option>
                <option>Completed</option>
                <option>AI Recommended</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <Button
              variant="outline"
              className="rounded-xl p-2.5 border-slate-100 hover:bg-slate-50 h-[38px] flex items-center gap-2 text-xs font-bold"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 text-slate-600" />
              Filters
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-visible bg-white rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Campaign Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Property</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Offer Type</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Financial Impact</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCampaigns.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md border border-slate-100 bg-slate-200">
                             <img src={c.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 text-[15px] group-hover:text-amber-800 transition-colors">{c.name}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{c.audience}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <Briefcase className="w-4 h-4 text-slate-300" />
                           <span className="text-sm text-slate-600 font-semibold">{c.hotel}</span>
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
                          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse",
                            c.status === 'Active' ? "bg-emerald-500" :
                            c.status === 'Scheduled' ? "bg-sky-500" :
                            c.status === 'AI Recommended' ? "bg-amber-500" : "bg-slate-400"
                          )} />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-0.5">
                          <p className="text-[15px] font-bold text-slate-900">{c.revenueImpact}</p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">{c.performance} ROI</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3 relative">
                          <button
                            onClick={() => {
                              if (c.status === 'AI Recommended') {
                                const recId = c.id.replace('-c', '');
                                const rec = MOCK_RECOMMENDATIONS.find(r => r.id === recId);
                                if (rec) {
                                  setSelectedOffer(rec);
                                  setCurrentStep(3);
                                }
                              } else {
                                setShowCampaignDetails(c);
                              }
                            }}
                            className="p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-amber-600 hover:shadow-md transition-all border border-transparent hover:border-slate-100"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === c.id ? null : c.id);
                              }}
                              className={cn(
                                "p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 hover:shadow-md transition-all border border-transparent hover:border-slate-100",
                                openActionMenuId === c.id && "bg-white text-slate-900 shadow-md border-slate-100"
                              )}
                            >
                              <MoreVertical className="w-4.5 h-4.5" />
                            </button>

                            {openActionMenuId === c.id && (
                              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 z-[60] py-3 animate-in fade-in zoom-in-95 duration-200">
                               {[
                                 { label: 'Edit Campaign', icon: Briefcase },
                                 { label: 'Generate Audience', icon: Users },
                                 { label: 'Generate Email', icon: Mail },
                                 { label: 'Generate SMS', icon: MessageSquare },
                                 { label: 'Duplicate Campaign', icon: Copy },
                                 { label: 'Pause Campaign', icon: Pause },
                                 { label: 'Delete Campaign', icon: Trash2, danger: true },
                               ].map((item, i) => (
                                 <button
                                  key={i}
                                  className={cn(
                                    "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors",
                                    item.danger ? "text-red-600 hover:bg-red-50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                  )}
                                 >
                                   <item.icon className="w-4 h-4" />
                                   {item.label}
                                 </button>
                               ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStepHeader = (title: string, subtitle: string) => (
    <div className="mb-12 flex justify-between items-start">
      <div>
        <h1 className="text-4xl font-serif font-medium" style={{ color: COLORS.text }}>{title}</h1>
        <p className="mt-2 text-lg font-light text-slate-500">{subtitle}</p>
      </div>
      <button onClick={() => setCurrentStep(0)} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400">
        <X className="w-6 h-6" />
      </button>
    </div>
  );

  // Wizard Steps
  if (currentStep === 1) { // Step 1: Business Context
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
        {renderStepHeader('Generate Offer Ideas', 'Admin enters business context for AI analysis.')}

        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
           <div className="h-1" style={{ background: COLORS.goldGradient }} />
           <CardContent className="p-12 space-y-10">
              <div className="space-y-4">
                 <label className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Business Goal</label>
                 <textarea
                  value={businessGoal}
                  onChange={(e) => setBusinessGoal(e.target.value)}
                  className="w-full p-6 rounded-3xl border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all min-h-[150px] text-xl font-light"
                  style={{ border: '1px solid #E2E8F0' }}
                 />
              </div>
              <div className="space-y-4">
                 <label className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Additional Context</label>
                 <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="w-full p-6 rounded-3xl border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all min-h-[150px] text-xl font-light"
                  style={{ border: '1px solid #E2E8F0' }}
                 />
              </div>
              <Button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating}
                className="w-full py-8 rounded-3xl text-xl font-bold flex gap-3 shadow-xl hover:shadow-2xl transition-all"
                style={{ background: COLORS.goldGradient }}
              >
                {isGenerating ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                Generate Recommendations
              </Button>
           </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 2) { // Step 2: AI Recommended Offers
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        {renderStepHeader('AI Recommended Offers', 'Strategic packages discovered for your business goal.')}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {offers.map(rec => (
             <Card key={rec.id} className="border-none shadow-lg hover:shadow-2xl transition-all rounded-[2rem] overflow-hidden group bg-white ring-1 ring-slate-100">
               <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-serif font-bold group-hover:text-amber-700 transition-colors">{rec.title}</h3>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence</p>
                       <p className="text-2xl font-black" style={{ color: COLORS.primary }}>{rec.confidence}%</p>
                    </div>
                  </div>
                  <div className="space-y-4 mb-8">
                     <div className="flex justify-between text-sm"><span className="text-slate-400">Occupancy Impact:</span><span className="font-bold text-green-600">{rec.occupancyImpact}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-slate-400">Target Market:</span><span className="font-bold">{rec.target}</span></div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50 mb-8">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-2">Reason:</p>
                     <p className="text-xs leading-relaxed text-amber-900">{rec.reason}</p>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" className="flex-1 rounded-xl py-4 border-slate-200" onClick={() => { setSelectedOffer(rec); setCurrentStep(3); }}>👁 View Details</Button>
                     <Button className="flex-1 rounded-xl py-4" style={{ background: COLORS.secondary }} onClick={() => { setSelectedOffer(rec); setCurrentStep(6); }}>Continue</Button>
                  </div>
               </CardContent>
             </Card>
           ))}
        </div>

        <Card className="max-w-2xl mx-auto border-none shadow-xl rounded-[2rem] ring-1 ring-slate-100">
           <CardHeader className="border-b border-slate-50"><CardTitle className="text-lg">Refine Recommendations</CardTitle></CardHeader>
           <CardContent className="p-8 space-y-4">
              <textarea placeholder="[ Show only high-profit offers for Yala. ]" className="w-full p-4 rounded-2xl border-slate-100 outline-none focus:ring-2 focus:ring-amber-200 min-h-[80px]" />
              <Button variant="outline" className="w-full rounded-xl py-4 border-slate-200 font-bold">Refine Results</Button>
           </CardContent>
        </Card>
      </div>
    );
  }

  const CampaignDetailsModal = () => {
    if (!showCampaignDetails) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl rounded-[2.5rem] bg-white border-none relative ring-1 ring-slate-100">
          <button
            onClick={() => setShowCampaignDetails(null)}
            className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900 z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="overflow-y-auto max-h-[90vh] p-10 md:p-14">
            <div className="space-y-12">
              <div className="flex justify-between items-start">
                <div>
                  <span className={cn(
                    "px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 mb-4 inline-block",
                    showCampaignDetails.status === 'Active' ? "bg-green-50 text-green-700 ring-green-100" : "bg-slate-50 text-slate-600 ring-slate-100"
                  )}>{showCampaignDetails.status} Campaign</span>
                  <h1 className="text-4xl font-serif font-bold text-slate-900">{showCampaignDetails.name}</h1>
                  <p className="text-lg text-slate-500 mt-2 font-light">{showCampaignDetails.hotel} • {showCampaignDetails.audience}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="p-8 rounded-3xl bg-slate-50 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Forecast</p>
                    <p className="text-3xl font-bold text-slate-900">{showCampaignDetails.revenueImpact}</p>
                 </div>
                 <div className="p-8 rounded-3xl bg-slate-50 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Performance</p>
                    <p className="text-3xl font-bold text-green-600">{showCampaignDetails.performance}</p>
                 </div>
                 <div className="p-8 rounded-3xl bg-slate-50 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Launch Date</p>
                    <p className="text-3xl font-bold text-slate-900">{showCampaignDetails.dateCreated}</p>
                 </div>
              </div>

              <div className="space-y-8">
                 <section className="space-y-4">
                    <h3 className="text-xl font-bold">Email Template</h3>
                    <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm space-y-4">
                       <p className="text-sm font-bold border-b border-slate-50 pb-4">Subject: {emailTemplate.subject}</p>
                       <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{emailTemplate.body}</p>
                    </div>
                 </section>

                 <section className="space-y-4">
                    <h3 className="text-xl font-bold">SMS Template</h3>
                    <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-xl max-w-sm">
                       <p className="text-sm font-medium leading-relaxed">{smsTemplate}</p>
                    </div>
                 </section>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                 <Button variant="outline" className="rounded-xl px-8" onClick={() => setShowCampaignDetails(null)}>Close</Button>
                 <Button className="rounded-xl px-8" style={{ background: COLORS.secondary }}>Edit Campaign</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const ViewDetailsModal = () => {
    if (!selectedOffer || currentStep !== 3) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl rounded-[2.5rem] bg-white border-none relative ring-1 ring-slate-100">
          <div className="absolute top-0 left-0 right-0 h-2" style={{ background: COLORS.goldGradient }} />
          <button
            onClick={() => setCurrentStep(offers.some(o => o.id === selectedOffer.id) && currentStep === 3 ? 2 : 0)}
            className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900 z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="overflow-y-auto max-h-[90vh] p-10 md:p-14">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-14">
              <div className="md:col-span-2 space-y-12">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest ring-1 ring-amber-100">AI Recommendation</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence Score: {selectedOffer.confidence}%</span>
                  </div>
                  <h1 className="text-5xl font-serif font-bold text-slate-900 leading-tight">{selectedOffer.title}</h1>
                </div>

                <section className="space-y-4">
                   <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block">Offer Description</label>
                   <p className="text-2xl font-light text-slate-600 leading-relaxed">{selectedOffer.description}</p>
                </section>

                <div className="grid grid-cols-2 gap-10">
                   <section className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block">Recommended Hotels</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedOffer.hotels.map(h => (
                          <span key={h} className="px-4 py-2 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 ring-1 ring-slate-100">{h}</span>
                        ))}
                      </div>
                   </section>
                   <section className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block">Target Audience</label>
                      <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-600" /> {selectedOffer.target}
                      </p>
                   </section>
                </div>

                <section className="space-y-4">
                   <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block">AI Strategic Reasoning</label>
                   <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 italic text-slate-600 leading-relaxed text-lg shadow-inner">
                      &quot;{selectedOffer.reasoningExtended}&quot;
                   </div>
                </section>

                <section className="space-y-6">
                   <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block">Financial Analysis & Risk</label>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl border border-slate-100 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analysis</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{selectedOffer.financialAnalysis}</p>
                      </div>
                      <div className="p-6 rounded-2xl border border-slate-100 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historical Context</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{selectedOffer.historicalResults}</p>
                      </div>
                   </div>
                </section>
              </div>

              <div className="space-y-8">
                <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden p-1">
                   <div className="p-10 space-y-10">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Expected Revenue</p>
                        <p className="text-4xl font-serif font-bold text-amber-400">{selectedOffer.revenueImpact}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Occupancy Impact</p>
                        <p className="text-4xl font-serif font-bold text-amber-400">{selectedOffer.occupancyImpact}</p>
                      </div>
                      <div className="pt-8 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Risk Level</span>
                        <span className={cn(
                          "px-4 py-1 rounded-full text-xs font-bold ring-1",
                          selectedOffer.riskLevel === 'Low' ? "text-green-400 ring-green-900/50 bg-green-900/20" : "text-amber-400 ring-amber-900/50 bg-amber-900/20"
                        )}>{selectedOffer.riskLevel}</span>
                      </div>
                   </div>
                </Card>

                <div className="space-y-4 pt-6">
                   <Button
                    className="w-full py-7 rounded-2xl text-lg font-bold shadow-xl hover:scale-[1.02] transition-all"
                    style={{ background: COLORS.goldGradient }}
                    onClick={() => setCurrentStep(6)}
                   >
                     Generate Audience
                   </Button>
                   <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="rounded-xl py-4 border-slate-200 font-bold text-xs" onClick={() => setCurrentStep(7)}>Generate Email</Button>
                      <Button variant="outline" className="rounded-xl py-4 border-slate-200 font-bold text-xs" onClick={() => setCurrentStep(8)}>Generate SMS</Button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  if (currentStep === 6) { // Step 6: Generate Guest Audience
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-700">
        {renderStepHeader('Top Matching Guests', 'AI Targeting Engine running for ' + selectedOffer?.title)}

        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-slate-100">
           <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between p-8">
              <CardTitle className="text-xl">AI-Targeted Segment</CardTitle>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={() => setSelectedGuests(topMatchingGuests.map(g => g.id))}>Select All</Button>
                 <Button variant="ghost" size="sm" onClick={() => setSelectedGuests([])}>Clear</Button>
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                 {topMatchingGuests.map(guest => (
                   <div key={guest.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-6">
                         <button
                          onClick={() => setSelectedGuests(prev => prev.includes(guest.id) ? prev.filter(id => id !== guest.id) : [...prev, guest.id])}
                          className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all", selectedGuests.includes(guest.id) ? "bg-amber-500 border-amber-500" : "border-slate-200")}
                         >
                            {selectedGuests.includes(guest.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                         </button>
                         <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">{guest.name.split(' ').map(n => n[0]).join('')}</div>
                         <div>
                            <p className="font-bold text-lg">{guest.name}</p>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">{guest.country} • {guest.loyaltyStatus} Member</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Score</p>
                         <p className="text-2xl font-black" style={{ color: COLORS.primary }}>{guest.score}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
           <Button variant="outline" className="px-10 py-6 rounded-2xl" onClick={() => setCurrentStep(2)}>Back</Button>
           <Button className="px-12 py-6 rounded-2xl font-bold text-lg" style={{ background: COLORS.secondary }} onClick={() => setCurrentStep(7)} disabled={selectedGuests.length === 0}>
             Generate Templates <ChevronRight className="ml-2 w-5 h-5" />
           </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 7 || currentStep === 8) { // Step 7/8: Email & SMS Templates
    return (
      <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-700">
        {renderStepHeader(currentStep === 7 ? 'Generate Email Template' : 'Generate SMS Template', 'Personalized content for ' + selectedGuests.length + ' guests.')}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
           <div className="md:col-span-2 space-y-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden ring-1 ring-slate-100">
                 <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-8"><CardTitle>{currentStep === 7 ? 'Email Editor' : 'SMS Editor'}</CardTitle></CardHeader>
                 <CardContent className="p-10 space-y-8">
                    {currentStep === 7 ? (
                      <>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Subject Line</label>
                           <input value={emailTemplate.subject} onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})} className="w-full p-4 rounded-xl border border-slate-100 focus:ring-2 focus:ring-amber-200 outline-none font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message Body</label>
                           <textarea value={emailTemplate.body} onChange={(e) => setEmailTemplate({...emailTemplate, body: e.target.value})} className="w-full p-6 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-amber-200 outline-none min-h-[300px] font-light" />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SMS Content</label>
                        <textarea value={smsTemplate} onChange={(e) => setSmsTemplate(e.target.value)} className="w-full p-6 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-amber-200 outline-none min-h-[150px] font-medium" />
                        <p className="text-[10px] font-bold text-slate-400 text-right">{smsTemplate.length} Characters • {Math.ceil(smsTemplate.length / 160)} Segment(s)</p>
                      </div>
                    )}
                 </CardContent>
              </Card>
           </div>
           <div className="space-y-6">
              <Card className="border-dashed border-2 border-amber-200 rounded-[2rem] bg-amber-50/20">
                 <CardHeader><CardTitle className="text-sm">AI Optimization Insights</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex gap-3"><ThumbsUp className="w-4 h-4 text-green-600 shrink-0" /><p className="text-xs text-slate-600 font-medium">Subject line uses &quot;Exclusive&quot;, increasing open rate by 18% for high-loyalty guests.</p></div>
                    <div className="flex gap-3"><ThumbsUp className="w-4 h-4 text-green-600 shrink-0" /><p className="text-xs text-slate-600 font-medium">Dynamic placeholders detected: {"{{GuestName}}"}.</p></div>
                    <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl">Regenerate with AI</Button>
                 </CardContent>
              </Card>
              <div className="flex flex-col gap-3 pt-6">
                 <Button className="py-6 rounded-2xl font-bold text-lg shadow-xl" style={{ background: COLORS.goldGradient }} onClick={() => setCurrentStep(currentStep === 7 ? 8 : 9)}>Next Step</Button>
                 <Button variant="ghost" className="rounded-2xl py-4 text-slate-400" onClick={() => setCurrentStep(currentStep === 7 ? 8 : 9)}>Skip this channel</Button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (currentStep === 9) { // Step 9: Final Approval
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
        {renderStepHeader('Campaign Summary', 'Review and approve your personalized marketing campaign.')}

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden ring-1 ring-slate-100 bg-white">
           <CardHeader className="bg-slate-50/50 p-10 border-b border-slate-100"><CardTitle className="text-2xl font-serif">Final Approval</CardTitle></CardHeader>
           <CardContent className="p-12 space-y-12">
              <div className="grid grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Offer</label><p className="text-2xl font-serif font-bold text-slate-800">{selectedOffer?.title}</p></div>
                    <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Primary Hotel</label><p className="text-lg font-bold text-slate-700">{selectedOffer?.hotels[0]}</p></div>
                    <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Audience Size</label><p className="text-lg font-bold text-slate-700">{selectedGuests.length} Selected Guests</p></div>
                 </div>
                 <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex flex-col justify-center text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Estimated Revenue</p>
                    <p className="text-5xl font-serif font-bold" style={{ color: COLORS.primary }}>{selectedOffer?.revenueImpact}</p>
                    <div className="flex justify-center gap-4 mt-8">
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-white px-3 py-1.5 rounded-full shadow-sm"><CheckCircle2 className="w-3 h-3" /> Email Ready</span>
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-white px-3 py-1.5 rounded-full shadow-sm"><CheckCircle2 className="w-3 h-3" /> SMS Ready</span>
                    </div>
                 </div>
              </div>

              <div className="pt-12 border-t border-slate-100 flex gap-4">
                 <Button variant="outline" className="flex-1 py-8 rounded-3xl text-xl font-bold border-slate-200" onClick={() => handleFinishCampaign('Draft')}>Save Draft</Button>
                 <Button className="flex-[2] py-8 rounded-3xl text-xl font-bold shadow-2xl flex gap-3" style={{ background: COLORS.goldGradient }} onClick={() => handleFinishCampaign('Active')}>
                    <Send className="w-6 h-6" /> Send Now
                 </Button>
              </div>
           </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-10 min-h-screen bg-white selection:bg-amber-100 selection:text-amber-900">
      {renderDashboard()}
      {ViewDetailsModal()}
      {CampaignDetailsModal()}
    </div>
  );
}
