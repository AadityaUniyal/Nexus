"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  AlertTriangle,
  BarChart3,
  Bell,
  Settings,
  LifeBuoy,
  Smartphone,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const PRIMARY_NAVIGATION: NavItem[] = [
  { name: "Command Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Operations & Fleet", href: "/operations", icon: Truck },
  { name: "Exceptions Queue", href: "/incidents", icon: AlertTriangle, badge: "2 Active", badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" },
  { name: "Fleet Analytics", href: "/analytics", icon: BarChart3 },
  { name: "System Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-64 shrink-0 border-r border-black/[0.08] dark:border-white/[0.10] bg-white dark:bg-[#121214] flex flex-col justify-between select-none",
        className
      )}
    >
      {/* Top Nav List */}
      <div className="p-4 space-y-6">
        <div>
          <span className="px-3 text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold">
            Fleet Operations
          </span>
          <nav className="mt-2 space-y-1">
            {PRIMARY_NAVIGATION.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/overview" && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all group",
                    isActive
                      ? "bg-[#0071E3] text-white shadow-sm font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300")} />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-mono font-medium", isActive ? "bg-white/20 text-white" : item.badgeColor)}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Driver Pass Sandbox Card */}
        <div className="p-3.5 rounded-2xl border border-black/[0.08] dark:border-white/[0.10] bg-[#F9F9FB] dark:bg-[#1A1A1E]">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-neutral-900 dark:text-white">
            <Smartphone className="w-4 h-4 text-[#0071E3]" />
            <span>Driver Web Pass</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-normal">
            Zero-install browser HUD for truck drivers with GPS streaming.
          </p>
          <Link
            href="/driver-pass"
            target="_blank"
            className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0071E3] hover:underline"
          >
            Launch Mobile Demo
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Bottom Workspace Status */}
      <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Azure Live Gateway
          </span>
          <span>v2.0-PROD</span>
        </div>
      </div>
    </aside>
  );
}
