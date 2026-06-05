"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Star, MapPin, Calendar, Clock, Sparkles } from 'lucide-react';
import FilteringModule from '@/components/guests/FilteringModule';
import OfferIntelligence from '@/components/guests/OfferIntelligence';

const guestProfiles = [
  { 
    id: 1, 
    name: 'Sarah Mitchell', 
    email: 'sarah.m@example.com', 
    tier: 'Platinum', 
    totalSpend: 850000, 
    lastStay: '2024-05-12', 
    preference: 'High Floor, Eco-tours',
    sentiment: 0.92
  },
  { 
    id: 2, 
    name: 'James Wilson', 
    email: 'j.wilson@example.com', 
    tier: 'Gold', 
    totalSpend: 420000, 
    lastStay: '2024-None-20',
    preference: 'Vegan menu, Spa regular',
    sentiment: 0.85
  },
  { 
    id: 3, 
    name: 'Elena Rodriguez', 
    email: 'elena.r@example.com', 
    tier: 'Silver', 
    totalSpend: 150000, 
    lastStay: '2023-None-05',
    preference: 'Quiet room, Early check-in',
    sentiment: 0.78
  },
];

export default function GuestsPage() {
  const [view, setView] = useState<'analytics' | 'filtering' | 'recommendations'>('analytics');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const viewParam = searchParams.get('view');
    if (viewParam === 'analytics' || viewParam === 'filtering' || viewParam === 'recommendations') {
      setView(viewParam);
    }

    const handleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setView(customEvent.detail.view);
    };

    window.addEventListener('guestViewChange', handleViewChange);
    return () => window.removeEventListener('guestViewChange', handleViewChange);
  }, []);

  if (view === 'filtering') {
    return <FilteringModule />;
  }

  if (view === 'recommendations') {
    return <OfferIntelligence />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight" style={{color: '#1a1a1a'}}>Guest Intelligence Layer</h1>
          <p style={{color: '#999'}}>Unified 360-degree guest profiles and personalized insights.</p>
        </div>
        <Button>Add New Guest</Button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{color: '#999'}} />
        <input 
          type="text" 
          placeholder="Search by name, email, passport or booking ID..." 
          className="w-full bg-white border rounded-xl py-4 pl-12 pr-4 text-sm transition-all outline-none shadow-sm"
          style={{borderColor: '#E5E5E5', boxShadow: 'inset 0 0 0 1px #E5E5E5'}}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Guest Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{borderColor: '#E5E5E5'}}>
                {guestProfiles.map((guest) => (
                  <div key={guest.id} className="py-4 flex items-center justify-between px-2 rounded-lg" style={{borderBottom: '1px solid #E5E5E5'}}>
                    <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold" style={{backgroundColor: '#8B9E23'}}>
                        {guest.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold" style={{color: '#1a1a1a'}}>{guest.name}</p>
                        <p className="text-xs" style={{color: '#999'}}>{guest.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white" style={{
                          backgroundColor: guest.tier === 'Platinum' ? '#E91E8C' : guest.tier === 'Gold' ? '#FFC107' : '#8B9E23',
                          color: guest.tier === 'Gold' ? '#1a1a1a' : 'white'
                        }}>
                          {guest.tier}
                        </span>
                        <div className="flex items-center font-bold text-xs" style={{color: '#8B9E23'}}>
                          <Star className="w-3 h-3 fill-current mr-0.5" />
                          {guest.sentiment * 10}
                        </div>
                      </div>
                      <p className="text-sm font-bold" style={{color: '#1a1a1a'}}>LKR {guest.totalSpend.toLocaleString()}</p>
                      <p className="text-[10px]" style={{color: '#999'}}>Lifetime Spend</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border" style={{borderColor: '#E5E5E5'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{color: '#E91E8C'}}>
                <Sparkles className="w-5 h-5" style={{color: '#FFC107'}} />
                AI Personalisation: Next-Best Offer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border" style={{backgroundColor: '#fffbf0', borderColor: '#FFC107'}}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color: '#E91E8C'}}>82% Conversion Prob.</p>
                  <h4 className="font-bold text-lg" style={{color: '#1a1a1a'}}>Signature Spa Upgrade</h4>
                  <p className="text-sm mt-1" style={{color: '#666'}}>Target: Sarah Mitchell. History shows 3 previous spa visits in Lake property.</p>
                  <Button variant="outline" size="sm" className="mt-4">Push to Front Desk</Button>
                </div>
                <div className="p-4 rounded-lg border" style={{backgroundColor: '#f0fbf5', borderColor: '#8B9E23'}}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color: '#8B9E23'}}>65% Conversion Prob.</p>
                  <h4 className="font-bold text-lg" style={{color: '#1a1a1a'}}>Eco-Safari Package</h4>
                  <p className="text-sm mt-1" style={{color: '#666'}}>Target: James Wilson. Recent interest in sustainability dashboard detected.</p>
                  <Button variant="outline" size="sm" className="mt-4">Push to Front Desk</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unified Profile Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg" style={{backgroundColor: '#f0fbf5'}}>
                  <MapPin className="w-4 h-4" style={{color: '#8B9E23'}} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{color: '#1a1a1a'}}>Cross-Property Guest</p>
                  <p className="text-xs mt-1" style={{color: '#999'}}>34% of guests have stayed at more than 2 Jetwing properties.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg" style={{backgroundColor: '#fffbf0'}}>
                  <Calendar className="w-4 h-4" style={{color: '#FFC107'}} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{color: '#1a1a1a'}}>Average Lead Time</p>
                  <p className="text-xs mt-1" style={{color: '#999'}}>22 days for domestic leisure; 65 days for international MICE.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg" style={{backgroundColor: '#fef3f8'}}>
                  <Clock className="w-4 h-4" style={{color: '#E91E8C'}} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{color: '#1a1a1a'}}>Peak Engagement Time</p>
                  <p className="text-xs mt-1" style={{color: '#999'}}>Guests most likely to respond to surveys within 48h of checkout.</p>
                </div>
              </div>
              <div className="pt-4 border-t" style={{borderColor: '#E5E5E5'}}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color: '#999'}}>Top Segments</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{backgroundColor: '#f0fbf5', color: '#8B9E23'}}>Domestic Leisure</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{backgroundColor: '#fffbf0', color: '#FFC107'}}>Eco-Conscious</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{backgroundColor: '#fef3f8', color: '#E91E8C'}}>Wellness Seekers</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
