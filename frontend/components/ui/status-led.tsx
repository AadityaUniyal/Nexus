import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatusLedProps {
  status: "HEALTHY" | "OPERATIONAL" | "ATTENTION" | "CRITICAL" | "SIMULATION" | "OFFLINE" | string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

export function StatusLed({ status, size = "md", pulse = true, className }: StatusLedProps) {
  const norm = status.toUpperCase();

  const colorStyles = {
    HEALTHY: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
    OPERATIONAL: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
    ATTENTION: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
    CRITICAL: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]",
    SIMULATION: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]",
    OFFLINE: "bg-zinc-400 shadow-none",
  };

  const selectedColor =
    colorStyles[norm as keyof typeof colorStyles] ?? "bg-zinc-400";

  const sizeStyles = {
    sm: "h-1.5 w-1.5",
    md: "h-2.5 w-2.5",
    lg: "h-3.5 w-3.5",
  };

  return (
    <span className="relative inline-flex items-center justify-center">
      {pulse && norm !== "OFFLINE" && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
            selectedColor
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex rounded-full border border-black/10",
          sizeStyles[size],
          selectedColor,
          className
        )}
      />
    </span>
  );
}
