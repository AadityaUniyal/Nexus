"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Truck,
  AlertTriangle,
  GitBranch,
  Lightbulb,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Shield,
  LineChart,
  Building2,
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

const NAVIGATION: NavSection[] = [
  {
    title: "Analytics",
    items: [
      { name: "Overview", href: "/overview", icon: LayoutDashboard },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Insights", href: "/intelligence", icon: Lightbulb },
      { name: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Live map", href: "/live-world", icon: Map },
      { name: "Fleet & assets", href: "/operations", icon: Truck },
      { name: "Incidents", href: "/incidents", icon: AlertTriangle },
      { name: "Scenario planner", href: "/simulations", icon: GitBranch },
    ],
  },
  {
    title: "Workspace",
    items: [
      { name: "Company Command", href: "/admin/company", icon: Building2, badge: "Admin" },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Admin Console", href: "/admin/dashboard", icon: Shield },
      { name: "Usage analytics", href: "/admin/analytics", icon: LineChart },
    ],
  },
];

type Health = "checking" | "ok" | "degraded";

function useApiHealth(): { state: Health; latency: number | null } {
  const [state, setState] = React.useState<Health>("checking");
  const [latency, setLatency] = React.useState<number | null>(null);
  React.useEffect(() => {
    let alive = true;
    const ping = async () => {
      const t0 = performance.now();
      try {
        const r = await fetch("/api/v1/health", { cache: "no-store" });
        if (!alive) return;
        setLatency(Math.round(performance.now() - t0));
        setState(r.ok ? "ok" : "degraded");
      } catch {
        if (alive) setState("degraded");
      }
    };
    ping();
    const id = setInterval(ping, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return { state, latency };
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname() || "";
  const health = useApiHealth();

  const activeHref = React.useMemo(() => {
    const all = NAVIGATION.flatMap((s) => s.items.map((i) => i.href));
    return all
      .filter((h) => pathname === h || pathname.startsWith(h + "/"))
      .sort((a, b) => b.length - a.length)[0];
  }, [pathname]);

  return (
    <aside
      aria-label="Primary"
      className={cn(
        "w-60 border-r border-nexus-outline-variant/60 bg-nexus-surface flex flex-col shrink-0 min-h-[calc(100vh-4rem)] px-3 py-5 select-none",
        className
      )}
    >
      <nav className="flex-1 space-y-6">
        {NAVIGATION.map((section) => (
          <div key={section.title} className="space-y-1">
            <h2 className="px-3 pb-1 text-[11px] font-semibold text-nexus-on-surface-variant uppercase tracking-[0.08em]">
              {section.title}
            </h2>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeHref === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => onNavigate?.()}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-brand-50 text-brand-800 font-semibold dark:bg-nexus-secondary-container dark:text-nexus-on-secondary-container"
                          : "text-nexus-on-surface-variant hover:bg-nexus-surface-container hover:text-nexus-on-surface"
                      )}
                    >
                      {isActive && (
                        <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-nexus-secondary" />
                      )}
                      <Icon className={cn("h-4 w-4", isActive ? "text-nexus-secondary" : "text-nexus-outline")} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="pt-4 mt-4 border-t border-nexus-outline-variant/60 px-1">
        <div className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-nexus-surface-container-low text-xs" role="status">
          <span className="flex items-center gap-2 text-nexus-on-surface-variant">
            <span
              aria-hidden
              className={cn(
                "h-2 w-2 rounded-full",
                health.state === "ok" && "bg-emerald-500",
                health.state === "degraded" && "bg-amber-500",
                health.state === "checking" && "bg-nexus-outline"
              )}
            />
            {health.state === "ok" ? "All systems normal" : health.state === "degraded" ? "API degraded" : "Checking status"}
          </span>
          {health.latency !== null && (
            <span className="font-mono-data text-nexus-on-surface-variant">{health.latency} ms</span>
          )}
        </div>
      </div>
    </aside>
  );
}
