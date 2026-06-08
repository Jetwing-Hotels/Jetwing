"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Target,
  TrendingUp,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Eye,
  MoreVertical,
  Search,
  Calendar,
  Layers,
  ChevronDown,
  Package,
  X,
  Send,
  RefreshCcw,
  Plus,
  Mail,
  Users,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { guestApi, ApiClientError, type OfferWithProperty } from '@/lib/api/client';
import type { Campaign } from '@/lib/supabase/types';

const COLORS = {
  primary: '#B38B2D',
  text: '#1a1a1a',
  border: '#E5E5E5',
  goldGradient: 'linear-gradient(135deg, #B38B2D 0%, #D4AF37 100%)',
};

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const OFFER_TYPES = ['Accommodation', 'Package', 'Experience', 'F&B', 'Wellness'] as const;

const fmtLkr = (n: number | null | undefined) => {
  if (n == null) return '—';
  return n >= 1_000_000 ? `LKR ${(n / 1_000_000).toFixed(1)}M` : `LKR ${n.toLocaleString()}`;
};

// Status pill styling — covers both offer and campaign statuses.
const statusStyle: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-slate-100 text-slate-500',
  DRAFT: 'bg-slate-100 text-slate-600',
  AUDIENCE_READY: 'bg-blue-100 text-blue-700',
  SENDING: 'bg-amber-100 text-amber-700',
  SENT: 'bg-green-100 text-green-700',
  PAUSED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

const statusLabel = (s: string) => (s === 'PENDING_REVIEW' ? 'AI Rec' : s.replace(/_/g, ' '));

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Accommodation: Target,
  Package: Layers,
  Experience: Sparkles,
  Wellness: Leaf,
  'F&B': DollarSign,
  Campaign: Send,
};

type TabKey = 'all' | 'ai' | 'approved' | 'drafts' | 'scheduled' | 'active' | 'completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Campaigns' },
  { key: 'ai', label: 'AI Recommendations' },
  { key: 'approved', label: 'Approved Offers' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

// Normalised table row — an AI-recommended offer or a campaign.
interface Row {
  kind: 'offer' | 'campaign';
  id: string;
  title: string;
  subtitle: string;
  segment: string;
  count: number;
  offerType: string;
  status: string;
  financialLkr: number | null;
  roiPct: number | null;
  raw: OfferWithProperty | Campaign;
}

function Toast({ msg, kind, onClose }: { msg: string; kind: 'ok' | 'err'; onClose: () => void }) {
  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[80] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium',
        kind === 'ok' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white',
      )}
    >
      {kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
}

