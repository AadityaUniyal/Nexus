"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  GitBranch,
  Menu,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { StatusLed } from "@/components/ui/status-led";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { formatDateTime } from "@/lib/utils";
import { TelemetryStreamController } from "./TelemetryStreamController";
import { UserButton, useUser } from "@clerk/nextjs";

export interface NavbarProps {
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenCommandMenu?: () => void;
  onOpenMobileMenu?: () => void;
}

export function Navbar({
  unreadCount = 2,
  onOpenNotifications,
  onOpenCommandMenu,
  onOpenMobileMenu,
}: NavbarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [currentTime, setCurrentTime] = React.useState<string>("");

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
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-nexus-on-surface-variant hover:text-nexus-on-surface hover:bg-nexus-surface-container transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Logo href="/overview" size={30} />

        {/* Workspace Pill */}
        <div className="hidden md:flex items-center gap-2 pl-4 ml-1 border-l border-nexus-outline-variant/70 text-sm text-nexus-on-surface">
          <StatusLed status="HEALTHY" size="sm" />
          <span className="font-medium">Main workspace</span>
        </div>
      </div>

      {/* Middle: Command Search Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <button
          type="button"
          onClick={onOpenCommandMenu}
          aria-label="Search operational assets, vehicles, routes, and commands"
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
        <ButtonLink href="/simulations/new" variant="secondary" size="sm" className="hidden sm:inline-flex" data-track="nav_new_scenario">
          <GitBranch className="h-3.5 w-3.5" aria-hidden />
          New scenario
        </ButtonLink>

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

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User Profile Menu with Clerk */}
        <div className="flex items-center gap-2.5 pl-1">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 rounded-lg shadow-tactile border border-nexus-outline-variant/40",
              },
            }}
          />
          {user && (
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-nexus-on-surface leading-tight">
                {user.fullName || user.username || "Operator"}
              </p>
              <p className="text-[10px] text-nexus-on-surface-variant font-mono-data">
                {(user.publicMetadata?.role as string) || "Ops Command"}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
