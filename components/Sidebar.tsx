"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Leaf,
  Settings,
  BarChart3,
  Search,
  Sparkles,
  CloudSun,
  Zap,
  Droplets,
  Trash2,
  // Bird,
  // FileBarChart,
  // ShieldAlert,
  // Target,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Executive Dashboard", href: "/" },
  {
    id: "guests",
    icon: Users,
    label: "Guest Intelligence",
    href: "/guests",
    submenu: [
      { id: "analytics", label: "Guest Analytics", icon: BarChart3 },
      { id: "filtering", label: "Filtering & Intelligence", icon: Search },
      { id: "recommendations", label: "Offer Recommendations", icon: Sparkles },
    ],
  },
  {
    id: "sustainability",
    icon: Leaf,
    label: "Sustainability",
    href: "/sustainability",
    submenu: [
      { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
      { id: "climate", label: "Climate Action", icon: CloudSun },
      { id: "energy", label: "Energy Management", icon: Zap },
      { id: "water", label: "Water Management", icon: Droplets },
      { id: "waste", label: "Waste Management", icon: Trash2 },
      // { id: 'biodiversity', label: 'Biodiversity', icon: Bird },
      { id: "community", label: "Community Impact", icon: Users },
      // { id: 'esg', label: 'ESG Reports', icon: FileBarChart },
      // { id: 'risk', label: 'Risk Management', icon: ShieldAlert },
      // { id: 'goals', label: 'Sustainability Goals', icon: Target },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(
    new Set(),
  );

  const [currentGuestView, setCurrentGuestView] = useState<string>("");
  const [currentSustainabilityView, setCurrentSustainabilityView] =
    useState<string>("");

  useEffect(() => {
    const defaults: string[] = [];

    if (pathname?.includes("/sustainability")) defaults.push("sustainability");
    if (pathname?.includes("/guests")) defaults.push("guests");

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedSubmenus(new Set(defaults));
  }, [pathname]);

  useEffect(() => {
    const onGuest = (e: unknown) => {
      const v = (e as any)?.detail?.view || "analytics";
      setCurrentGuestView(v);
    };

    // Initialize from URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initial =
        params.get("view") ||
        (pathname?.includes("/guests") ? "analytics" : "");

      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (initial) setCurrentGuestView(initial);
    }

    window.addEventListener("guestViewChange", onGuest as EventListener);
    return () =>
      window.removeEventListener("guestViewChange", onGuest as EventListener);
  }, [pathname]);

  useEffect(() => {
    const onSustainability = (e: unknown) => {
      const v = (e as any)?.detail?.view || "overview";
      setCurrentSustainabilityView(v);
    };

    // Initialize from URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initial =
        params.get("view") ||
        (pathname?.includes("/sustainability") ? "overview" : "");

      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (initial) setCurrentSustainabilityView(initial);
    }

    window.addEventListener(
      "sustainabilityViewChange",
      onSustainability as EventListener,
    );
    return () =>
      window.removeEventListener(
        "sustainabilityViewChange",
        onSustainability as EventListener,
      );
  }, [pathname]);

  const toggleSubmenu = (id: string) => {
    const newSet = new Set(expandedSubmenus);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedSubmenus(newSet);
  };

  return (
    <div
      className="flex flex-col h-screen w-64 border-r fixed left-0 top-0"
      style={{ backgroundColor: "#ffffff", borderColor: "#E5E5E5" }}
    >
      <div
        className="flex items-center gap-3 px-6 py-8 border-b"
        style={{ borderColor: "#E5E5E5" }}
      >
        <img src="/jetwing-logo.png" alt="Jetwing Logo" className="w-8 h-8" />
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: "#8B9E23" }}
        >
          JetMind
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const hasSubmenu = !!item.submenu;
          const isExpanded = item.id ? expandedSubmenus.has(item.id) : false;

          const isItemPage = item.href ? pathname.includes(item.href) : false;

          return (
            <div key={item.href}>
              <button
                onClick={() =>
                  hasSubmenu && isItemPage && item.id
                    ? toggleSubmenu(item.id)
                    : undefined
                }
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive ? "shadow-lg" : "",
                )}
                style={
                  isActive || isItemPage
                    ? {
                        backgroundColor: "#f0f5e6",
                        borderLeft: "3px solid #8B9E23",
                      }
                    : { backgroundColor: "transparent" }
                }
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-3 flex-1"
                >
                  <item.icon
                    className="w-5 h-5 transition-colors"
                    style={{
                      color: isActive || isItemPage ? "#8B9E23" : "#999",
                    }}
                  />
                  <span
                    className="font-medium text-sm"
                    style={{
                      color: isActive || isItemPage ? "#8B9E23" : "#333",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>

                {hasSubmenu && isItemPage && (
                  <ChevronRight
                    className="w-4 h-4 transition-transform"
                    style={{
                      color: "#8B9E23",
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  />
                )}
              </button>

              {hasSubmenu && isItemPage && isExpanded && item.submenu && (
                <div
                  className="mt-1 space-y-0.5 ml-2 pl-3 border-l-2"
                  style={{ borderColor: "#E5E5E5" }}
                >
                  {item.submenu.map((sub) => {
                    const parentId = item.id;

                    let isSubActive = false;

                    if (parentId === "guests") {
                      isSubActive = currentGuestView === sub.id;
                    } else if (parentId === "sustainability") {
                      isSubActive = currentSustainabilityView === sub.id;
                    }

                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          const eventName =
                            item.id === "sustainability"
                              ? "sustainabilityViewChange"
                              : "guestViewChange";

                          const event = new CustomEvent(eventName, {
                            detail: { view: sub.id },
                          });

                          window.dispatchEvent(event);

                          if (item.id === "guests") {
                            setCurrentGuestView(sub.id);
                          }

                          if (item.id === "sustainability") {
                            setCurrentSustainabilityView(sub.id);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
                        style={{
                          backgroundColor: isSubActive
                            ? "#E8F3D6"
                            : "transparent",
                          color: isSubActive ? "#8B9E23" : "#666",
                        }}
                      >
                        <sub.icon
                          className="w-4 h-4"
                          style={{
                            color: isSubActive ? "#8B9E23" : "#999",
                          }}
                        />
                        <span
                          className={isSubActive ? "font-bold" : "font-medium"}
                        >
                          {sub.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: "#E5E5E5" }}>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
          style={{ color: "#666" }}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm">Settings</span>
        </Link>
      </div>
    </div>
  );
}
