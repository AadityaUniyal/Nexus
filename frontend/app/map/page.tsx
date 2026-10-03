"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const Map = dynamic(() => import('@/app/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-2xl bg-nexus-surface-container/40 flex items-center justify-center text-xs font-mono-data text-nexus-on-surface-variant animate-pulse border border-nexus-outline-variant/30">
      Loading Fleet Spatial Telemetry...
    </div>
  ),
});

export default function MapPage() {
  // In a real app, workspaceId would be derived from auth or context.
  const workspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID ?? "default-workspace";
  const useAzure = false; // toggle based on env or user selection

  return (
    <div className="min-h-screen bg-nexus-surface p-6">
      <h1 className="text-2xl font-bold mb-4 text-nexus-on-surface">
        Fleet Locations Map
      </h1>
      <Map workspaceId={workspaceId} useAzure={useAzure} />
    </div>
  );
}
