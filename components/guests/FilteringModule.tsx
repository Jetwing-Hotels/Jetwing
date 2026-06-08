"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Filter, X, ChevronRight, ChevronLeft, ChevronDown, User, Mail, Phone, Globe, Hotel, CalendarDays, ExternalLink, Award, CreditCard, Activity, Check, Sparkles, Send, RefreshCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { guestApi, ApiClientError, type OfferWithProperty } from '@/lib/api/client';
import type { GuestListItem } from '@/lib/guests/types';
import { cn } from '@/lib/utils';
import { buildGuestVector, scoreGuests, type GuestScore } from '@/lib/guestScoring';

// Tier styling for the model's 0–100 score (top 10% ≈ Platinum).
const TIER_STYLE: Record<string, { badge: string; bar: string }> = {
  Platinum: { badge: 'bg-violet-100 text-violet-700', bar: '#7C3AED' },
  Gold: { badge: 'bg-amber-100 text-amber-700', bar: '#D4AF37' },
  Silver: { badge: 'bg-slate-200 text-slate-700', bar: '#94A3B8' },
  Standard: { badge: 'bg-slate-100 text-slate-500', bar: '#CBD5E1' },
};

// Constants for Jetwing Branding
const COLORS = {
  primary: '#8B9E23', // Jetwing Green
  secondary: '#E91E8C', // Jetwing Pink
  accent: '#FFC107', // Jetwing Yellow
  border: '#E5E5E5',
  bg: '#F8F9FA',
  text: '#1a1a1a',
  muted: '#666',
};

