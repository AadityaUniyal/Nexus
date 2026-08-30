"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { INITIAL_NOTIFICATIONS } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { FadeIn, StaggerContainer, StaggerItem, TactileCard } from "@/components/ui/motion-animations";

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = React.useState(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({
      title: "Notifications Cleared",
      message: "All operational alerts marked as read.",
      type: "success",
    });
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  return (
    <AppShell>
      <FadeIn className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span>Operational Signals</span>
              <span>·</span>
              <span>Audit & Telemetry Alerts</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Notification Center
            </h1>
          </div>

          <Button variant="secondary" size="sm" onClick={markAllRead} className="font-mono-data text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Mark All as Read
          </Button>
        </div>

        <StaggerContainer className="space-y-3">
          {notifications.map((n) => {
            const icons = {
              CRITICAL: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
              ATTENTION: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
              SIMULATION: <Sparkles className="h-5 w-5 text-purple-600 shrink-0" />,
              SUCCESS: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
              INFO: <Bell className="h-5 w-5 text-blue-600 shrink-0" />,
            };

            return (
              <StaggerItem key={n.id}>
                <TactileCard onClick={() => toggleRead(n.id)}>
                  <Card
                    className={`p-5 transition-all cursor-pointer ${
                      n.read ? "opacity-70 bg-nexus-surface-container/30" : "border-stone-300 dark:border-stone-700 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {icons[n.type as keyof typeof icons] || <Bell className="h-5 w-5 text-stone-500" />}
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-nexus-on-surface">{n.title}</h3>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-nexus-on-surface-variant font-mono-data">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-nexus-on-surface-variant mt-1.5 leading-relaxed">{n.message}</p>

                        {n.deepLink && (
                          <div className="mt-3">
                            <Link
                              href={n.deepLink}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center text-xs font-semibold text-nexus-secondary hover:underline font-mono-data gap-1"
                            >
                              <span>Inspect Related Entity</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </TactileCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </FadeIn>
    </AppShell>
  );
}

