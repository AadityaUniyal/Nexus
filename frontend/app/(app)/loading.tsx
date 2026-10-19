import React from "react";
import { Skeleton, SkeletonMetricTile, SkeletonTable } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans animate-in fade-in duration-300">
      {/* Current page content is loading. */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-600 dark:text-stone-300">Loading workspace</span>
        </div>
      </div>

      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-8 w-72 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-64 rounded-2xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Apple 4-Metric Grid Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonMetricTile />
        <SkeletonMetricTile />
        <SkeletonMetricTile />
        <SkeletonMetricTile />
      </div>

      {/* Main Dual Work Area Skeleton (Map + Activity Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-[460px] rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white/50 dark:bg-stone-900/40 backdrop-blur-xl p-4 flex flex-col justify-between skeleton-shimmer">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-44 rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-20 rounded-lg" />
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="h-[460px] rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white/50 dark:bg-stone-900/40 backdrop-blur-xl p-6 space-y-4 skeleton-shimmer">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-800/60">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table Skeleton */}
      <SkeletonTable rows={4} />
    </div>
  );
}
