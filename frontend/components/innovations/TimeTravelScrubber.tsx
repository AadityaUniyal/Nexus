"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  History,
  FastForward,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Clock,
  Radio,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tactileAudio } from "@/lib/sound-effects";

export interface TimeTravelScrubberProps {
  onTimeChange?: (offsetHours: number) => void;
  className?: string;
}

export function TimeTravelScrubber({
  onTimeChange,
  className = "",
}: TimeTravelScrubberProps) {
  const [offsetHours, setOffsetHours] = React.useState<number>(0);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState<1 | 2 | 5>(1);

  React.useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setOffsetHours((prev) => {
          if (prev >= 24) {
            setIsPlaying(false);
            return 24;
          }
          const next = Math.min(24, Math.round((prev + 0.5 * playbackSpeed) * 10) / 10);
          onTimeChange?.(next);
          return next;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, onTimeChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setOffsetHours(val);
    tactileAudio.playClick();
    onTimeChange?.(val);
  };

  const handleResetNow = () => {
    setIsPlaying(false);
    setOffsetHours(0);
    tactileAudio.playSuccess();
    onTimeChange?.(0);
  };

  const togglePlay = () => {
    tactileAudio.playClick();
    setIsPlaying(!isPlaying);
  };

  const getModeLabel = () => {
    if (offsetHours < 0) {
      return {
        label: `Historical Replay (${Math.abs(offsetHours)}h Ago)`,
        color: "text-amber-600 dark:text-amber-400",
        badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
        icon: History,
      };
    }
    if (offsetHours > 0) {
      return {
        label: `Predictive Physics Horizon (+${offsetHours}h Ahead)`,
        color: "text-purple-600 dark:text-purple-400",
        badgeBg: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
        icon: Sparkles,
      };
    }
    return {
      label: "Real-Time Telemetry Stream (Live)",
      color: "text-emerald-600 dark:text-emerald-400",
      badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
      icon: Radio,
    };
  };

  const mode = getModeLabel();
  const ModeIcon = mode.icon;

  return (
    <div
      className={`p-4 rounded-2xl bg-nexus-surface-container/80 backdrop-blur-xl border border-nexus-outline/30 shadow-tactile transition-all duration-300 ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-nexus-surface-container-high border border-nexus-outline/40 shadow-xs">
            <Clock className="w-4 h-4 text-nexus-secondary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-nexus-on-surface uppercase">
                4D Spatial Timeline Engine
              </span>
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${mode.badgeBg}`}
              >
                <ModeIcon className="w-3 h-3 animate-pulse" />
                {mode.label}
              </span>
            </div>
            <p className="text-[11px] text-nexus-on-surface-variant mt-0.5">
              Scrub left to inspect past chokepoints; scrub right to project AI traffic & storm physics.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const speeds: Array<1 | 2 | 5> = [1, 2, 5];
              const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
              setPlaybackSpeed(speeds[nextIdx]);
              tactileAudio.playClick();
            }}
            className="h-8 px-2 text-[11px] font-mono font-bold text-nexus-on-surface-variant hover:text-nexus-on-surface"
            title="Playback Speed"
          >
            <Zap className="w-3 h-3 mr-1 text-nexus-secondary" />
            {playbackSpeed}x
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={togglePlay}
            className="h-8 px-3 text-xs font-mono"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1 text-nexus-secondary" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1 text-nexus-secondary" /> Simulate
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetNow}
            disabled={offsetHours === 0}
            className="h-8 px-3 text-xs font-mono text-nexus-on-surface"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Jump to Now
          </Button>
        </div>
      </div>

      {/* Scrubber Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={-24}
            max={24}
            step={0.5}
            value={offsetHours}
            onChange={handleSliderChange}
            className="w-full h-2 bg-nexus-surface-container-highest rounded-lg appearance-none cursor-pointer accent-nexus-secondary focus:outline-none transition-all"
          />
        </div>

        {/* Timeline Tick Markers */}
        <div className="flex justify-between items-center text-[10px] font-mono text-nexus-on-surface-variant px-1">
          <span className="hover:text-amber-500 cursor-pointer" onClick={() => { setOffsetHours(-24); onTimeChange?.(-24); }}>-24h (Past Replay)</span>
          <span className="hover:text-amber-500 cursor-pointer" onClick={() => { setOffsetHours(-12); onTimeChange?.(-12); }}>-12h</span>
          <span className="hover:text-amber-500 cursor-pointer" onClick={() => { setOffsetHours(-6); onTimeChange?.(-6); }}>-6h</span>
          <span
            className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded cursor-pointer"
            onClick={handleResetNow}
          >
            ● NOW (0h)
          </span>
          <span className="hover:text-purple-500 cursor-pointer" onClick={() => { setOffsetHours(6); onTimeChange?.(6); }}>+6h</span>
          <span className="hover:text-purple-500 cursor-pointer" onClick={() => { setOffsetHours(12); onTimeChange?.(12); }}>+12h</span>
          <span className="hover:text-purple-500 cursor-pointer" onClick={() => { setOffsetHours(24); onTimeChange?.(24); }}>+24h (Forecast)</span>
        </div>
      </div>
    </div>
  );
}
