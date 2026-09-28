import React from "react";

export default function AppLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-nexus-surface-variant/40 rounded-lg"></div>
          <div className="h-4 w-72 bg-nexus-surface-variant/20 rounded"></div>
        </div>
        <div className="h-9 w-32 bg-nexus-surface-variant/30 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-28 bg-nexus-surface-variant/20 rounded-2xl border border-nexus-outline-variant/20"></div>
        <div className="h-28 bg-nexus-surface-variant/20 rounded-2xl border border-nexus-outline-variant/20"></div>
        <div className="h-28 bg-nexus-surface-variant/20 rounded-2xl border border-nexus-outline-variant/20"></div>
        <div className="h-28 bg-nexus-surface-variant/20 rounded-2xl border border-nexus-outline-variant/20"></div>
      </div>
      <div className="h-96 bg-nexus-surface-variant/15 rounded-2xl border border-nexus-outline-variant/20"></div>
    </div>
  );
}
