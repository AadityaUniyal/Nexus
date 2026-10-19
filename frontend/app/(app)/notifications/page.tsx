"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppleCard, AppleCardHeader, AppleCardContent } from "@/components/ui/AppleCard";
import { StaggerList, StaggerItem, StaggerContainer } from "@/components/ui/StaggerList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/http";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  RefreshCw,
  BellOff,
  Truck,
  Building2,
  GitBranch,
} from "lucide-react";
import { formatRelativeTime, cn } from "@/lib/utils";

type NotifType = "INCIDENT" | "SIMULATION" | "SYSTEM" | "FLEET" | "AI";
type NotifPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface Notification {
  id: string;
  type: NotifType;
  priority: NotifPriority;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  entityId?: string;
  entityType?: string;
}

const TYPE_ICON: Record<NotifType, React.ElementType> = {
  INCIDENT: AlertTriangle,
  SIMULATION: GitBranch,
  SYSTEM: Info,
  FLEET: Truck,
  AI: Sparkles,
};

const PRIORITY_COLOR: Record<NotifPriority, string> = {
  LOW: "text-stone-500 bg-stone-100 dark:bg-stone-800 dark:text-stone-400",
  MEDIUM: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400",
  HIGH: "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"ALL" | "UNREAD">("ALL");
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiFetch("/api/v1/notifications");
      if (!res.ok) throw new Error("Notification service is unavailable.");
      const list = await res.json();
      if (!Array.isArray(list)) throw new Error("Notification service returned an invalid response.");
      setNotifications(list.map((n: any) => ({
        id: n.id, type: (n.type || "SYSTEM") as NotifType,
        priority: (n.priority || (n.type === "CRITICAL" ? "CRITICAL" : "LOW")) as NotifPriority,
        title: n.title, message: n.message, isRead: n.read,
        createdAt: n.created_at ?? n.createdAt ?? "", entityId: n.entity_id ?? n.entityId,
        entityType: n.entity_type ?? n.entityType,
      })));
    } catch (error) {
      setNotifications([]);
      setLoadError(error instanceof Error ? error.message : "Notifications could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications().finally(() => setIsLoading(false));
  }, [fetchNotifications]);

  const markAllRead = async () => {
    const response = await apiFetch("/api/v1/notifications/read-all", { method: "POST" });
    if (!response.ok) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    const response = await apiFetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
    if (!response.ok) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const displayed = filter === "UNREAD" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          eyebrow="Operations Center"
          title="Notifications"
          description="Notifications saved to your workspace. Delivery timing depends on the notification source."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchNotifications}
                isLoading={isLoading}
                className="font-mono text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={markAllRead}
                  className="font-mono text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Mark all read
                </Button>
              )}
            </div>
          }
        />

        {loadError && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-4 text-sm">{loadError}</div>}

        {/* Filter pills */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 40 }}
          className="flex items-center gap-2"
        >
          {(["ALL", "UNREAD"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "relative px-4 py-1.5 text-xs font-medium rounded-full transition-colors",
                filter === f
                  ? "text-stone-900 dark:text-stone-50"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              )}
            >
              {filter === f && (
                <motion.div
                  layoutId="notif-filter-pill"
                  className="absolute inset-0 rounded-full bg-white dark:bg-stone-800 shadow-sm border border-stone-200/60 dark:border-stone-700/60"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">
                {f === "ALL" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Notification list */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-stone-100 dark:bg-stone-800/50 animate-pulse"
                />
              ))}
            </motion.div>
          ) : displayed.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="flex flex-col items-center justify-center py-24 text-center gap-4"
            >
              <div className="h-16 w-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <BellOff className="h-8 w-8 text-stone-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                  {filter === "UNREAD" ? "All caught up" : "No notifications"}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {filter === "UNREAD"
                    ? "You've read all your notifications."
                    : "Notifications will appear here when an enabled workflow creates one."}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`list-${filter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <AnimatePresence>
                {displayed.map((notif, i) => {
                  const Icon = TYPE_ICON[notif.type] || Bell;
                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40, scale: 0.96 }}
                      transition={{
                        delay: i * 0.04,
                        type: "spring",
                        stiffness: 450,
                        damping: 38,
                        layout: { type: "spring", stiffness: 400, damping: 35 },
                      }}
                    >
                      <div
                        onClick={() => !notif.isRead && markRead(notif.id)}
                        className={cn(
                          "group relative flex items-start gap-4 px-4 py-4 rounded-2xl border transition-colors cursor-default",
                          notif.isRead
                            ? "bg-white dark:bg-stone-900 border-stone-200/50 dark:border-stone-800/50"
                            : "bg-stone-50 dark:bg-stone-900/80 border-stone-200/70 dark:border-stone-700/70 shadow-[0_1px_4px_rgba(0,0,0,0.04)]",
                          !notif.isRead && "cursor-pointer"
                        )}
                      >
                        {/* Unread indicator */}
                        {!notif.isRead && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-500"
                          />
                        )}

                        {/* Icon */}
                        <div
                          className={cn(
                            "mt-0.5 h-9 w-9 shrink-0 rounded-xl flex items-center justify-center",
                            PRIORITY_COLOR[notif.priority]
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p
                                className={cn(
                                  "text-sm leading-snug tracking-[-0.008em]",
                                  notif.isRead
                                    ? "font-medium text-stone-700 dark:text-stone-300"
                                    : "font-semibold text-stone-900 dark:text-stone-50"
                                )}
                              >
                                {notif.title}
                              </p>
                              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-stone-400">
                              {notif.createdAt ? formatRelativeTime(notif.createdAt) : "Time unavailable"}
                            </span>
                            <span className="text-[10px] text-stone-300 dark:text-stone-600">·</span>
                            <Badge
                              variant={
                                notif.priority === "CRITICAL"
                                  ? "critical"
                                  : notif.priority === "HIGH"
                                  ? "attention"
                                  : "neutral"
                              }
                              size="sm"
                            >
                              {notif.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