export default function OfferIntelligence() {
  const [offers, setOffers] = useState<OfferWithProperty[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null);

  const now = new Date();
  const [genMonth, setGenMonth] = useState(((now.getMonth() + 1) % 12) + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [businessGoal, setBusinessGoal] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generating, setGenerating] = useState(false);

  // Campaign Management view state.
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);

  const flash = (msg: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [offersRes, campaignsRes] = await Promise.all([
        guestApi.listOffers({ limit: 100 }),
        guestApi.listCampaigns({ limit: 50 }),
      ]);
      setOffers(offersRes.data);
      setCampaigns(campaignsRes.data);
    } catch (e) {
      if (e instanceof ApiClientError && (e.status === 401 || e.status === 403)) {
        setError(
          'You need to be signed in as an Admin or Revenue Manager. After signing in, call POST /api/v1/admin/bootstrap to claim the first ADMIN role.',
        );
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  // ── KPIs (real where the data exists) ──────────────────────────────────────
  const pending = useMemo(() => offers.filter((o) => o.status === 'PENDING_REVIEW'), [offers]);
  const approved = useMemo(
    () => offers.filter((o) => o.status === 'APPROVED' || o.status === 'ACTIVE'),
    [offers],
  );
  const totalRevenue = useMemo(
    () => offers
      .filter((o) => ['PENDING_REVIEW', 'APPROVED', 'ACTIVE'].includes(o.status))
      .reduce((s, o) => s + (o.predicted_incremental_lkr ?? 0), 0),
    [offers],
  );
  const activeCampaigns = campaigns.filter((c) => !['CANCELLED', 'DRAFT'].includes(c.status)).length;
  const { sentTotal, openedTotal } = useMemo(() => ({
    sentTotal: campaigns.reduce((s, c) => s + (c.emails_sent ?? 0), 0),
    openedTotal: campaigns.reduce((s, c) => s + (c.emails_opened ?? 0), 0),
  }), [campaigns]);
  const conversionRate = sentTotal > 0 ? (openedTotal / sentTotal) * 100 : null;

  // ── Unified table rows ─────────────────────────────────────────────────────
  const offersById = useMemo(() => {
    const m = new Map<string, OfferWithProperty>();
    offers.forEach((o) => m.set(o.offer_id, o));
    return m;
  }, [offers]);

  const tabRows = useMemo<Row[]>(() => {
    const offerRow = (o: OfferWithProperty): Row => ({
      kind: 'offer',
      id: o.offer_id,
      title: o.offer_title,
      subtitle: o.properties?.property_name ?? 'Property',
      segment: o.target_guest_segment ?? o.properties?.property_name ?? 'All guests',
      count: 1,
      offerType: o.offer_type,
      status: o.status,
      financialLkr: o.predicted_incremental_lkr,
      roiPct: o.predicted_revenue_uplift_pct,
      raw: o,
    });
    const campaignRow = (c: Campaign): Row => {
      const ids = Array.isArray(c.offer_ids) ? (c.offer_ids as string[]) : [];
      const cos = ids.map((id) => offersById.get(id)).filter((o): o is OfferWithProperty => !!o);
      const fin = cos.reduce((s, o) => s + (o.predicted_incremental_lkr ?? 0), 0);
      const tiers = Array.isArray(c.target_tiers) ? (c.target_tiers as string[]) : [];
      return {
        kind: 'campaign',
        id: c.campaign_id,
        title: c.campaign_name,
        subtitle: `${MONTHS[c.target_month]} ${c.target_year}`,
        segment: tiers.length ? tiers.join(', ') : 'All tiers',
        count: ids.length,
        offerType: cos[0]?.offer_type ?? 'Campaign',
        status: c.status,
        financialLkr: fin || null,
        roiPct: c.emails_sent > 0 ? (c.emails_opened / c.emails_sent) * 100 : null,
        raw: c,
      };
    };

    switch (activeTab) {
      case 'ai':
        return pending.map(offerRow);
      case 'approved':
        return approved.map(offerRow);
      case 'drafts':
        return campaigns.filter((c) => c.status === 'DRAFT').map(campaignRow);
      case 'scheduled':
        return campaigns.filter((c) => c.status === 'AUDIENCE_READY').map(campaignRow);
      case 'active':
        return campaigns.filter((c) => c.status === 'SENDING').map(campaignRow);
      case 'completed':
        return campaigns.filter((c) => c.status === 'SENT').map(campaignRow);
      case 'all':
      default:
        return campaigns.map(campaignRow);
    }
  }, [activeTab, campaigns, pending, approved, offersById]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabRows.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q) && !r.segment.toLowerCase().includes(q)) return false;
      if (typeFilter !== 'all' && r.offerType !== typeFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [tabRows, search, typeFilter, statusFilter]);

  // ── actions ────────────────────────────────────────────────────────────────
  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    setMenuId(null);
    try { await fn(); } catch (e) {
      flash(e instanceof Error ? e.message : 'Action failed', 'err');
    } finally { setBusyId(null); }
  };

  const onGenerate = async () => {
    setGenerating(true);
    try {
      await guestApi.generateOffers({
        month: genMonth,
        year: genYear,
        business_goal: businessGoal.trim() || undefined,
        additional_instructions: additionalInstructions.trim() || undefined,
      });
      flash(`Generation queued for ${MONTHS[genMonth]} ${genYear}. Loading new recommendations…`);
      setActiveTab('ai');
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Generation failed', 'err');
    } finally { setGenerating(false); }
  };

  const onApprove = (o: OfferWithProperty) => withBusy(o.offer_id, async () => {
    await guestApi.approveOffer(o.offer_id);
    flash(`Approved “${o.offer_title}”.`);
    await load();
  });

  const onReject = (o: OfferWithProperty) => {
    const reason = window.prompt('Reason for rejecting this offer?');
    if (!reason) return;
    return withBusy(o.offer_id, async () => {
      await guestApi.rejectOffer(o.offer_id, reason);
      flash(`Rejected “${o.offer_title}”.`);
      await load();
    });
  };

  const onActivate = (o: OfferWithProperty) => withBusy(o.offer_id, async () => {
    await guestApi.activateOffer(o.offer_id);
    flash(`Activated “${o.offer_title}”.`);
    await load();
  });

  const onCreateCampaign = (o: OfferWithProperty) => withBusy(o.offer_id, async () => {
    const name = `${o.offer_title} — ${MONTHS[o.target_month]} ${o.target_year}`;
    await guestApi.createCampaign({
      campaign_name: name,
      offer_ids: [o.offer_id],
      target_month: o.target_month,
      target_year: o.target_year,
    });
    flash(`Campaign created from “${o.offer_title}”.`);
    await load();
  });

  // Send an approved/active offer straight to guests (every guest with an email
  // on file). Reuses the send-to-guests pipeline: it spins up a tracked campaign,
  // writes a personalised email per guest and dispatches via SMTP.
  const onSendOffer = async (o: OfferWithProperty) => {
    setMenuId(null);
    let recipients: { id: string }[];
    try {
      const res = await guestApi.listCustomers({ limit: 500 });
      recipients = res.data.filter((c) => c.email && c.email.trim());
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Failed to load guests', 'err');
      return;
    }
    if (recipients.length === 0) {
      flash('No guests with an email address to send to.', 'err');
      return;
    }
    if (!window.confirm(
      `Email “${o.offer_title}” to ${recipients.length} guest(s) with an email on file?\n\nReal emails are sent when SMTP is configured (otherwise this is a safe dry run).`,
    )) return;
    await withBusy(o.offer_id, async () => {
      const r = await guestApi.sendOfferToGuests(o.offer_id, {
        customer_ids: recipients.map((c) => c.id),
        confirm: true,
      });
      const skipped = r.data.skipped_no_email ? ` ${r.data.skipped_no_email} skipped.` : '';
      flash(`${r.message}${skipped}`, r.data.failed ? 'err' : 'ok');
      await load();
    });
  };

  const onBuildAudience = (c: Campaign) => withBusy(c.campaign_id, async () => {
    const r = await guestApi.buildAudience(c.campaign_id);
    flash(`Audience built: ${r.data.audience_size} recipients (${r.data.added} new).`);
    await load();
  });

  const onGenerateEmails = (c: Campaign) => withBusy(c.campaign_id, async () => {
    await guestApi.generateEmails(c.campaign_id);
    flash(`Email generation queued for “${c.campaign_name}”.`);
    await load();
  });

  const onSend = (c: Campaign) => {
    if (!window.confirm('Send this campaign now? Real emails are sent when email (SMTP) is configured.')) return;
    return withBusy(c.campaign_id, async () => {
      const r = await guestApi.sendCampaign(c.campaign_id, true);
      flash(`${r.message} (${r.data.sent} sent, ${r.data.failed} failed)`, r.data.failed ? 'err' : 'ok');
      await load();
    });
  };

  // ── render ───────────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Total Revenue Generated',
      value: fmtLkr(totalRevenue),
      pill: `${approved.length} live`,
      icon: DollarSign,
    },
    {
      label: 'Avg Conversion Rate',
      value: conversionRate != null ? `${conversionRate.toFixed(1)}%` : '—',
      pill: sentTotal > 0 ? `${openedTotal} opened` : 'No sends yet',
      icon: TrendingUp,
    },
    {
      label: 'Active Campaigns',
      value: String(activeCampaigns),
      pill: 'Active',
      icon: Target,
    },
    {
      label: 'AI Recommended Offers',
      value: String(pending.length),
      pill: pending.length ? `${pending.length} new` : 'None pending',
      icon: Sparkles,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
      {toast && <Toast msg={toast.msg} kind={toast.kind} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-serif font-medium" style={{ color: COLORS.text }}>Offer Intelligence</h1>
          <p className="mt-1 text-slate-500">AI-Powered Offer Recommendations &amp; Campaign Management</p>
        </div>
        <Button onClick={load} variant="outline" className="rounded-full gap-2 self-start md:self-auto">
          <RefreshCcw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-none shadow-sm ring-1 ring-slate-100">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-slate-50 w-fit mb-3" style={{ color: COLORS.primary }}>
                  <k.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-green-50 text-green-700">{k.pill}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{k.label}</p>
              <p className="text-2xl font-bold mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate AI Recommendations */}
      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="h-1.5" style={{ background: COLORS.goldGradient }} />
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              <div>
                <h2 className="text-2xl font-serif font-bold">Generate AI Recommendations</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Generate personalized offers using guest behavior, booking history, hotel performance,
                  seasonality and market trends.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Business Goal</label>
                <textarea
                  value={businessGoal}
                  onChange={(e) => setBusinessGoal(e.target.value)}
                  rows={3}
                  placeholder="e.g. Increase occupancy at Jetwing Yala during August."
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200 resize-y"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Additional Instructions</label>
                <textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  rows={3}
                  placeholder="e.g. German summer holidays approaching."
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200 resize-y"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <label className="text-xs">
                  <span className="block text-slate-400 font-semibold mb-1">Target Month</span>
                  <select value={genMonth} onChange={(e) => setGenMonth(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
                    {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </label>
                <label className="text-xs">
                  <span className="block text-slate-400 font-semibold mb-1">Target Year</span>
                  <select value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
                    {[now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </label>
                <Button
                  onClick={onGenerate}
                  disabled={generating}
                  className="rounded-xl gap-2 text-white px-6 py-5 text-base font-bold"
                  style={{ background: COLORS.goldGradient }}
                >
                  {generating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Recommendations
                </Button>
              </div>
            </div>

            {/* Info panel */}
            <div className="rounded-2xl bg-slate-50/70 p-6 flex flex-col gap-5">
              {[
                'AI-analyzed guest segments',
                'Predictive occupancy modelling',
                'Real-time market trend parity',
              ].map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: COLORS.primary }} />
                  <span className="text-sm font-medium text-slate-700">{t}</span>
                </div>
              ))}
              <p className="text-xs text-slate-400 italic mt-auto pt-4 border-t border-slate-200">
                &ldquo;AI is helping marketing managers discover profitable offers before creating campaigns.&rdquo;
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Management */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-3xl font-serif font-bold">Campaign Management</h2>
          <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 w-fit">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-sm font-semibold transition-all',
                  activeTab === t.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Campaign…"
              className="w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-amber-200"
              style={{ borderColor: COLORS.border }}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={genYear}
              onChange={(e) => setGenYear(Number(e.target.value))}
              className="appearance-none rounded-xl border bg-white py-3 pl-10 pr-9 text-sm font-medium outline-none"
              style={{ borderColor: COLORS.border }}
            >
              {[now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-xl border bg-white py-3 pl-10 pr-9 text-sm font-medium outline-none"
              style={{ borderColor: COLORS.border }}
            >
              <option value="all">Offer Type</option>
              {OFFER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border bg-white py-3 pl-10 pr-9 text-sm font-medium outline-none"
              style={{ borderColor: COLORS.border }}
            >
              <option value="all">All Status</option>
              {Object.keys(statusStyle).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-visible">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                    <th className="p-4 pl-6">Campaign Details</th>
                    <th className="p-4">Count</th>
                    <th className="p-4">Offer Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Financial Impact</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={6} className="p-10 text-center text-sm text-slate-400">Loading…</td></tr>
                  ) : visibleRows.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-sm text-slate-400">
                      {activeTab === 'ai'
                        ? 'No AI recommendations yet. Generate offers above to get started.'
                        : 'Nothing here yet.'}
                    </td></tr>
                  ) : (
                    visibleRows.map((r) => {
                      const Icon = typeIcon[r.offerType] ?? Package;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: COLORS.goldGradient }}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate max-w-[260px]">{r.title}</p>
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">{r.segment}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                              <Package className="w-3.5 h-3.5 text-slate-400" /> {r.count}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">{r.offerType}</span>
                          </td>
                          <td className="p-4">
                            <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1', statusStyle[r.status] ?? 'bg-slate-100 text-slate-600')}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                              {statusLabel(r.status)}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-bold" style={{ color: COLORS.primary }}>
                              {r.financialLkr != null ? `+${fmtLkr(r.financialLkr)}` : '—'}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400">
                              {r.roiPct != null ? `${r.roiPct.toFixed(1)}% ROI` : '— ROI'}
                            </p>
                          </td>
                          <td className="p-4 pr-6">
                            <div className="flex items-center justify-end gap-1 relative">
                              {r.kind === 'offer' && (r.status === 'APPROVED' || r.status === 'ACTIVE') && (
                                <button
                                  onClick={() => onSendOffer(r.raw as OfferWithProperty)}
                                  disabled={busyId === r.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                                  style={{ background: COLORS.goldGradient }}
                                  title="Email this offer to guests"
                                >
                                  <Mail className="w-3.5 h-3.5" /> Send
                                </button>
                              )}
                              <button
                                onClick={() => setDetail(r)}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setMenuId(menuId === r.id ? null : r.id)}
                                disabled={busyId === r.id}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                                title="Actions"
                              >
                                {busyId === r.id ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                              </button>
                              {menuId === r.id && (
                                <RowMenu
                                  row={r}
                                  onClose={() => setMenuId(null)}
                                  onApprove={onApprove}
                                  onReject={onReject}
                                  onActivate={onActivate}
                                  onCreateCampaign={onCreateCampaign}
                                  onSendOffer={onSendOffer}
                                  onBuildAudience={onBuildAudience}
                                  onGenerateEmails={onGenerateEmails}
                                  onSend={onSend}
                                  onView={() => { setDetail(r); setMenuId(null); }}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {detail && <DetailModal row={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

// ── Row actions dropdown ───────────────────────────────────────────────────────
function RowMenu({
  row, onClose, onApprove, onReject, onActivate, onCreateCampaign,
  onSendOffer, onBuildAudience, onGenerateEmails, onSend, onView,
}: {
  row: Row;
  onClose: () => void;
  onApprove: (o: OfferWithProperty) => void;
  onReject: (o: OfferWithProperty) => void;
  onActivate: (o: OfferWithProperty) => void;
  onCreateCampaign: (o: OfferWithProperty) => void;
  onSendOffer: (o: OfferWithProperty) => void;
  onBuildAudience: (c: Campaign) => void;
  onGenerateEmails: (c: Campaign) => void;
  onSend: (c: Campaign) => void;
  onView: () => void;
}) {
  const item = 'w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5';
  const isOffer = row.kind === 'offer';
  const offer = row.raw as OfferWithProperty;
  const campaign = row.raw as Campaign;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-slate-100 bg-white shadow-xl py-1.5 overflow-hidden">
        <button className={item} onClick={onView}><Eye className="w-4 h-4 text-slate-400" /> View details</button>
        <div className="my-1 border-t border-slate-50" />
        {isOffer ? (
          <>
            {offer.status === 'PENDING_REVIEW' && (
              <>
                <button className={item} onClick={() => onApprove(offer)}><CheckCircle2 className="w-4 h-4 text-green-600" /> Approve</button>
                <button className={cn(item, 'text-red-600')} onClick={() => onReject(offer)}><X className="w-4 h-4" /> Reject</button>
              </>
            )}
            {offer.status === 'APPROVED' && (
              <button className={item} onClick={() => onActivate(offer)}><CheckCircle2 className="w-4 h-4 text-green-600" /> Activate</button>
            )}
            {(offer.status === 'APPROVED' || offer.status === 'ACTIVE') && (
              <>
                <button className={cn(item, 'text-green-700 font-semibold')} onClick={() => onSendOffer(offer)}><Mail className="w-4 h-4 text-green-600" /> Send to guests</button>
                <button className={item} onClick={() => onCreateCampaign(offer)}><Send className="w-4 h-4 text-slate-500" /> Create campaign</button>
              </>
            )}
          </>
        ) : (
          <>
            <button className={item} onClick={() => onBuildAudience(campaign)}><Users className="w-4 h-4 text-slate-500" /> Build audience</button>
            <button className={cn(item, campaign.total_audience_size === 0 && 'opacity-40 pointer-events-none')} onClick={() => onGenerateEmails(campaign)}><Mail className="w-4 h-4 text-slate-500" /> Generate emails</button>
            <button className={cn(item, campaign.total_audience_size === 0 && 'opacity-40 pointer-events-none')} onClick={() => onSend(campaign)}><Send className="w-4 h-4 text-slate-500" /> Send campaign</button>
          </>
        )}
      </div>
    </>
  );
}

// ── Detail modal ───────────────────────────────────────────────────────────────
function DetailModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const isOffer = row.kind === 'offer';
  const offer = row.raw as OfferWithProperty;
  const campaign = row.raw as Campaign;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-400">{row.subtitle}</p>
            <h3 className="text-xl font-serif font-bold mt-0.5">{row.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-5">
          {isOffer ? (
            <>
              <p className="text-sm text-slate-600 leading-relaxed">{offer.offer_description}</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="Revenue" value={offer.predicted_revenue_uplift_pct != null ? `+${offer.predicted_revenue_uplift_pct}%` : '—'} />
                <Stat label="Occupancy" value={offer.predicted_occupancy_uplift_pct != null ? `+${offer.predicted_occupancy_uplift_pct}%` : '—'} />
                <Stat label="Incremental" value={fmtLkr(offer.predicted_incremental_lkr)} accent />
              </div>
              {offer.sustainability_angle && (
                <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 rounded-lg p-3">
                  <Leaf className="w-4 h-4 mt-0.5 shrink-0" /><span>{offer.sustainability_angle}</span>
                </div>
              )}
              {offer.llm_rationale && (
                <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">{offer.llm_rationale}</div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-center">
              <Stat label="Audience" value={String(campaign.total_audience_size)} />
              <Stat label="Offers" value={String(Array.isArray(campaign.offer_ids) ? (campaign.offer_ids as string[]).length : 0)} />
              <Stat label="Sent" value={String(campaign.emails_sent)} />
              <Stat label="Opened" value={String(campaign.emails_opened)} accent />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 py-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn('text-sm font-bold mt-0.5', accent && 'text-amber-700')}>{value}</p>
    </div>
  );
}