// Multi-select dropdown — pick one or more options per category.
function MultiSelect({ label, options, selected, onToggle }: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.muted }}>{label}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border bg-white text-sm transition-colors"
        style={{ borderColor: COLORS.border }}
      >
        <span className="truncate" style={{ color: selected.length ? COLORS.text : COLORS.muted, fontWeight: selected.length ? 600 : 400 }}>
          {selected.length ? `${selected.length} selected` : 'All'}
        </span>
        <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', open ? 'rotate-180' : '')} style={{ color: COLORS.muted }} />
      </button>
      {open && (
        <>
          {/* click-away backdrop — keeps the menu open across multiple toggles */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute z-30 mt-1 w-full rounded-lg border bg-white shadow-lg py-1 max-h-60 overflow-y-auto" style={{ borderColor: COLORS.border }}>
            {options.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onToggle(opt)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50"
                >
                  <span
                    className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                    style={{ backgroundColor: active ? COLORS.primary : 'white', borderColor: active ? COLORS.primary : '#CBD5E1' }}
                  >
                    {active && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span style={{ color: active ? COLORS.primary : COLORS.text, fontWeight: active ? 600 : 400 }}>{opt}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function FilteringModule() {
  // State for Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    hotel: [],
    country: [],
    bookingSource: [],
    servicesUsed: [],
    futureBooking: [],
    guestType: [],
    roomCategory: [],
    loyaltyStatus: [],
  });

  // State for UI
  const [selectedPassenger, setSelectedPassenger] = useState<GuestListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof GuestListItem; direction: 'asc' | 'desc' } | null>(null);

  // Live guest data from the backend (GET /api/v1/customers).
  const [guests, setGuests] = useState<GuestListItem[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingGuests(true);
    guestApi
      .listCustomers({ limit: 200 })
      .then((res) => { if (!cancelled) { setGuests(res.data); setLoadError(null); } })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiClientError && (e.status === 401 || e.status === 403)) {
          setLoadError('Sign in as an Admin or Revenue Manager to view guest profiles.');
        } else {
          setLoadError(e instanceof Error ? e.message : 'Failed to load guests.');
        }
      })
      .finally(() => { if (!cancelled) setLoadingGuests(false); });
    return () => { cancelled = true; };
  }, []);

  // Live model scores keyed by guest id (undefined = not yet scored, null = failed).
  const [scores, setScores] = useState<Record<string, GuestScore | null>>({});

  // Selection + "send offer" flow.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sendOpen, setSendOpen] = useState(false);
  const [offersList, setOffersList] = useState<OfferWithProperty[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [chosenOfferId, setChosenOfferId] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null);

  const flash = (msg: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 5000);
  };

  // Filtering Logic
  const filteredPassengers = useMemo(() => {
    return guests.filter(p => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.phone.includes(query) ||
          p.bookingReference.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Date range (check-in within [dateFrom, dateTo]; ISO yyyy-mm-dd compares lexically)
      if (dateFrom && p.checkIn < dateFrom) return false;
      if (dateTo && p.checkIn > dateTo) return false;

      // Multi-filters
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length > 0) {
          const guestValue = p[key as keyof typeof p];
          if (key === 'servicesUsed' && Array.isArray(guestValue)) {
            // Service Usage
            if (!values.every(v => (guestValue as string[]).includes(v))) return false;
          } else if (!Array.isArray(guestValue)) {
            if (!values.includes(String(guestValue))) return false;
          }
        }
      }

      return true;
    });
  }, [guests, searchQuery, dateFrom, dateTo, activeFilters]);

  // Sorting Logic
  const sortedPassengers = useMemo(() => {
    const items = [...filteredPassengers];
    if (sortConfig !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [filteredPassengers, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedPassengers.length / rowsPerPage);
  const paginatedPassengers = sortedPassengers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Auto-score the visible rows via the customer-ranker model. Only fetches ids
  // not already scored, so paging back is instant and re-renders don't refetch.
  const pageKey = paginatedPassengers.map((p) => p.id).join(',');
  useEffect(() => {
    const missing = paginatedPassengers.filter((p) => !(p.id in scores));
    if (missing.length === 0) return;

    let cancelled = false;
    const vectors = missing.map((p) => buildGuestVector(p));
    scoreGuests(vectors)
      .then((results) => {
        if (cancelled) return;
        setScores((prev) => {
          const next = { ...prev };
          missing.forEach((p, i) => { next[p.id] = results[i]; });
          return next;
        });
      })
      .catch(() => { /* leave unscored — retries when the page is revisited */ });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
  };

  const clearAllFilters = () => {
    setActiveFilters({
      hotel: [],
      country: [],
      bookingSource: [],
      servicesUsed: [],
      futureBooking: [],
      guestType: [],
      roomCategory: [],
      loyaltyStatus: [],
    });
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // ── selection + send-offer handlers ─────────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const allFilteredSelected =
    filteredPassengers.length > 0 && filteredPassengers.every((g) => selectedIds.has(g.id));

  const toggleSelectAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filteredPassengers.forEach((g) => next.delete(g.id));
      else filteredPassengers.forEach((g) => next.add(g.id));
      return next;
    });

  const openSendModal = async () => {
    setSendOpen(true);
    setChosenOfferId('');
    setLoadingOffers(true);
    try {
      const res = await guestApi.listOffers({ limit: 100 });
      // Prefer ready-to-send offers; fall back to all if none are approved/active.
      const ready = res.data.filter((o) => o.status === 'APPROVED' || o.status === 'ACTIVE');
      setOffersList(ready.length ? ready : res.data);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Failed to load offers', 'err');
      setOffersList([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  const doSend = async () => {
    if (!chosenOfferId) return;
    if (!window.confirm(`Email this offer to ${selectedIds.size} selected guest${selectedIds.size > 1 ? 's' : ''}? Real emails are sent when email is configured.`)) return;
    setSending(true);
    try {
      const r = await guestApi.sendOfferToGuests(chosenOfferId, { customer_ids: Array.from(selectedIds), confirm: true });
      flash(
        `${r.message}${r.data.skipped_no_email ? ` (${r.data.skipped_no_email} skipped — no email)` : ''}`,
        r.data.failed ? 'err' : 'ok',
      );
      setSendOpen(false);
      setSelectedIds(new Set());
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Send failed', 'err');
    } finally {
      setSending(false);
    }
  };

  // Filter options derived from the loaded data, so every option matches a real value.
  const filterOptions = useMemo<Record<string, string[]>>(() => {
    const distinct = (getter: (g: GuestListItem) => string | string[]) => {
      const set = new Set<string>();
      guests.forEach((g) => {
        const v = getter(g);
        if (Array.isArray(v)) v.forEach((x) => x && set.add(x));
        else if (v) set.add(v);
      });
      return Array.from(set).sort();
    };
    return {
      hotel: distinct((g) => g.hotel),
      country: distinct((g) => g.country),
      bookingSource: distinct((g) => g.bookingSource),
      servicesUsed: distinct((g) => g.servicesUsed),
      futureBooking: ['Yes', 'No'],
      guestType: distinct((g) => g.guestType),
      roomCategory: distinct((g) => g.roomCategory),
      loyaltyStatus: distinct((g) => g.loyaltyStatus),
    };
  }, [guests]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: COLORS.text }}>Guest Intelligence</h1>
        <p className="mt-1" style={{ color: COLORS.muted }}>View, search and filter guest profiles across all Jetwing properties.</p>
      </div>

      {/* Toolbar — search stays on its own, separate from the filter section */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm" style={{ borderColor: COLORS.border }}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COLORS.muted }} />
          <input
            type="text"
            placeholder="Search Passenger"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-2 transition-all"
            style={{ borderColor: COLORS.border }}
          />
        </div>
      </div>

      {/* Filter Options Card — always visible */}
      <div className="bg-white p-5 rounded-xl border shadow-sm" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: COLORS.primary }} />
              <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>Filter Options</h3>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-xs font-bold underline hover:text-red-500 transition-colors"
              style={{ color: COLORS.muted }}
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-5">
            {/* Date range */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.muted }}>Check-in From</p>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COLORS.muted }} />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-2 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.muted }}>Check-in To</p>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COLORS.muted }} />
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-2 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>

            {/* Category multi-selects */}
            {Object.entries(filterOptions).map(([key, options]) => (
              <MultiSelect
                key={key}
                label={key.replace(/([A-Z])/g, ' $1').trim()}
                options={options}
                selected={activeFilters[key] ?? []}
                onToggle={(option) => toggleFilter(key, option)}
              />
            ))}
          </div>
      </div>

      {/* Active Filter Chips */}
      {(Object.values(activeFilters).flat().length > 0 || dateFrom || dateTo || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchQuery && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all" style={{ backgroundColor: `${COLORS.primary}10`, borderColor: COLORS.primary, color: COLORS.primary }}>
              Search: {searchQuery}
              <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
            </div>
          )}
          {dateFrom && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all" style={{ backgroundColor: `${COLORS.primary}10`, borderColor: COLORS.primary, color: COLORS.primary }}>
              From: {formatDate(dateFrom)}
              <button onClick={() => setDateFrom('')}><X className="w-3 h-3" /></button>
            </div>
          )}
          {dateTo && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all" style={{ backgroundColor: `${COLORS.primary}10`, borderColor: COLORS.primary, color: COLORS.primary }}>
              To: {formatDate(dateTo)}
              <button onClick={() => setDateTo('')}><X className="w-3 h-3" /></button>
            </div>
          )}
          {Object.entries(activeFilters).map(([key, values]) =>
            values.map(val => (
              <div key={`${key}-${val}`} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all" style={{ backgroundColor: `${COLORS.primary}10`, borderColor: COLORS.primary, color: COLORS.primary }}>
                {val}
                <button onClick={() => toggleFilter(key, val)}><X className="w-3 h-3" /></button>
              </div>
            ))
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold underline px-2 py-1.5 hover:text-red-500 transition-colors"
            style={{ color: COLORS.muted }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Result Summary */}
      <div className="text-sm font-medium" style={{ color: COLORS.muted }}>
        {loadingGuests ? 'Loading guests…' : `Showing ${filteredPassengers.length} of ${guests.length} guests`}
      </div>

      {/* Selection action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 bg-white border rounded-xl px-4 py-3 shadow-sm" style={{ borderColor: COLORS.primary }}>
          <span className="text-sm font-semibold" style={{ color: COLORS.text }}>
            {selectedIds.size} guest{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedIds(new Set())} className="text-xs font-bold underline hover:text-red-500 transition-colors" style={{ color: COLORS.muted }}>
              Clear selection
            </button>
            <button
              onClick={openSendModal}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Send className="w-4 h-4" /> Send Offer
            </button>
          </div>
        </div>
      )}

      {/* Passenger Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden" style={{ borderColor: COLORS.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b z-10" style={{ borderColor: COLORS.border }}>
              <tr>
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-[#8B9E23]"
                    title="Select all matching guests"
                  />
                </th>
                {[
                  { label: 'Guest Name', key: 'name' },
                  { label: 'Country', key: 'country' },
                  { label: 'Hotel', key: 'hotel' },
                  { label: 'Check-in', key: 'checkIn' },
                  { label: 'Check-out', key: 'checkOut' },
                  { label: 'Booking Source', key: 'bookingSource' },
                  { label: 'Future Booking', key: 'futureBooking' },
                  { label: 'Guest Type', key: 'guestType' },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    style={{ color: COLORS.muted }}
                    onClick={() => {
                      const direction = sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                      setSortConfig({ key: col.key as keyof GuestListItem, direction });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {sortConfig?.key === col.key && (
                        <ChevronDown className={cn("w-3 h-3 transition-transform", sortConfig.direction === 'desc' ? "" : "rotate-180")} />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>
                  <div className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Score</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: COLORS.muted }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {loadingGuests ? (
                <tr><td colSpan={11} className="px-6 py-20 text-center text-sm text-slate-400">Loading guests…</td></tr>
              ) : loadError ? (
                <tr><td colSpan={11} className="px-6 py-20 text-center text-sm text-red-600">{loadError}</td></tr>
              ) : paginatedPassengers.length > 0 ? (
                paginatedPassengers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-[#8B9E23]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm" style={{ color: COLORS.text }}>{p.name}</span>
                        <span className="text-xs" style={{ color: COLORS.muted }}>{p.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{p.country}</td>
                    <td className="px-6 py-4 text-sm font-medium">{p.hotel}</td>
                    <td className="px-6 py-4 text-sm">{p.checkIn}</td>
                    <td className="px-6 py-4 text-sm">{p.checkOut}</td>
                    <td className="px-6 py-4 text-sm">{p.bookingSource}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white",
                        p.futureBooking === 'Yes' ? "bg-green-500" : "bg-slate-300"
                      )}
                      style={{ backgroundColor: p.futureBooking === 'Yes' ? COLORS.primary : '#CBD5E1' }}
                      >
                        {p.futureBooking}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100" style={{ color: COLORS.muted }}>
                            {p.guestType}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const s = scores[p.id];
                        if (s === undefined) {
                          return <div className="h-8 w-20 rounded-lg bg-slate-100 animate-pulse" />;
                        }
                        if (s === null) {
                          return <span className="text-xs font-medium" style={{ color: COLORS.muted }}>—</span>;
                        }
                        const style = TIER_STYLE[s.tier] ?? TIER_STYLE.Standard;
                        return (
                          <div className="flex flex-col gap-1 w-24" title={`${s.segment} · ${s.score.toFixed(1)}/100`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold tabular-nums" style={{ color: COLORS.text }}>
                                {s.score.toFixed(0)}
                              </span>
                              <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider', style.badge)}>
                                {s.tier}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, s.score))}%`, backgroundColor: style.bar }} />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                            setSelectedPassenger(p);
                            setIsModalOpen(true);
                        }}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold border transition-all hover:bg-slate-50"
                        style={{ borderColor: COLORS.border, color: COLORS.primary }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-4 rounded-full bg-slate-50">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="font-bold text-slate-500">No passengers found.</p>
                        <p className="text-sm text-slate-400">Try removing filters or changing your search criteria.</p>
                        <button
                            onClick={clearAllFilters}
                            className="mt-2 text-sm font-bold underline"
                            style={{ color: COLORS.primary }}
                        >
                            Reset all filters
                        </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-slate-50" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium" style={{ color: COLORS.muted }}>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold outline-none cursor-pointer"
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-xs font-medium" style={{ color: COLORS.muted }}>
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-1 rounded border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-1 rounded border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Guest Profile Modal */}
      {isModalOpen && selectedPassenger && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-8 border-b flex items-start justify-between bg-slate-50" style={{ borderColor: COLORS.border }}>
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg" style={{ backgroundColor: COLORS.primary }}>
                  {selectedPassenger.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>{selectedPassenger.name}</h2>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: COLORS.secondary }}>
                      {selectedPassenger.loyaltyStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.muted }}>
                      <Globe className="w-4 h-4" />
                      {selectedPassenger.country}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.muted }}>
                      <User className="w-4 h-4" />
                      {selectedPassenger.guestType}
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6" style={{ color: COLORS.muted }} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Contact & Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: COLORS.muted }}>Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50" style={{ borderColor: COLORS.border }}>
                        <Mail className="w-4 h-4" style={{ color: COLORS.primary }} />
                        <span className="text-sm font-medium truncate">{selectedPassenger.email}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50" style={{ borderColor: COLORS.border }}>
                        <Phone className="w-4 h-4" style={{ color: COLORS.primary }} />
                        <span className="text-sm font-medium">{selectedPassenger.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: COLORS.muted }}>Financial Summary</h3>
                    <div className="p-4 rounded-xl border bg-slate-50 space-y-3" style={{ borderColor: COLORS.border }}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium" style={{ color: COLORS.muted }}>Total Spend</span>
                        <span className="text-lg font-bold" style={{ color: COLORS.text }}>LKR {selectedPassenger.totalSpend.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium" style={{ color: COLORS.muted }}>Loyalty Tier</span>
                        <div className="flex items-center gap-1 font-bold text-sm" style={{ color: COLORS.accent }}>
                          <Award className="w-4 h-4" />
                          {selectedPassenger.loyaltyStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: COLORS.muted }}>Current Booking</h3>
                    <div className="p-4 rounded-xl border border-dashed space-y-3" style={{ borderColor: COLORS.primary }}>
                      <div className="flex items-center gap-2 text-sm font-bold" style={{ color: COLORS.primary }}>
                        <CreditCard className="w-4 h-4" />
                        REF: {selectedPassenger.bookingReference}
                      </div>
                      <div className="text-xs font-medium" style={{ color: COLORS.muted }}>
                        {selectedPassenger.hotel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column: History */}
                <div className="md:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Hotel History</h3>
                      <div className="space-y-3">
                        {selectedPassenger.hotelHistory.map((history, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-l-4" style={{ borderColor: COLORS.border, borderLeftColor: COLORS.primary }}>
                            <Hotel className="w-4 h-4" style={{ color: COLORS.muted }} />
                            <div>
                              <p className="text-sm font-bold">{history.hotel}</p>
                              <p className="text-[10px]" style={{ color: COLORS.muted }}>{history.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>Services Utilized</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPassenger.servicesUsed.map((service, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2" style={{ backgroundColor: `${COLORS.primary}10`, color: COLORS.primary }}>
                            <Activity className="w-3 h-3" />
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: COLORS.muted }}>Booking History</h3>
                    <div className="border rounded-xl overflow-hidden" style={{ borderColor: COLORS.border }}>
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>
                          <tr>
                            <th className="px-4 py-2">Reference</th>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
                          {selectedPassenger.bookingHistory.map((booking, i) => (
                            <tr key={i} className="text-sm">
                              <td className="px-4 py-3 font-medium">{booking.ref}</td>
                              <td className="px-4 py-3 text-xs" style={{ color: COLORS.muted }}>{booking.date}</td>
                              <td className="px-4 py-3 text-right font-bold">LKR {booking.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: `${COLORS.secondary}05`, border: `1px solid ${COLORS.secondary}20` }}>
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5" style={{ color: COLORS.secondary }} />
                      <div>
                        <p className="text-sm font-bold" style={{ color: COLORS.secondary }}>Future Booking: {selectedPassenger.futureBooking}</p>
                        <p className="text-xs" style={{ color: COLORS.muted }}>This guest {selectedPassenger.futureBooking === 'Yes' ? 'has an upcoming stay' : 'does not have any future bookings'}.</p>
                      </div>
                    </div>
                    {selectedPassenger.futureBooking === 'Yes' && (
                      <button className="flex items-center gap-2 text-xs font-bold underline" style={{ color: COLORS.secondary }}>
                        View Details
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3" style={{ borderColor: COLORS.border }}>
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold border" style={{ borderColor: COLORS.border }}>Close</button>
              <button
                onClick={() => { setSelectedIds(new Set([selectedPassenger.id])); setIsModalOpen(false); openSendModal(); }}
                className="px-6 py-2 rounded-lg text-white font-bold transition-opacity hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Send className="w-4 h-4" /> Send Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Offer modal */}
      {sendOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !sending && setSendOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Send Offer</h2>
                <p className="text-sm" style={{ color: COLORS.muted }}>
                  Email a generated offer to {selectedIds.size} selected guest{selectedIds.size > 1 ? 's' : ''}.
                </p>
              </div>
              <button onClick={() => !sending && setSendOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" style={{ color: COLORS.muted }} />
              </button>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {loadingOffers ? (
                <p className="text-sm text-slate-400 text-center py-8">Loading offers…</p>
              ) : offersList.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No offers available. Generate and approve offers in Offer Recommendations first.</p>
              ) : (
                <div className="space-y-2">
                  {offersList.map((o) => (
                    <button
                      key={o.offer_id}
                      onClick={() => setChosenOfferId(o.offer_id)}
                      className="w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3"
                      style={{ borderColor: chosenOfferId === o.offer_id ? COLORS.primary : COLORS.border, backgroundColor: chosenOfferId === o.offer_id ? `${COLORS.primary}10` : 'white' }}
                    >
                      <span className="w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: chosenOfferId === o.offer_id ? COLORS.primary : '#CBD5E1' }}>
                        {chosenOfferId === o.offer_id && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-sm" style={{ color: COLORS.text }}>{o.offer_title}</span>
                        <span className="block text-xs" style={{ color: COLORS.muted }}>
                          {o.properties?.property_name ?? 'Property'} · {o.offer_type} · {o.status}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: COLORS.border }}>
              <button onClick={() => setSendOpen(false)} disabled={sending} className="px-5 py-2 rounded-lg font-bold border" style={{ borderColor: COLORS.border }}>Cancel</button>
              <button
                onClick={doSend}
                disabled={!chosenOfferId || sending}
                className="px-5 py-2 rounded-lg text-white font-bold flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: COLORS.primary }}
              >
                {sending ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send to {selectedIds.size}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn('fixed bottom-6 right-6 z-[80] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium', toast.kind === 'ok' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white')}>
          {toast.kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
