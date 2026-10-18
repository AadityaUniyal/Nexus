"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoModeBannerProps {
  onExitDemo?: () => void;
  className?: string;
}

/**
 * DemoModeBanner — Blueprint §16.4 ("Demo data")
 * Explicitly alerts the operator that the current workspace view contains
 * illustrative sandbox fixtures and is not connected to live vehicle dispatch.
 */
export function DemoModeBanner({ onExitDemo, className = "" }: DemoModeBannerProps) {
  return (
    <div
      role="alert"
      className={`px-4 py-2.5 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="p-1 rounded bg-amber-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider shrink-0">
          Demo Sandbox
        </span>
        <p className="leading-snug">
          You are exploring with <strong>illustrative sample records</strong>. Operational mutations are isolated and will not trigger real fleet dispatch.
        </p>
      </div>

      {onExitDemo && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExitDemo}
          className="h-7 px-2.5 text-[11px] font-mono border-amber-500/40 text-amber-900 dark:text-amber-100 hover:bg-amber-500/10 shrink-0"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Switch to Live Data
        </Button>
      )}
    </div>
  );
}
