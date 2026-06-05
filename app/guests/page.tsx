"use client"

import React, { useState, useEffect } from 'react';
import GuestAnalytics from '@/components/guests/GuestAnalytics';
import GuestFiltering from '@/components/guests/GuestFiltering';

type GuestView = 'analytics' | 'filtering' | 'recommendations';

export default function GuestsPage() {
  const [currentView, setCurrentView] = useState<GuestView>('filtering');

  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.view) {
        setCurrentView(customEvent.detail.view as GuestView);
      }
    };

    window.addEventListener('guestViewChange', handleViewChange);
    return () => window.removeEventListener('guestViewChange', handleViewChange);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'analytics':
        return <GuestAnalytics />;
      case 'recommendations':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <h2 className="text-2xl font-bold" style={{color: '#1a1a1a'}}>AI Offer Recommendations</h2>
            <p style={{color: '#999'}}>This module is currently under development (Phase 2).</p>
          </div>
        );
      case 'filtering':
      default:
        return <GuestFiltering />;
    }
  };

  return (
    <div className="flex-1 min-w-0">
      <main className="p-8">
        {renderView()}
      </main>
    </div>
  );
}
