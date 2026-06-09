"use client";

import React, { useState } from "react";
import { 
  Settings, 
  Sliders, 
  Leaf, 
  Users, 
  Save, 
  Shield, 
  Bell 
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * DATA MODEL: SRI LANKAN HOTEL METADATA
 * ============================================================================
 * Centralized list of real operational Jetwing properties. 
 * Maps unique hotel identifiers directly to their distinct ecological/regional 
 * clusters to automate compliance and weather-adjusted benchmarks.
 */
const jetwingProperties = [
  { id: "vil-uyana", name: "Jetwing Vil Uyana (Sigiriya)", cluster: "cultural-triangle" },
  { id: "lake", name: "Jetwing Lake (Dambulla)", cluster: "cultural-triangle" },
  { id: "lighthouse", name: "Jetwing Lighthouse (Galle)", cluster: "deep-south" },
  { id: "yala", name: "Jetwing Yala (Yala)", cluster: "deep-south" },
  { id: "blue", name: "Jetwing Blue (Negombo)", cluster: "western-urban" },
  { id: "colombo-seven", name: "Jetwing Colombo Seven (Colombo)", cluster: "western-urban" },
  { id: "st-andrews", name: "Jetwing St. Andrew's (Nuwara Eliya)", cluster: "hill-country" },
  { id: "kaduruketha", name: "Jetwing Kaduruketha (Wellawaya)", cluster: "hill-country" },
  { id: "surf", name: "Jetwing Surf (Pottuvil Point)", cluster: "east-coast" },
];

export default function SettingsPage() {
  /**
   * ============================================================================
   * STATE MANAGEMENT: USER INTERFACE & FORM PERSISTENCE
   * ============================================================================
   */
  // Track which settings category view is active ('general', 'guests', or 'sustainability')
  const [activeTab, setActiveTab] = useState<"general" | "guests" | "sustainability" | "billing">("general");
  
  // Manage button loading status during simulated API transaction submissions
  const [isSaving, setIsSaving] = useState(false);

  // Consolidated form values object storing all configurable platform variables
  const [settings, setSettings] = useState({
    selectedPropertyId: "vil-uyana",
    operationalCluster: "cultural-triangle",
    aiModelAccuracy: "high",
    sustainabilityAlertThreshold: 85,
    enableGuestPersonalization: true,
    weeklyEsgReport: true,
  });

  /**
   * ============================================================================
   * CORE EVENT HANDLERS
   * ============================================================================
   */
  // Synchronizes geographic operational zones instantly when the property dropdown is flipped
  const handlePropertyChange = (propertyId: string) => {
    const property = jetwingProperties.find((p) => p.id === propertyId);
    if (property) {
      setSettings({
        ...settings,
        selectedPropertyId: propertyId,
        operationalCluster: property.cluster,
      });
    }
  };

  // Handles configuration payload dispatching and triggers an interactive response alert
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("JetMind configurations saved successfully!");
    }, 1000);
  };

  /**
   * ============================================================================
   * TAB ROUTING DICTIONARY
   * ============================================================================
   * Explicitly defines labels and semantic icons used to build the responsive switcher.
   */
  const tabs = [
    { id: "general", label: "General Admin", icon: Settings },
    { id: "guests", label: "Guest Intelligence AI", icon: Users },
    { id: "sustainability", label: "Sustainability Targets", icon: Leaf },
  ] as const;

  return (
    <div className="h-full bg-gray-50/50 p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="max-w-7xl mx-auto">
        
      {/* 
        COMPONENT 1: VIEWPORT TITLE & DESCRIPTIVE HEADER 
        Frames user focus and outlines platform features managed within this interface context.
      */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <Settings className="w-8 h-8" style={{ color: "#8B9E23" }} />
          System Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure AI preferences, ESG threshold triggers, and overall JetMind parameters.
        </p>
      </div>

      <div className="flex flex-col gap-10 items-start">
        
        {/* 
          COMPONENT 2: NAVIGATION TAB BAR CONTROLLER
          Maps over the structural tab list array to render responsive selector buttons.
          Updates active hook state on click to isolate specific configuration modules.
        */}
        <div className="w-full">
          <div role="tablist" className="w-full flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                      "flex-1 px-4 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition whitespace-nowrap",
                      isActive ? "bg-[#f0f5e6] text-[#8B9E23]" : "text-gray-600 hover:bg-gray-50"
                    )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 
          COMPONENT 3: PRIMARY FORM CONTAINER CARD
          Unified context frame containing conditionally structured layout tabs.
        */}
        <div className="w-full bg-white rounded-xl border" style={{ borderColor: "#E5E5E5" }}>
          <form onSubmit={handleSave} className="p-8 space-y-8">
            
            {/* 
              TAB AREA 1: GENERAL ADMIN SEGMENT
              - Handles core hospitality identification settings.
              - Property Dropdown: Links real hotel inventory.
              - Cluster View: Disabled read-only tracker automatically driven by property matching.
              - Currency Indicator: Reassures localized finance alignment (LKR).
            */}
            {activeTab === "general" && (
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-400" /> General Configuration
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Active Jetwing Property Hub</label>
                  <select
                    value={settings.selectedPropertyId}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2"
                    style={{ focusRingColor: "#8B9E23" }}
                  >
                    {jetwingProperties.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sri Lankan Operational Cluster</label>
                  <select
                    value={settings.operationalCluster}
                    disabled
                    className="w-full p-2.5 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                  >
                    <option value="cultural-triangle">Cultural Triangle (Sigiriya, Dambulla)</option>
                    <option value="deep-south">Deep South Coast (Galle, Yala, Tangalle)</option>
                    <option value="western-urban">Western Province & Colombo (Negombo, Colombo)</option>
                    <option value="hill-country">Hill Country (Nuwara Eliya, Ella)</option>
                    <option value="east-coast">East Coast (Trincomalee, Arugam Bay)</option>
                  </select>
                  <span className="text-xs text-gray-400 mt-1.5 block">
                    Locked to matched regional zone to align climate action formulas.
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-dashed flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">System Operating Currency</span>
                  <span className="font-bold text-gray-700">LKR (₨) <span className="text-xs font-normal text-gray-400 pl-1">• Locked</span></span>
                </div>
            </div>
            )}

            {/* 
              TAB AREA 2: GUEST INTELLIGENCE AI SEGMENT
              - Tunes machine learning decision rules.
              - Strictness Selection: Swaps recommendations from flexible matching models to locked histories.
              - Personalization Toggle: Controls runtime dynamic upsell/offer injection.
            */}
            {activeTab === "guests" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-gray-400" /> Intelligence Settings
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">AI Recommendation Strictness</label>
                  <select
                    value={settings.aiModelAccuracy}
                    onChange={(e) => setSettings({ ...settings, aiModelAccuracy: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:outline-none"
                  >
                    <option value="balanced">Balanced (High discovery rate)</option>
                    <option value="high">Strict Accuracy (Matches past booking patterns explicitly)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Predictive Personalization</p>
                    <p className="text-xs text-gray-400">Autogenerate custom package offers during guest check-in queries.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableGuestPersonalization}
                    onChange={(e) => setSettings({ ...settings, enableGuestPersonalization: e.target.checked })}
                    className="w-4 h-4 accent-[#8B9E23]"
                  />
                </div>
              </div>
            )}

            {/* 
              TAB AREA 3: SUSTAINABILITY TARGETS SEGMENT
              - Handles core ESG tracking rules and alerts.
              - Slider Input: Configures real-time threshold alert limits visually.
              - Report Checkbox: Configures background cron jobs to dispatch periodic environmental audits.
            */}
            {activeTab === "sustainability" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-gray-400" /> Sustainability & ESG Alerts
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Resource Conservation Alert Trigger ({settings.sustainabilityAlertThreshold}%)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={settings.sustainabilityAlertThreshold}
                    onChange={(e) => setSettings({ ...settings, sustainabilityAlertThreshold: Number(e.target.value) })}
                    className="w-full accent-[#8B9E23]"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">
                    Alerts layout managers if water or energy targets fall below this threshold.
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Automated Carbon Reporting</p>
                    <p className="text-xs text-gray-400">Compile carbon footprints and email them to stakeholders weekly.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.weeklyEsgReport}
                    onChange={(e) => setSettings({ ...settings, weeklyEsgReport: e.target.checked })}
                    className="w-4 h-4 accent-[#8B9E23]"
                  />
                </div>
              </div>
            )}

            {/* 
              COMPONENT 4: ACTION SUBMIT FOOTER
              Contains the oversized save mechanism that commits all changes to state.
              Disables interaction styles reactively while processing actions.
            */}
            <div className="pt-6 border-t flex justify-end" style={{ borderColor: "#E5E5E5" }}>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-lg text-white text-base font-semibold shadow-md transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                style={{ backgroundColor: "#8B9E23" }}
              >
                <Save className="w-5 h-5" />
                {isSaving ? "Saving Configuration..." : "Save Settings"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
    </div>
  );
}