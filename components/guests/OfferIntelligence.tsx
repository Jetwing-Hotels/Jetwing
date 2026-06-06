"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Mail,
  Leaf,
  AlertTriangle,
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
import { cn } from '@/lib/utils';
import { guestApi, ApiClientError, type OfferWithProperty } from '@/lib/api/client';
import type { Campaign } from '@/lib/supabase/types';

const COLORS = {
  primary: '#B38B2D',
  secondary: '#1a1a1a',
  border: '#E5E5E5',
  text: '#1a1a1a',
  goldGradient: 'linear-gradient(135deg, #B38B2D 0%, #D4AF37 100%)',
};

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const fmtLkr = (n: number | null | undefined) => {
  if (n == null) return '—';
  return n >= 1_000_000 ? `LKR ${(n / 1_000_000).toFixed(1)}M` : `LKR ${n.toLocaleString()}`;
};

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

function Toast({ msg, kind, onClose }: { msg: string; kind: 'ok' | 'err'; onClose: () => void }) {
  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium',
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
  const [generating, setGenerating] = useState(false);

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

  const pending = useMemo(() => offers.filter((o) => o.status === 'PENDING_REVIEW'), [offers]);
  const approved = useMemo(() => offers.filter((o) => o.status === 'APPROVED' || o.status === 'ACTIVE'), [offers]);
  const predictedTotal = useMemo(
    () => offers
      .filter((o) => ['PENDING_REVIEW', 'APPROVED', 'ACTIVE'].includes(o.status))
      .reduce((s, o) => s + (o.predicted_incremental_lkr ?? 0), 0),
    [offers],
  );
  const activeCampaigns = campaigns.filter((c) => !['CANCELLED', 'DRAFT'].includes(c.status)).length;

  // ── actions ──────────────────────────────────────────────────────────────
  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try { await fn(); } catch (e) {
      flash(e instanceof Error ? e.message : 'Action failed', 'err');
    } finally { setBusyId(null); }
  };

  const onGenerate = async () => {
    setGenerating(true);
    try {
      await guestApi.generateOffers({ month: genMonth, year: genYear });
      flash(`Generation queued for ${MONTHS[genMonth]} ${genYear}. Loading new offers…`);
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
    if (!window.confirm('Send this campaign now? It runs as a safe dry run unless SendGrid is configured.')) return;
    return withBusy(c.campaign_id, async () => {
      const r = await guestApi.sendCampaign(c.campaign_id);
      flash(`${r.message} (${r.data.sent} sent, ${r.data.failed} failed)`, r.data.failed ? 'err' : 'ok');
      await load();
    });
  };

  // ── render ─────────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Offers Awaiting Review', value: String(pending.length), icon: Sparkles },
    { label: 'Predicted Incremental', value: fmtLkr(predictedTotal), icon: DollarSign },
    { label: 'Approved / Active Offers', value: String(approved.length), icon: Target },
    { label: 'Active Campaigns', value: String(activeCampaigns), icon: TrendingUp },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
      {toast && <Toast msg={toast.msg} kind={toast.kind} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium" style={{ color: COLORS.text }}>Offer Intelligence</h1>
          <p className="mt-1 text-slate-500">AI-generated seasonal offers · approval workflow · campaigns</p>
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
              <div className="p-2 rounded-xl bg-slate-50 w-fit mb-3" style={{ color: COLORS.primary }}>
                <k.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{k.label}</p>
              <p className="text-2xl font-bold mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate */}
      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="h-1" style={{ background: COLORS.goldGradient }} />
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" style={{ color: COLORS.primary }} /> Generate Seasonal Offers</p>
            <p className="text-xs text-slate-500 mt-1">Runs the Claude offer engine across all properties for the chosen month, grounded in 5 years of history.</p>
          </div>
          <div className="flex items-end gap-2">
            <label className="text-xs">
              <span className="block text-slate-400 font-semibold mb-1">Month</span>
              <select value={genMonth} onChange={(e) => setGenMonth(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
                {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="block text-slate-400 font-semibold mb-1">Year</span>
              <select value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
                {[now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <Button onClick={onGenerate} disabled={generating} className="rounded-lg gap-2 text-white" style={{ background: COLORS.goldGradient }}>
              {generating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offers awaiting review */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold">Offers Awaiting Review</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-slate-400">No offers pending review. Generate offers above to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {pending.map((o) => (
              <Card key={o.offer_id} className="border-none shadow-sm ring-1 ring-slate-100 hover:shadow-lg transition-all">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <h3 className="font-serif font-bold text-lg leading-snug">{o.offer_title}</h3>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                        {o.properties?.property_name ?? 'Property'} · {o.offer_type}
                      </p>
                    </div>
                    <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase', statusStyle[o.status])}>Pending</span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">{o.offer_description}</p>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="rounded-lg bg-slate-50 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Revenue</p>
                      <p className="text-sm font-bold text-green-600">{o.predicted_revenue_uplift_pct != null ? `+${o.predicted_revenue_uplift_pct}%` : '—'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Occupancy</p>
                      <p className="text-sm font-bold text-green-600">{o.predicted_occupancy_uplift_pct != null ? `+${o.predicted_occupancy_uplift_pct}%` : '—'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Incremental</p>
                      <p className="text-sm font-bold" style={{ color: COLORS.primary }}>{fmtLkr(o.predicted_incremental_lkr)}</p>
                    </div>
                  </div>

                  {o.sustainability_angle && (
                    <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 rounded-lg p-2.5 mb-4">
                      <Leaf className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{o.sustainability_angle}</span>
                    </div>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <Button onClick={() => onApprove(o)} disabled={busyId === o.offer_id} className="flex-1 rounded-lg text-white" style={{ background: COLORS.secondary }}>
                      {busyId === o.offer_id ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Approve'}
                    </Button>
                    <Button onClick={() => onReject(o)} disabled={busyId === o.offer_id} variant="outline" className="flex-1 rounded-lg border-slate-200 text-red-600">
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Approved offers → campaigns */}
      {approved.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold">Approved &amp; Active Offers</h2>
          <Card className="border-none shadow-sm ring-1 ring-slate-100">
            <CardContent className="p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                    <th className="p-4">Offer</th><th className="p-4">Property</th><th className="p-4">Target</th>
                    <th className="p-4">Incremental</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {approved.map((o) => (
                    <tr key={o.offer_id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-sm">{o.offer_title}</td>
                      <td className="p-4 text-sm text-slate-600">{o.properties?.property_name ?? '—'}</td>
                      <td className="p-4 text-sm text-slate-600">{MONTHS[o.target_month]} {o.target_year}</td>
                      <td className="p-4 text-sm font-bold" style={{ color: COLORS.primary }}>{fmtLkr(o.predicted_incremental_lkr)}</td>
                      <td className="p-4"><span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase', statusStyle[o.status])}>{o.status}</span></td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {o.status === 'APPROVED' && (
                            <Button onClick={() => onActivate(o)} disabled={busyId === o.offer_id} size="sm" variant="outline" className="rounded-lg">Activate</Button>
                          )}
                          <Button onClick={() => onCreateCampaign(o)} disabled={busyId === o.offer_id} size="sm" className="rounded-lg text-white gap-1" style={{ background: COLORS.goldGradient }}>
                            <Send className="w-3.5 h-3.5" /> Campaign
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Campaigns */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold">Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-slate-400">No campaigns yet. Approve an offer and create one above.</p>
        ) : (
          <Card className="border-none shadow-sm ring-1 ring-slate-100">
            <CardContent className="p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                    <th className="p-4">Campaign</th><th className="p-4">Target</th><th className="p-4">Audience</th>
                    <th className="p-4">Sent / Opened</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaigns.map((c) => (
                    <tr key={c.campaign_id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-sm">{c.campaign_name}</td>
                      <td className="p-4 text-sm text-slate-600">{MONTHS[c.target_month]} {c.target_year}</td>
                      <td className="p-4 text-sm text-slate-600"><span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> {c.total_audience_size}</span></td>
                      <td className="p-4 text-sm text-slate-600"><span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {c.emails_sent} / {c.emails_opened}</span></td>
                      <td className="p-4"><span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase', statusStyle[c.status])}>{c.status}</span></td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => onBuildAudience(c)} disabled={busyId === c.campaign_id} size="sm" variant="outline" className="rounded-lg">
                            {busyId === c.campaign_id ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : 'Build Audience'}
                          </Button>
                          <Button onClick={() => onGenerateEmails(c)} disabled={busyId === c.campaign_id || c.total_audience_size === 0} size="sm" variant="outline" className="rounded-lg gap-1">
                            <ChevronRight className="w-3.5 h-3.5" /> Emails
                          </Button>
                          <Button onClick={() => onSend(c)} disabled={busyId === c.campaign_id || c.total_audience_size === 0} size="sm" className="rounded-lg text-white gap-1" style={{ background: COLORS.goldGradient }}>
                            <Send className="w-3.5 h-3.5" /> Send
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
