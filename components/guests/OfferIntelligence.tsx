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
  ThumbsDown,
  Search,
  Download,
  ExternalLink,
  Briefcase,
  Layers,
  ArrowUpRight,
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
  hotel: string;
  type: string;
  audience: string;
  status: 'Draft' | 'Scheduled' | 'Active' | 'Completed';
  revenueImpact: string;
  performance: string;
  dateCreated: string;
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec1',
    title: 'Safari Adventure Package',
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
  }
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Safari Adventure Summer', hotel: 'Jetwing Yala', type: 'Package', audience: 'German Market', status: 'Active', revenueImpact: 'LKR 4.2M', performance: '18.4%', dateCreated: '15-May-2026' },
  { id: 'c2', name: 'Ayurveda Autumn', hotel: 'Jetwing Blue', type: 'Wellness', audience: 'Repeat Guests', status: 'Scheduled', revenueImpact: 'LKR 1.5M', performance: '12.1%', dateCreated: '10-May-2026' },
  { id: 'c4', name: 'Elite Coastal Stay', hotel: 'Jetwing Lighthouse', type: 'Luxury', audience: 'UK Market', status: 'Completed', revenueImpact: 'LKR 2.9M', performance: '21.5%', dateCreated: '01-May-2026' },
];

export default function OfferIntelligence() {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [selectedOffer, setSelectedOffer] = useState<Recommendation | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState('All Campaigns');

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
        hotel: selectedOffer.hotels[0],
        type: 'Package',
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
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-medium" style={{ color: COLORS.text }}>Offer Intelligence</h1>
          <p className="mt-2 text-lg font-light text-slate-500">AI-Powered Offer Recommendations & Campaign Management</p>
        </div>
        <button
          onClick={() => setCurrentStep(1)}
          className="px-8 py-4 rounded-full text-white font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          style={{ background: COLORS.goldGradient }}
        >
          <Plus className="w-5 h-5" /> Start AI Recommendation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue Generated', value: 'LKR 12.4M', icon: DollarSign, trend: '+14.2%' },
          { label: 'Avg Conversion Rate', value: '18.4%', icon: TrendingUp, trend: '+2.1%' },
          { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'Active').length.toString(), icon: Target, trend: 'Stable' },
          { label: 'AI Recommended Offers', value: '12', icon: Sparkles, trend: '+3 new' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm ring-1 ring-slate-100">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-xl bg-slate-50" style={{ color: COLORS.primary }}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{stat.trend}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-serif font-bold">Campaign Management</h2>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             {['All Campaigns', 'Drafts', 'Active', 'Completed'].map(tab => (
               <button
                key={tab}
                onClick={() => setActiveDashboardTab(tab)}
                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", activeDashboardTab === tab ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
               >
                 {tab}
               </button>
             ))}
          </div>
        </div>

        <Card className="border-none shadow-sm ring-1 ring-slate-100">
          <CardContent className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Campaign</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Hotel</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Revenue</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-sm">{c.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{c.audience}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{c.hotel}</td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        c.status === 'Active' ? "bg-green-100 text-green-700" :
                        c.status === 'Draft' ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                      )}>{c.status}</span>
                    </td>
                    <td className="p-4 text-sm font-bold" style={{ color: COLORS.primary }}>{c.revenueImpact}</td>
                    <td className="p-4 text-right">
                       <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-900 transition-all"><MoreVertical className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

  if (currentStep === 3) { // Step 3: Offer Details Modal (Viewed as a step)
    if (!selectedOffer) return null;
    return (
      <div className="max-w-5xl mx-auto space-y-12 animate-in zoom-in-95 duration-500">
        <div className="flex justify-between items-center">
           <Button variant="ghost" onClick={() => setCurrentStep(2)}><ArrowLeft className="mr-2 w-4 h-4" /> Back to Offers</Button>
           <h1 className="text-3xl font-serif font-bold">{selectedOffer.title}</h1>
           <div className="w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
           <div className="md:col-span-2 space-y-12">
              <section>
                 <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-4">Description</label>
                 <p className="text-2xl font-light text-slate-700 leading-relaxed">{selectedOffer.description}</p>
              </section>
              <div className="grid grid-cols-2 gap-8">
                 <section>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-4">Hotels</label>
                    <div className="flex flex-wrap gap-2">{selectedOffer.hotels.map(h => <span key={h} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold">{h}</span>)}</div>
                 </section>
                 <section>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-4">Period</label>
                    <p className="text-sm font-bold"><Calendar className="inline w-4 h-4 mr-2 text-amber-600" /> {selectedOffer.period}</p>
                 </section>
              </div>
              <section>
                 <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-4">AI Reasoning</label>
                 <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 italic text-slate-600">{selectedOffer.reasoningExtended}</div>
              </section>
           </div>
           <div className="space-y-6">
              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
                 <CardContent className="p-10 space-y-10">
                    <div><p className="text-xs font-bold uppercase text-slate-400 mb-2">Revenue Impact</p><p className="text-4xl font-serif font-bold text-amber-400">{selectedOffer.revenueImpact}</p></div>
                    <div><p className="text-xs font-bold uppercase text-slate-400 mb-2">Occupancy Impact</p><p className="text-4xl font-serif font-bold text-amber-400">{selectedOffer.occupancyImpact}</p></div>
                    <div className="pt-8 border-t border-slate-800 flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Risk Level</span><span className="text-lg font-bold text-green-400">{selectedOffer.riskLevel}</span></div>
                 </CardContent>
              </Card>
              <Button className="w-full py-6 rounded-2xl text-lg font-bold shadow-xl" style={{ background: COLORS.goldGradient }} onClick={() => setCurrentStep(6)}>Continue to Audience</Button>
           </div>
        </div>
      </div>
    );
  }

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
                    <div className="flex gap-3"><ThumbsUp className="w-4 h-4 text-green-600 shrink-0" /><p className="text-xs text-slate-600 font-medium">Subject line uses "Exclusive", increasing open rate by 18% for high-loyalty guests.</p></div>
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
    <div className="max-w-[1400px] mx-auto p-4 md:p-10 min-h-screen bg-white">
      {renderDashboard()}
    </div>
  );
}
