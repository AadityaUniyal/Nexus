"use client";

import * as React from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Drawer } from "@/components/ui/drawer";
import { CommandMenu } from "@/components/ui/command-menu";
import { VoiceCompanionWidget } from "@/components/voice/VoiceCompanionWidget";
import { formatRelativeTime } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState([
    {
      id: "notif-1",
      type: "CRITICAL",
      title: "Severe Blizzard Alert on I-80 Pass",
      message: "Route RT-CHI-DEN-01 blocked. 14 orders affected including AeroTech critical shipment.",
      deepLink: "/incidents/inc-8041",
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "notif-2",
      type: "ATTENTION",
      title: "Thermal Unit Drift on NX-TRK-109",
      message: "Auxiliary condenser temperature deviation (+3.2°C) detected.",
      deepLink: "/incidents/inc-8042",
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "notif-3",
      type: "SIMULATION",
      title: "Simulation Ready: I-70 Detour Analysis",
      message: "Scenario SIM-SCENARIO-901 shows 135 mins net time recovery.",
      deepLink: "/simulations/sim-901",
      createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      read: true,
    },
  ]);

  // Global Cmd+K keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col">
      <Navbar
        unreadCount={unreadCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenCommandMenu={() => setCommandMenuOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar className="hidden md:flex" />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Command Search Menu (Cmd+K) */}
      <CommandMenu
        isOpen={commandMenuOpen}
        onClose={() => setCommandMenuOpen(false)}
      />

      {/* Voice Copilot Companion Widget */}
      <VoiceCompanionWidget />

      {/* Slide-Over Notification Center Drawer */}
      <Drawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notification Center"
        subtitle={`${unreadCount} unread operational alerts`}
        width="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-nexus-outline-variant/30">
            <span className="text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              Recent Event Stream
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-nexus-secondary hover:underline font-mono-data"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.map((notif) => {
              const icons = {
                CRITICAL: <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />,
                ATTENTION: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />,
                SIMULATION: <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />,
                SUCCESS: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />,
                INFO: <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />,
              };

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    notif.read
                      ? "bg-nexus-surface-lowest/70 border-nexus-outline-variant/30 opacity-80"
                      : "bg-nexus-surface-lowest border-nexus-outline-variant shadow-tactile"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {icons[notif.type as keyof typeof icons]}
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-nexus-on-surface">{notif.title}</h4>
                        <span className="text-[10px] font-mono-data text-nexus-on-surface-variant">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-nexus-on-surface-variant mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.deepLink && (
                        <div className="mt-2.5">
                          <Link
                            href={notif.deepLink}
                            onClick={() => setNotificationsOpen(false)}
                            className="inline-flex items-center text-xs font-semibold text-nexus-secondary hover:text-emerald-700 font-mono-data gap-1"
                          >
                            <span>Inspect Entity</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
