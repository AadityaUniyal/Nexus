"use client";

import * as React from "react";
import { realtimeClient, NexusPulseItem } from "@/lib/realtime-client";
import { Badge } from "./badge";
import { formatRelativeTime } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function NexusPulse({ className = "" }: { className?: string }) {
  const [pulseItems, setPulseItems] = React.useState<NexusPulseItem[]>([]);
  const [isLive, setIsLive] = React.useState(true);

  React.useEffect(() => {
    // Initial history
    const initial = realtimeClient.getPulseHistory();
    if (initial.length > 0) {
      setPulseItems(initial);
    } else {
      // Default initial story item
      setPulseItems([
        {
          id: "pulse-init-1",
          eventType: "SYSTEM_INITIALIZED",
          title: "Corridor Monitoring Active",
          message: "Continuous sensor feeds streaming across Midwest (I-80) and Southern (I-70) corridors.",
          severity: "INFO",
          timestamp: new Date().toISOString(),
          changeContext: {
            entityType: "NETWORK",
            entityId: "US_CENTRAL",
            currentState: "MONITORING_ACTIVE",
            cause: "Realtime Telemetry Engine Online",
          },
        },
      ]);
    }

    const unsubscribe = realtimeClient.subscribePulse((newItem) => {
      setPulseItems((prev) => [newItem, ...prev.slice(0, 19)]);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={`tactile-card p-5 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-nexus-outline-variant/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="text-sm font-bold text-nexus-on-surface tracking-tight flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-nexus-secondary" />
            <span>NEXUS Pulse</span>
          </h3>
          <span className="text-[10px] font-mono-data text-nexus-on-surface-variant uppercase tracking-wider">
            · What Changed?
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono-data text-nexus-secondary font-medium">
            LIVE NARRATIVE
          </span>
        </div>
      </div>

      {/* Live Narrative Event Feed */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {pulseItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="p-3.5 rounded-xl bg-nexus-surface-container-low/70 border border-nexus-outline-variant/30 hover:border-nexus-outline-variant transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.severity === "CRITICAL"
                        ? "critical"
                        : item.severity === "SUCCESS"
                        ? "healthy"
                        : item.severity === "WARNING"
                        ? "attention"
                        : "simulation"
                    }
                    size="sm"
                    className="text-[10px]"
                  >
                    {item.title}
                  </Badge>
                  <span className="text-[10px] font-mono-data text-nexus-on-surface-variant">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-nexus-on-surface leading-relaxed">{item.message}</p>

              {/* Change Context Object (Previous -> Current -> Delta) */}
              {item.changeContext && (
                <div className="pt-1.5 border-t border-nexus-outline-variant/20 flex flex-wrap items-center gap-3 text-[11px] font-mono-data">
                  {item.changeContext.previousState && (
                    <div className="flex items-center gap-1 text-nexus-on-surface-variant">
                      <span className="opacity-70">Before:</span>
                      <span className="line-through">{String(item.changeContext.previousState)}</span>
                    </div>
                  )}

                  {item.changeContext.currentState && (
                    <div className="flex items-center gap-1 text-nexus-on-surface font-semibold">
                      {item.changeContext.previousState && <ArrowRight className="h-3 w-3 text-nexus-on-surface-variant" />}
                      <span className="text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {String(item.changeContext.currentState)}
                      </span>
                    </div>
                  )}

                  {item.changeContext.delta && (
                    <div className="flex items-center gap-1 font-bold text-purple-700 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      <TrendingDown className="h-3 w-3" />
                      <span>{String(item.changeContext.delta)}</span>
                    </div>
                  )}

                  {item.changeContext.cause && (
                    <div className="text-[10px] text-nexus-on-surface-variant/80 italic ml-auto">
                      Cause: {item.changeContext.cause}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
