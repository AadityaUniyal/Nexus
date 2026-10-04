"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  GitBranch,
  Menu,
  MapPin,
  Globe2,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { StatusLed } from "@/components/ui/status-led";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { formatDateTime } from "@/lib/utils";
import { TelemetryStreamController } from "./TelemetryStreamController";
import { useAuth } from "@/components/providers/AuthProvider";
import { User, LogOut, Shield, Settings as SettingsIcon } from "lucide-react";

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
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState<string>("");
  const [companyName, setCompanyName] = React.useState("Continental Fleet Ops");
  const [hubName, setHubName] = React.useState("Dehradun Hub");

  React.useEffect(() => {
    setCurrentTime(formatDateTime(new Date()));
    const timer = setInterval(() => {
      setCurrentTime(formatDateTime(new Date()));
    }, 1000);

    if (typeof window !== "undefined") {
      try {
        const savedCompany = localStorage.getItem("nexus_company_name");
        if (savedCompany) setCompanyName(savedCompany);

        const savedLoc = localStorage.getItem("nexus_workspace_location");
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed?.name) setHubName(`${parsed.name} Hub`);
        }
      } catch {
        // fallback
      }
    }

    return () => clearInterval(timer);
  }, [user]);

  // Role Badge Color & Label
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return { label: "Solo Admin", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
      case "SUPERVISOR_L1":
      case "OPERATIONS_MANAGER":
        return { label: "Regional L1", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
      case "SUPERVISOR_L2":
      case "OPERATOR":
        return { label: "Dispatch L2", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
      case "SUPERVISOR_L3":
      case "FIELD_OPERATOR":
        return { label: "Safety L3", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
      default:
        return { label: "Operator", color: "bg-stone-500/20 text-stone-300 border-stone-500/30" };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

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

        {/* Dynamic Workspace & Hub Pill */}
        <div className="hidden md:flex items-center gap-2 pl-4 ml-1 border-l border-nexus-outline-variant/70 text-sm text-nexus-on-surface">
          <StatusLed status="HEALTHY" size="sm" />
          <span className="font-semibold text-xs tracking-tight">{companyName}</span>
          <span className="text-stone-600">·</span>
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <MapPin className="w-2.5 h-2.5" />
            <span>{hubName}</span>
          </div>
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

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-nexus-surface-container/60 transition-colors"
          >
            <div className="h-8 w-8 rounded-lg bg-nexus-primary/20 text-nexus-primary border border-nexus-primary/30 flex items-center justify-center font-bold text-xs shadow-tactile">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AR"}
            </div>
            {user && (
              <div className="hidden md:block text-left text-xs">
                <p className="font-semibold text-nexus-on-surface leading-tight">
                  {user.name || "Alex Rivera"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-nexus-outline-variant/30 mb-1">
                <p className="text-xs font-bold text-nexus-on-surface">{user?.name || "Alex Rivera"}</p>
                <p className="text-[11px] text-nexus-on-surface-variant font-mono-data truncate">{user?.email || "alex.rivera@continental-logistics.com"}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-stone-400">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{hubName}</span>
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-nexus-on-surface hover:bg-nexus-surface-container transition-colors"
              >
                <User className="h-3.5 w-3.5 text-nexus-secondary" />
                <span>Operator Profile</span>
              </Link>

              {/* Role Delegation Quick Switcher */}
              <div className="border-t border-nexus-outline-variant/30 my-1 pt-1">
                <p className="px-3 py-1 text-[10px] font-mono-data uppercase font-bold text-nexus-on-surface-variant">
                  Switch Active Role
                </p>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    const adminUser = {
                      id: "usr-admin-alex",
                      name: "Alex Rivera",
                      email: "alex.rivera@continental-logistics.com",
                      role: "ADMINISTRATOR",
                      workspace_id: "ws-continental-fleet-01",
                    };
                    localStorage.setItem("nexus_demo_user", JSON.stringify(adminUser));
                    window.location.href = "/admin/company";
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 transition-colors font-medium text-left"
                >
                  <span>👑 Solo Company Admin</span>
                  <span className="text-[10px] font-mono">COO</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    const l1User = {
                      id: "usr-sarah-104",
                      name: "Sarah Chen",
                      email: "sarah.chen@continental-logistics.com",
                      role: "SUPERVISOR_L1",
                      workspace_id: "ws-continental-fleet-01",
                    };
                    localStorage.setItem("nexus_demo_user", JSON.stringify(l1User));
                    window.location.href = "/overview";
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 transition-colors font-medium text-left"
                >
                  <span>🌐 Regional Director (L1)</span>
                  <span className="text-[10px] font-mono">Hubs</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    const l2User = {
                      id: "usr-david-04",
                      name: "David Kim",
                      email: "david.kim@continental-logistics.com",
                      role: "SUPERVISOR_L2",
                      workspace_id: "ws-continental-fleet-01",
                    };
                    localStorage.setItem("nexus_demo_user", JSON.stringify(l2User));
                    window.location.href = "/operations";
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors font-medium text-left"
                >
                  <span>⚡ Dispatch Supervisor (L2)</span>
                  <span className="text-[10px] font-mono">Fleet</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    const l3User = {
                      id: "usr-elena-92",
                      name: "Elena Rostova",
                      email: "elena.rostova@continental-logistics.com",
                      role: "SUPERVISOR_L3",
                      workspace_id: "ws-continental-fleet-01",
                    };
                    localStorage.setItem("nexus_demo_user", JSON.stringify(l3User));
                    window.location.href = "/incidents";
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors font-medium text-left"
                >
                  <span>🛡️ Safety Specialist (L3)</span>
                  <span className="text-[10px] font-mono">Safety</span>
                </button>
              </div>

              <div className="border-t border-nexus-outline-variant/30 my-1" />

              <Link
                href="/admin/company"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-nexus-on-surface hover:bg-nexus-surface-container transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-purple-600" />
                <span>Company Admin Command</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-nexus-on-surface hover:bg-nexus-surface-container transition-colors"
              >
                <SettingsIcon className="h-3.5 w-3.5 text-nexus-on-surface-variant" />
                <span>Workspace Settings</span>
              </Link>

              <div className="border-t border-nexus-outline-variant/30 my-1" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
