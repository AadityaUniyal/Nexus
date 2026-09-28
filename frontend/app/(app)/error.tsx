"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App sub-route caught an unhandled exception:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-2xl bg-nexus-surface border border-nexus-outline-variant/30 text-center space-y-5 shadow-tactile">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-nexus-on-surface">Operational View Error</h2>
          <p className="text-xs font-mono-data text-nexus-on-surface-variant leading-relaxed">
            {error?.message || "An unexpected error occurred while rendering the operational module."}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            className="font-mono-data text-xs"
          >
            Reload Page
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => reset()}
            className="font-mono-data text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
