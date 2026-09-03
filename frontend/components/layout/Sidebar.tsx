"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe2,
  Truck,
  AlertTriangle,
  Sparkles,
  BrainCircuit,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavSection {
  title?: string;
  items: Array<{
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeVariant?: "healthy" | "attention" | "critical" | "simulation";
  }>;
}

export interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const navigation: NavSection[] = [
    {
      title: "OPERATIONS",
      items: [
        { name: "Overview", href: "/overview", icon: LayoutDashboard },
        { name: "Live World", href: "/live-world", icon: Globe2 },
        { name: "Fleet & Assets", href: "/operations", icon: Truck },
        {
          name: "Incident Center",
          href: "/incidents",
          icon: AlertTriangle,
          badge: 2,
          badgeVariant: "critical",
        },
      ],
    },
    {
      title: "INTELLIGENCE & SIMULATION",
      items: [
        {
          name: "Simulation Lab",
          href: "/simulations",
          icon: Sparkles,
          badge: "NEW",
          badgeVariant: "simulation",
        },
        { name: "Pattern Intelligence", href: "/intelligence", icon: BrainCircuit },
        { name: "Operational Analytics", href: "/analytics", icon: BarChart3 },
        { name: "Command Briefings", href: "/reports", icon: FileText },
      ],
    },
    {
      title: "SYSTEM & PLATFORM",
      items: [
        { name: "Notifications", href: "/notifications", icon: Bell, badge: 3 },
        { name: "Workspace Settings", href: "/settings", icon: Settings },
        { name: "Admin Center", href: "/admin", icon: Shield },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "w-64 border-r border-nexus-outline-variant/30 bg-nexus-surface-container-low/60 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-4 select-none",
        className
      )}
    >
      <div className="flex-1 space-y-6">
        {navigation.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            {section.title && (
              <h4 className="px-3 text-[10px] font-bold text-nexus-on-surface-variant font-mono-data uppercase tracking-wider">
                {section.title}
              </h4>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/overview" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group relative",
                      isActive
                        ? "bg-nexus-surface-container-highest text-nexus-on-surface font-semibold shadow-tactile border border-black/5"
                        : "text-nexus-on-surface-variant hover:bg-nexus-surface-container/70 hover:text-nexus-on-surface"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive
                            ? "text-nexus-secondary"
                            : "text-nexus-outline group-hover:text-nexus-on-surface"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] font-mono-data rounded-full font-bold",
                          item.badgeVariant === "critical" && "bg-red-500/15 text-red-700 dark:text-red-300",
                          item.badgeVariant === "simulation" && "bg-purple-500/15 text-purple-700 dark:text-purple-300",
                          !item.badgeVariant && "bg-nexus-surface-container-high text-nexus-on-surface-variant"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Indicator */}
      <div className="pt-4 border-t border-nexus-outline-variant/30 px-2 space-y-2">
        <div className="p-3 rounded-xl bg-nexus-surface-lowest border border-nexus-outline-variant/30 shadow-tactile">
          <div className="flex items-center justify-between text-[11px] font-mono-data">
            <span className="text-nexus-on-surface-variant">PostgreSQL Stream</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">14ms Latency</span>
          </div>
          <div className="mt-1.5 w-full bg-nexus-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-nexus-secondary h-full rounded-full w-[96%]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
