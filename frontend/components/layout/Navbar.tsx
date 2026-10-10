"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { useWorkspace } from "@/lib/queries";
import { Compass, Users, BarChart3, Settings, ShieldCheck, Activity, Layers } from "lucide-react";

export interface NavbarProps {
  connectionState?: "live" | "reconnecting" | "offline";
  lastPingTime?: string | null;
}

export function Navbar({ connectionState = "live", lastPingTime }: NavbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: workspace } = useWorkspace();

  const links = [
    { href: "/app", label: "Cockpit", icon: Compass },
    { href: "/drivers", label: "Drivers", icon: Users },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/architecture", label: "Architecture", icon: Layers },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur px-4 flex items-center justify-between z-30">
      <div className="flex items-center gap-6">
        <Link href="/app" className="flex items-center gap-2 font-bold tracking-tight text-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span>NEXUS</span>
        </Link>

        {workspace && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-muted/60 text-xs text-muted-foreground border border-border/50">
            <span className="font-medium text-foreground">{workspace.name}</span>
            <span>•</span>
            <span>{workspace.country}</span>
            <span>•</span>
            <span className="uppercase">{workspace.distance_unit}</span>
          </div>
        )}

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection status banner (AC-60) */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            connectionState === "live"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : connectionState === "reconnecting"
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connectionState === "live"
                ? "bg-emerald-500"
                : connectionState === "reconnecting"
                ? "bg-amber-500"
                : "bg-destructive"
            }`}
          />
          <span className="capitalize">{connectionState}</span>
          {connectionState !== "live" && lastPingTime && (
            <span className="text-[10px] opacity-75">as of {lastPingTime}</span>
          )}
        </div>

        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
