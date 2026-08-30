'use client';

import React from 'react';
import { Plus, Minus, Compass, Navigation, Maximize2, Layers } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetNorth: () => void;
  onLocateMe?: () => void;
  onToggleFullscreen?: () => void;
  isSimulationMode?: boolean;
  onToggleSimulationMode?: () => void;
  className?: string;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onLocateMe,
  onToggleFullscreen,
  isSimulationMode = false,
  onToggleSimulationMode,
  className = '',
}: MapControlsProps) {
  return (
    <div className={`flex flex-col gap-1.5 z-10 ${className}`}>
      <div className="flex flex-col bg-white dark:bg-zinc-900 border border-nexus-surface-container-high rounded-lg shadow-md overflow-hidden">
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In"
          className="p-2 text-nexus-on-surface hover:bg-nexus-surface-container transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="h-px bg-nexus-surface-container" />
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-2 text-nexus-on-surface hover:bg-nexus-surface-container transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onResetNorth}
        title="Reset North"
        className="p-2 bg-white dark:bg-zinc-900 border border-nexus-surface-container-high rounded-lg shadow-md text-nexus-on-surface hover:bg-nexus-surface-container transition-colors"
      >
        <Compass className="w-4 h-4" />
      </button>

      {onLocateMe && (
        <button
          type="button"
          onClick={onLocateMe}
          title="Center on My Location"
          className="p-2 bg-white dark:bg-zinc-900 border border-nexus-surface-container-high rounded-lg shadow-md text-nexus-primary hover:bg-nexus-primary/10 transition-colors"
        >
          <Navigation className="w-4 h-4" />
        </button>
      )}

      {onToggleSimulationMode && (
        <button
          type="button"
          onClick={onToggleSimulationMode}
          title={isSimulationMode ? 'Live Operations Mode' : 'Simulation Scenario Layer'}
          className={`p-2 border rounded-lg shadow-md transition-colors ${
            isSimulationMode
              ? 'bg-purple-600 text-white border-purple-700 shadow-purple-500/20'
              : 'bg-white dark:bg-zinc-900 border-nexus-surface-container-high text-nexus-on-surface hover:bg-nexus-surface-container'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>
      )}

      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2 bg-white dark:bg-zinc-900 border border-nexus-surface-container-high rounded-lg shadow-md text-nexus-on-surface hover:bg-nexus-surface-container transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
