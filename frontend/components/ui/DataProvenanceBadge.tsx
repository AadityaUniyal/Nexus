"use client";

import * as React from "react";
import { formatRelativeTime, cn } from "@/lib/utils";
import { Clock, RefreshCw, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

export type ProvenanceStatus =
  | "CONFIRMED"
  | "ESTIMATED"
  | "PREDICTED"
  | "REPORTED"
  | "STALE"
  | "UNAVAILABLE"
  | "UNKNOWN";

interface DataProvenanceBadgeProps {
  status: ProvenanceStatus;
  updatedAt?: string | Date;
  source?: string;
  className?: string;
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<
  ProvenanceStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/40",
    icon: CheckCircle2,
  },
  ESTIMATED: {
    label: "Estimated",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-800/40",
    icon: Clock,
  },
  PREDICTED: {
    label: "Predicted",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800/40",
    icon: Clock,
  },
  REPORTED: {
    label: "Reported",
    bg: "bg-stone-50 dark:bg-stone-900/60",
    text: "text-stone-700 dark:text-stone-300",
    border: "border-stone-200 dark:border-stone-700",
    icon: Clock,
  },
  STALE: {
    label: "Stale Data",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/40",
    icon: AlertTriangle,
  },
  UNAVAILABLE: {
    label: "Unavailable",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800/40",
    icon: AlertTriangle,
  },
  UNKNOWN: {
    label: "Unknown",
    bg: "bg-stone-100 dark:bg-stone-800",
    text: "text-stone-500 dark:text-stone-400",
    border: "border-stone-200 dark:border-stone-700",
    icon: HelpCircle,
  },
};

/**
 * DataProvenanceBadge — Blueprint §16.1 & §16.2
 * Displays clear provenance and freshness timestamps:
 * "Confirmed", "Estimated", "Predicted", "Reported", "Stale", "Unavailable", "Unknown".
 */
export function DataProvenanceBadge({
  status,
  updatedAt,
  source,
  className,
  showIcon = true,
}: DataProvenanceBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNKNOWN;
  const Icon = config.icon;

  const timeString = updatedAt ? formatRelativeTime(updatedAt) : null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono border transition-colors",
        config.bg,
        config.text,
        config.border,
        className
      )}
      title={source ? `Source: ${source}` : undefined}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span className="font-semibold">{config.label}</span>
      {timeString && (
        <>
          <span className="opacity-40">·</span>
          <span className="opacity-80 font-normal">{timeString}</span>
        </>
      )}
    </div>
  );
}
