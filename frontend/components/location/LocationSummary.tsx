'use client';

import React from 'react';
import { MapPin, Globe, Compass, CheckCircle2 } from 'lucide-react';
import { ResolvedLocation } from '@/lib/api/endpoints/location';

interface LocationSummaryProps {
  location: ResolvedLocation;
  isWorkspacePrimary?: boolean;
  onSetPrimary?: () => void;
  isSettingPrimary?: boolean;
  className?: string;
}

export function LocationSummary({
  location,
  isWorkspacePrimary = false,
  onSetPrimary,
  isSettingPrimary = false,
  className = '',
}: LocationSummaryProps) {
  return (
    <div
      className={`p-4 bg-white dark:bg-zinc-900 border border-nexus-surface-container-high rounded-xl shadow-sm space-y-3 font-sans ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-nexus-primary/10 text-nexus-primary mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-nexus-on-surface">
              {location.display_name}
            </h4>
            <p className="text-xs text-nexus-on-surface-variant font-mono mt-0.5">
              LAT {location.latitude.toFixed(4)}° · LNG {location.longitude.toFixed(4)}°
            </p>
          </div>
        </div>

        {isWorkspacePrimary ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Base
          </span>
        ) : onSetPrimary ? (
          <button
            type="button"
            onClick={onSetPrimary}
            disabled={isSettingPrimary}
            className="px-3 py-1.5 text-xs font-medium text-nexus-primary bg-nexus-surface-container hover:bg-nexus-primary/15 rounded-lg transition-colors border border-nexus-surface-container-high"
          >
            {isSettingPrimary ? 'Setting...' : 'Set as Workspace Base'}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-nexus-surface-container text-xs font-sans">
        <div>
          <span className="text-nexus-on-surface-variant block text-[11px]">Region</span>
          <span className="font-medium text-nexus-on-surface truncate block">
            {location.region || location.country || 'Global'}
          </span>
        </div>
        <div>
          <span className="text-nexus-on-surface-variant block text-[11px]">Type</span>
          <span className="font-medium text-nexus-on-surface uppercase font-mono block">
            {location.type || 'City'}
          </span>
        </div>
        <div>
          <span className="text-nexus-on-surface-variant block text-[11px]">Provider</span>
          <span className="font-medium text-nexus-on-surface uppercase font-mono block">
            {location.provider || 'Geoapify'}
          </span>
        </div>
      </div>
    </div>
  );
}
