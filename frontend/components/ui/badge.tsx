import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "healthy" | "attention" | "critical" | "simulation" | "ai" | "neutral" | "outline";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "neutral", size = "md", children, ...props }: BadgeProps) {
  const variantStyles = {
    healthy: "bg-emerald-500/10 text-emerald-800 border-emerald-500/30 dark:text-emerald-300",
    attention: "bg-amber-500/10 text-amber-800 border-amber-500/30 dark:text-amber-300",
    critical: "bg-red-500/10 text-red-800 border-red-500/30 dark:text-red-300",
    simulation: "bg-purple-500/10 text-purple-800 border-purple-500/30 dark:text-purple-300",
    ai: "bg-indigo-500/10 text-indigo-800 border-indigo-500/30 dark:text-indigo-300",
    neutral: "bg-nexus-surface-container text-nexus-on-surface-variant border-nexus-outline-variant/60",
    outline: "bg-transparent text-nexus-on-surface border-nexus-outline-variant",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] font-medium tracking-wide",
    md: "px-2.5 py-1 text-xs font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono-data uppercase tracking-wider select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
