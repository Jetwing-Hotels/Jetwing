"use client"

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Bell, Users, Shield, Palette, Database, LogOut, Save } from 'lucide-react';

const settingsSections = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'team', label: 'Team & Access', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Data & Integration', icon: Database },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('notifications');
  const [changes, setChanges] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  
  const renderSection = () => {
    switch (activeSection) {
      case 'notifications':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a1a1a' }}>Email Notifications</h3>
              <div className="space-y-4">
                {[
                  { label: 'Revenue Alerts', description: 'Daily summary of revenue changes' },
                  { label: 'Booking Alerts', description: 'Cancellations and new bookings' },
                  { label: 'Demand Forecasting', description: 'Occupancy threshold warnings' },
                  { label: 'System Updates', description: 'App maintenance and feature releases' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: '#E5E5E5' }}>
                    <div>
                      <p className="font-medium" style={{ color: '#1a1a1a' }}>{item.label}</p>
                      <p className="text-sm" style={{ color: '#999' }}>{item.description}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded" style={{ accentColor: '#8B9E23' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'team':
        return (
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold" style={{ color: '#1a1a1a' }}>Team Members</h3>
                <Button size="sm">Invite Member</Button>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Admin User', email: 'admin@jetwing.com', role: 'Admin' },
                  { name: 'Manager', email: 'manager@jetwing.com', role: 'Editor' },
                  { name: 'Analyst', email: 'analyst@jetwing.com', role: 'Viewer' },
                ].map((member) => (
                  <div key={member.email} className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: '#E5E5E5' }}>
                    <div>
                      <p className="font-medium" style={{ color: '#1a1a1a' }}>{member.name}</p>
                      <p className="text-sm" style={{ color: '#999' }}>{member.email}</p>
                    </div>
                    <Select 
                      options={[
                        { value: 'admin', label: 'Admin' },
                        { value: 'editor', label: 'Editor' },
                        { value: 'viewer', label: 'Viewer' }
                      ]}
                      value={member.role.toLowerCase()}
                      onChange={() => setChanges(true)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a1a1a' }}>Security Settings</h3>
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium" style={{ color: '#1a1a1a' }}>Two-Factor Authentication</p>
                        <p className="text-sm" style={{ color: '#999' }}>Add an extra layer of security</p>
                      </div>
                      <Button size="sm" variant="outline">Enable</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium" style={{ color: '#1a1a1a' }}>Change Password</p>
                        <p className="text-sm" style={{ color: '#999' }}>Update your account password</p>
                      </div>
                      <Button size="sm" variant="outline">Change</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a1a1a' }}>Theme</h3>
              <div className="space-y-4">
                {[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                  { label: 'Auto', value: 'auto' },
                ].map((theme) => (
                  <label key={theme.value} className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer" style={{ borderColor: '#E5E5E5' }}>
                    <input type="radio" name="theme" defaultChecked={theme.value === 'light'} className="w-4 h-4" style={{ accentColor: '#8B9E23' }} />
                    <span style={{ color: '#1a1a1a' }}>{theme.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a1a1a' }}>Data Integration</h3>
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium" style={{ color: '#1a1a1a' }}>API Key</p>
                        <p className="text-sm" style={{ color: '#999' }}>Generate API key for integrations</p>
                      </div>
                      <Button size="sm" variant="outline">Generate</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium" style={{ color: '#1a1a1a' }}>Export Data</p>
                        <p className="text-sm" style={{ color: '#999' }}>Download your historical data</p>
                      </div>
                      <Button size="sm" variant="outline">Export</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#1a1a1a' }}>Settings</h1>
        <p style={{ color: '#999' }}>Manage your account, team, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left"
                style={{
                  backgroundColor: activeSection === section.id ? '#f0f5e6' : 'transparent',
                  borderLeft: activeSection === section.id ? '3px solid #8B9E23' : 'none',
                  color: activeSection === section.id ? '#8B9E23' : '#666'
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              {renderSection()}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="danger" onClick={() => setShowLogout(true)}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
        <div className="flex gap-3">
          <Button variant="outline">Cancel</Button>
          <Button onClick={() => setChanges(false)} disabled={!changes}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Modal 
        isOpen={showLogout} 
        onClose={() => setShowLogout(false)}
        title="Confirm Logout"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowLogout(false)}>Cancel</Button>
            <Button variant="danger">Logout</Button>
          </>
        }
      >
        <p style={{ color: '#666' }}>Are you sure you want to logout? You'll need to log in again to access the dashboard.</p>
      </Modal>
    </div>
  );
}
