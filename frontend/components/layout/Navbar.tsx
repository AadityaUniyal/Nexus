"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Sparkles,
  Shield,
  Activity,
  ChevronDown,
  User,
  LogOut,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLed } from "@/components/ui/status-led";
import { formatDateTime } from "@/lib/utils";
import { TelemetryStreamController } from "./TelemetryStreamController";

export interface NavbarProps {
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenCommandMenu?: () => void;
}

export function Navbar({
  unreadCount = 2,
  onOpenNotifications,
  onOpenCommandMenu,
}: NavbarProps) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = React.useState<string>("");
  const [profileOpen, setProfileOpen] = React.useState(false);

  React.useEffect(() => {
    setCurrentTime(formatDateTime(new Date()));
    const timer = setInterval(() => {
      setCurrentTime(formatDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Left: Brand Identity & Workspace Switcher */}
      <div className="flex items-center gap-6">
        <Link href="/overview" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-nexus-primary-container flex items-center justify-center text-white shadow-tactile group-hover:scale-105 transition-transform">
            <span className="font-bold text-sm tracking-tighter">NX</span>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-nexus-on-surface flex items-center gap-1.5">
              NEXUS
              <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-nexus-secondary/15 text-nexus-secondary font-semibold">
                PRO
              </span>
            </span>
          </div>
        </Link>

        {/* Workspace Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-nexus-surface-container/60 border border-nexus-outline-variant/30 text-xs font-mono-data text-nexus-on-surface">
          <StatusLed status="HEALTHY" size="sm" />
          <span className="font-semibold text-nexus-on-surface">WS-NEXUS-01</span>
          <span className="text-nexus-outline">·</span>
          <span className="text-nexus-on-surface-variant">North America Central</span>
        </div>
      </div>

      {/* Middle: Command Search Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <button
          onClick={onOpenCommandMenu}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-nexus-surface-container/70 hover:bg-nexus-surface-container border border-nexus-outline-variant/40 text-xs text-nexus-on-surface-variant transition-colors shadow-tactile-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-nexus-outline" />
            <span>Search vehicles, routes, incidents, simulations...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-nexus-surface-lowest text-[10px] font-mono-data border border-nexus-outline-variant/40 shadow-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Telemetry Stream Controller, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Live Telemetry Stream Controller */}
        <div className="hidden sm:block">
          <TelemetryStreamController />
        </div>

        {/* Quick Simulation Lab Button */}
        <Link href="/simulations/new">
          <Button variant="simulation" size="sm" className="hidden sm:flex font-mono-data text-xs shadow-tactile">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Simulate
          </Button>
        </Link>

        {/* Notifications Icon Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-nexus-on-surface-variant hover:text-nexus-on-surface hover:bg-nexus-surface-container transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-nexus-surface" />
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-nexus-surface-container transition-colors border border-nexus-outline-variant/20"
          >
            <div className="h-7 w-7 rounded-lg bg-nexus-secondary text-white flex items-center justify-center font-bold text-xs">
              SC
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-nexus-on-surface leading-tight">Sarah Chen</p>
              <p className="text-[10px] text-nexus-on-surface-variant font-mono-data">Ops Manager</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-nexus-outline" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 p-2 rounded-xl bg-nexus-surface-lowest shadow-2xl border border-nexus-outline-variant/40 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-nexus-outline-variant/20 mb-1">
                <p className="text-xs font-bold text-nexus-on-surface">Sarah Chen</p>
                <p className="text-[11px] text-nexus-on-surface-variant font-mono-data">sarah.chen@nexus.ops</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-nexus-surface-container text-nexus-on-surface transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span>My Profile & Preferences</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-nexus-surface-container text-nexus-on-surface transition-colors"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Workspace Settings</span>
              </Link>
              <Link
                href="/admin"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-nexus-surface-container text-nexus-on-surface transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-nexus-secondary" />
                <span>Admin Platform</span>
              </Link>
              <div className="border-t border-nexus-outline-variant/20 my-1" />
              <Link
                href="/login"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-red-500/10 text-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
