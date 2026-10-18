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
import { motion } from "motion/react";

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
    title: "Operations",
    items: [
      { name: "Overview", href: "/overview", icon: LayoutDashboard },
      { name: "Shipments & Fleet", href: "/operations", icon: Truck },
      { name: "Live Operations", href: "/live-world", icon: Map },
    ],
  },
  {
    title: "Decisions & Planning",
    items: [
      { name: "Exceptions Queue", href: "/incidents", icon: AlertTriangle },
      { name: "Planning & Scenarios", href: "/simulations", icon: GitBranch },
      { name: "Operations Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Workspace",
    items: [
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "System Settings", href: "/settings", icon: Settings },
      { name: "Audit & Access", href: "/admin/audit", icon: Shield },
    ],
  },
];

import { apiFetch } from "@/lib/api/http";

type Health = "checking" | "ok" | "degraded";

function useApiHealth(): { state: Health; latency: number | null } {
  const [state, setState] = React.useState<Health>("checking");
  const [latency, setLatency] = React.useState<number | null>(null);
  React.useEffect(() => {
    let alive = true;
    const ping = async () => {
      const t0 = performance.now();
      try {
        const r = await apiFetch("/api/v1/health", { cache: "no-store" });
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
        "w-64 border-r border-stone-200/70 dark:border-white/10 bg-white/65 dark:bg-stone-950/65 backdrop-blur-2xl flex flex-col shrink-0 min-h-[calc(100vh-4rem)] px-3.5 py-5 select-none font-sans",
        className
      )}
    >
      <nav className="flex-1 space-y-6">
        {NAVIGATION.map((section) => (
          <div key={section.title} className="space-y-1">
            <h2 className="px-3 pb-1.5 text-[10px] font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              {section.title}
            </h2>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeHref === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href} className="relative">
                    <Link
                      href={item.href}
                      onClick={() => onNavigate?.()}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative z-10 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors select-none",
                        isActive
                          ? "text-stone-900 dark:text-white font-semibold"
                          : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/70 dark:hover:bg-white/5"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 35,
                            mass: 0.5,
                          }}
                          className="absolute inset-0 rounded-xl bg-white dark:bg-stone-850 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] border border-black/5 dark:border-white/10 -z-10"
                        />
                      )}
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400 dark:text-stone-500")} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="pt-4 mt-4 border-t border-stone-200/60 dark:border-stone-800/60 px-0.5">
        <div className="flex items-center justify-between rounded-xl p-2.5 bg-stone-100/70 dark:bg-stone-900/70 border border-stone-200/50 dark:border-white/5 text-[11px] font-mono" role="status">
          <span className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
            <span
              aria-hidden
              className={cn(
                "h-2 w-2 rounded-full",
                health.state === "ok" && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                health.state === "degraded" && "bg-amber-500",
                health.state === "checking" && "bg-stone-400"
              )}
            />
            {health.state === "ok" ? "All systems normal" : health.state === "degraded" ? "API degraded" : "Checking status"}
          </span>
          {health.latency !== null && (
            <span className="font-mono text-[10px] text-stone-500">{health.latency} ms</span>
          )}
        </div>
      </div>
    </aside>
  );
}
