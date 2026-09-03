"use client";

import * as React from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Drawer } from "@/components/ui/drawer";
import { CommandMenu } from "@/components/ui/command-menu";
import { VoiceCompanionWidget } from "@/components/voice/VoiceCompanionWidget";
import { dataProvider } from "@/lib/data-provider";
import { realtimeClient } from "@/lib/realtime-client";
import { formatRelativeTime } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  // Fetch initial notifications from dataProvider
  React.useEffect(() => {
    async function loadNotifications() {
      try {
        const notifs = await dataProvider.getNotifications();
        setNotifications(notifs);
      } catch {
        // graceful fallback
      }
    }
    loadNotifications();

    // Subscribe to live SSE events from backend
    const unsubscribe = realtimeClient.subscribePulse((pulseItem) => {
      const newNotif = {
        id: pulseItem.id,
        type: pulseItem.severity,
        title: pulseItem.title,
        message: pulseItem.message,
        deepLink: pulseItem.changeContext?.entityType === "INCIDENT"
          ? `/incidents/${pulseItem.changeContext.entityId}`
          : pulseItem.changeContext?.entityType === "SIMULATION"
          ? `/simulations/${pulseItem.changeContext.entityId}`
          : "/overview",
        createdAt: pulseItem.timestamp,
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 24)]);
    });

    return () => unsubscribe();
  }, []);

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

  const handleNotificationClick = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    try {
      await dataProvider.markNotificationRead(notifId);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col">
      <Navbar
        unreadCount={unreadCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenCommandMenu={() => setCommandMenuOpen(true)}
        onOpenMobileMenu={() => setMobileNavOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar className="hidden md:flex shrink-0" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Command Search Menu (Cmd+K) */}
      <CommandMenu
        isOpen={commandMenuOpen}
        onClose={() => setCommandMenuOpen(false)}
      />

      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Navigation"
        subtitle="NEXUS Operations Command"
        side="left"
        width="sm"
      >
        <Sidebar
          onNavigate={() => setMobileNavOpen(false)}
          className="w-full border-r-0 min-h-0 p-0 bg-transparent"
        />
      </Drawer>

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
                className="text-xs font-mono-data text-nexus-secondary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-nexus-on-surface-variant text-xs">
                No active notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    n.read
                      ? "bg-nexus-surface-container-lowest/40 border-nexus-outline-variant/20 opacity-70"
                      : "bg-nexus-surface-container-lowest border-nexus-outline-variant shadow-tactile"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {n.type === "CRITICAL" && (
                        <AlertCircle className="h-4 w-4 text-nexus-error" />
                      )}
                      {n.type === "ATTENTION" && (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      )}
                      {n.type === "SIMULATION" && (
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      )}
                      {n.type === "SUCCESS" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                      {n.type === "INFO" && (
                        <CheckCircle2 className="h-4 w-4 text-nexus-secondary" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-nexus-on-surface">
                          {n.title}
                        </span>
                        <span className="text-[10px] font-mono-data text-nexus-on-surface-variant">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-nexus-on-surface-variant leading-relaxed">
                        {n.message}
                      </p>
                      {n.deepLink && (
                        <Link
                          href={n.deepLink}
                          onClick={() => setNotificationsOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono-data text-nexus-secondary hover:underline pt-1"
                        >
                          <span>Investigate anomaly</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
