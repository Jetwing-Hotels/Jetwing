"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Leaf,
  Settings,
  CloudSun, Zap, Droplets, Trash2, Bird, FileBarChart, ShieldAlert, Target, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Executive Dashboard', href: '/' },
  { icon: Users, label: 'Guest Intelligence', href: '/guests' },
  { icon: Leaf, label: 'Sustainability', href: '/sustainability', submenu: [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'climate', label: 'Climate Action', icon: CloudSun },
    { id: 'energy', label: 'Energy Management', icon: Zap },
    { id: 'water', label: 'Water Management', icon: Droplets },
    { id: 'waste', label: 'Waste Management', icon: Trash2 },
    { id: 'biodiversity', label: 'Biodiversity', icon: Bird },
    { id: 'community', label: 'Community Impact', icon: Users },
    { id: 'esg', label: 'ESG Reports', icon: FileBarChart },
    { id: 'risk', label: 'Risk Management', icon: ShieldAlert },
    { id: 'goals', label: 'Sustainability Goals', icon: Target },
  ] },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(new Set(pathname.includes('/sustainability') ? ['sustainability'] : []));

  const toggleSubmenu = (id: string) => {
    const newSet = new Set(expandedSubmenus);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedSubmenus(newSet);
  };

  const isSustainabilityPage = pathname.includes('/sustainability');

  return (
    <div className="flex flex-col h-screen w-64 border-r fixed left-0 top-0" style={{backgroundColor: '#ffffff', borderColor: '#E5E5E5'}}>
      <div className="flex items-center gap-3 px-6 py-8 border-b" style={{borderColor: '#E5E5E5'}}>
        <img src="/jetwing-logo.svg" alt="Jetwing Logo" className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight" style={{color: '#8B9E23'}}>JetMind</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const isExpanded = expandedSubmenus.has('sustainability') && item.label === 'Sustainability';
          const hasSubmenu = 'submenu' in item;

          return (
            <div key={item.href}>
              <button
                onClick={() => hasSubmenu && isSustainabilityPage ? toggleSubmenu('sustainability') : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive ? "shadow-lg" : ""
                )}
                style={isActive || isSustainabilityPage ? {backgroundColor: '#f0f5e6', borderLeft: '3px solid #8B9E23'} : {backgroundColor: 'transparent'}}
              >
                <Link href={item.href} className="flex items-center gap-3 flex-1">
                  <item.icon className="w-5 h-5 transition-colors" style={{color: isActive || isSustainabilityPage ? '#8B9E23' : '#999'}} />
                  <span className="font-medium text-sm" style={{color: isActive || isSustainabilityPage ? '#8B9E23' : '#333'}}>{item.label}</span>
                </Link>
                {hasSubmenu && isSustainabilityPage && (
                  <ChevronRight className="w-4 h-4 transition-transform" style={{color: '#8B9E23', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}} />
                )}
              </button>

              {hasSubmenu && isSustainabilityPage && isExpanded && item.submenu && (
                <div className="mt-1 space-y-0.5 ml-2 pl-3 border-l-2" style={{borderColor: '#E5E5E5'}}>
                  {item.submenu.map((sub) => {
                    const isSubActive = pathname === `/sustainability?view=${sub.id}`;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          const event = new CustomEvent('sustainabilityViewChange', { detail: { view: sub.id } });
                          window.dispatchEvent(event);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
                        style={{backgroundColor: isSubActive ? '#E8F3D6' : 'transparent', color: isSubActive ? '#8B9E23' : '#666'}}
                      >
                        <sub.icon className="w-4 h-4" style={{color: isSubActive ? '#8B9E23' : '#999'}} />
                        <span className="font-medium">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t" style={{borderColor: '#E5E5E5'}}>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
          style={{color: '#666'}}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm">Settings</span>
        </Link>
      </div>
    </div>
  );
}
