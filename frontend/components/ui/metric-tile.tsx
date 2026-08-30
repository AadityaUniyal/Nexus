import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusLed } from "./status-led";
import { LucideIcon } from "lucide-react";

export interface MetricTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  status?: "HEALTHY" | "ATTENTION" | "CRITICAL" | "SIMULATION" | "OPERATIONAL" | string;
  icon?: LucideIcon;
  variant?: "default" | "simulation" | "critical";
  className?: string;
}

export function MetricTile({
  title,
  value,
  subtitle,
  change,
  trend,
  status,
  icon: Icon,
  variant = "default",
  className,
}: MetricTileProps) {
  const variantStyles = {
    default: "tactile-card",
    simulation: "tactile-card simulation-layer",
    critical: "tactile-card border-red-500/30 bg-red-500/[0.02]",
  };

  return (
    <div className={cn(variantStyles[variant], "p-4 relative overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {status && <StatusLed status={status} size="sm" />}
          <span className="text-[11px] font-semibold text-nexus-on-surface-variant font-mono-data uppercase tracking-wider">
            {title}
          </span>
        </div>
        {Icon && (
          <div className="p-1.5 rounded-md bg-nexus-surface-container/80 text-nexus-on-surface-variant">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono-data text-nexus-on-surface tracking-tight">
          {value}
        </span>
        {change && (
          <span
            className={cn(
              "text-xs font-medium font-mono-data",
              trend === "up" && "text-emerald-700 dark:text-emerald-400",
              trend === "down" && "text-red-700 dark:text-red-400",
              trend === "neutral" && "text-nexus-on-surface-variant"
            )}
          >
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-nexus-on-surface-variant/80 truncate">{subtitle}</p>
      )}
    </div>
  );
}
