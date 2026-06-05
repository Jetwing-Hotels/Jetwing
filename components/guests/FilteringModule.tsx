"use client"

import React, { useState, useMemo } from 'react';
import { Search, Calendar, Filter, X, ChevronRight, ChevronLeft, ChevronDown, User, Mail, Phone, Globe, Hotel, CalendarDays, ExternalLink, Award, CreditCard, Activity, Check } from 'lucide-react';
import { PASSENGERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

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

export default function FilteringModule() {
  // State for Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['hotel']);
  const [selectedPassenger, setSelectedPassenger] = useState<typeof PASSENGERS[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof typeof PASSENGERS[0]; direction: 'asc' | 'desc' } | null>(null);

  // Filtering Logic
  const filteredPassengers = useMemo(() => {
    return PASSENGERS.filter(p => {
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

      // Date
      if (selectedDate) {
        if (p.checkIn !== selectedDate) return false;
      }

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
  }, [searchQuery, selectedDate, activeFilters]);

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
    setSelectedDate('');
    setCurrentPage(1);
  };

  const filterOptions = {
    hotel: ["Jetwing Yala", "Jetwing Blue", "Jetwing Lagoon", "Jetwing Vil Uyana", "Jetwing Lighthouse", "Jetwing Kaduruketha"],
    country: ["Germany", "United Kingdom", "France", "Australia", "India", "China", "United States", "Sri Lanka"],
    bookingSource: ["Direct Website", "Booking.com", "Agoda", "Expedia", "Travel Agent"],
    servicesUsed: ["Safari", "Spa", "Dining", "Transfers", "Excursions", "Wellness", "Whale Watching"],
    futureBooking: ["Yes", "No"],
    guestType: ["New Guest", "Repeat Guest", "VIP Guest"],
    roomCategory: ["Standard", "Deluxe", "Suite", "Luxury Villa"],
    loyaltyStatus: ["Bronze", "Silver", "Gold", "Platinum"],
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: COLORS.text }}>Guest Intelligence</h1>
        <p className="mt-1" style={{ color: COLORS.muted }}>View, search and filter guest profiles across all Jetwing properties.</p>
      </div>

      {/* Toolbar - Single Row on Desktop, Stacked on Mobile */}
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

        {/* Date Picker */}
        <div className="relative w-64">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COLORS.muted }} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-2 transition-all"
            style={{ borderColor: COLORS.border }}
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-6 py-2 rounded-lg border font-semibold transition-all hover:bg-slate-50"
          style={{ borderColor: COLORS.border, color: COLORS.text }}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Active Filter Chips */}
      {(Object.values(activeFilters).flat().length > 0 || selectedDate || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchQuery && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all" style={{ backgroundColor: `${COLORS.primary}10`, borderColor: COLORS.primary, color: COLORS.primary }}>
              Search: {searchQuery}
              <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
            </div>
          )}
          {selectedDate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all" style={{ backgroundColor: `${COLORS.primary}10`, borderColor: COLORS.primary, color: COLORS.primary }}>
              {formatDate(selectedDate)}
              <button onClick={() => setSelectedDate('')}><X className="w-3 h-3" /></button>
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
        Showing {filteredPassengers.length} Passengers
      </div>

      {/* Passenger Table */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ borderColor: COLORS.border }}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b z-10" style={{ borderColor: COLORS.border }}>
              <tr>
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
                      setSortConfig({ key: col.key as keyof typeof PASSENGERS[0], direction });
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
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: COLORS.muted }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {paginatedPassengers.length > 0 ? (
                paginatedPassengers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
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
                  <td colSpan={9} className="px-6 py-20 text-center">
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

      {/* Filter Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: COLORS.text }}>Filters</h2>
                <p className="text-sm" style={{ color: COLORS.muted }}>Select one or more filters to narrow guest results.</p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" style={{ color: COLORS.muted }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {Object.entries(filterOptions).map(([key, options]) => {
                const isExpanded = expandedSections.includes(key);
                return (
                  <div key={key} className="border rounded-lg overflow-hidden" style={{ borderColor: COLORS.border }}>
                    <button
                      onClick={() => setExpandedSections(prev =>
                        isExpanded ? prev.filter(s => s !== key) : [...prev, key]
                      )}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 font-semibold text-sm uppercase tracking-wider"
                      style={{ color: COLORS.text }}
                    >
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded ? "" : "-rotate-90")} />
                    </button>
                    {isExpanded && (
                      <div className="p-4 grid grid-cols-1 gap-2 animate-in fade-in duration-200">
                        {options.map(option => (
                          <button
                            key={option}
                            onClick={() => toggleFilter(key, option)}
                            className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm"
                            style={{
                              backgroundColor: activeFilters[key]?.includes(option) ? `${COLORS.primary}10` : 'transparent',
                              color: activeFilters[key]?.includes(option) ? COLORS.primary : COLORS.text,
                              fontWeight: activeFilters[key]?.includes(option) ? 600 : 400
                            }}
                          >
                            <div className={cn(
                              "w-4 h-4 border rounded flex items-center justify-center transition-colors",
                              activeFilters[key]?.includes(option) ? "bg-green-600 border-green-600" : "bg-white border-slate-300"
                            )}
                            style={{
                                backgroundColor: activeFilters[key]?.includes(option) ? COLORS.primary : 'white',
                                borderColor: activeFilters[key]?.includes(option) ? COLORS.primary : '#CBD5E1'
                            }}
                            >
                              {activeFilters[key]?.includes(option) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t flex gap-3" style={{ borderColor: COLORS.border }}>
              <button
                onClick={clearAllFilters}
                className="flex-1 py-3 rounded-lg border font-bold transition-colors hover:bg-slate-50"
                style={{ borderColor: COLORS.border, color: COLORS.text }}
              >
                Clear All
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-3 rounded-lg text-white font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: COLORS.primary }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

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
                        <span className="text-lg font-bold" style={{ color: COLORS.text }}>LKR {(selectedPassenger.totalSpend * 300).toLocaleString()}</span>
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
                              <td className="px-4 py-3 text-right font-bold">LKR {(booking.amount * 300).toLocaleString()}</td>
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
              <button className="px-6 py-2 rounded-lg text-white font-bold transition-opacity hover:opacity-90" style={{ backgroundColor: COLORS.primary }}>Send Offer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
