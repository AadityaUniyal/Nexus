'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { tactileAudio } from '@/lib/sound-effects';
import { PulseLED } from '@/components/ui/motion-animations';

export function TelemetryStreamController({ className = '' }: { className?: string }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [streamRateHz, setStreamRateHz] = useState<1 | 5>(1);
  const [soundMuted, setSoundMuted] = useState(false);
  const [eventCount, setEventCount] = useState(128);

  useEffect(() => {
    tactileAudio.setSoundEnabled(!soundMuted);
  }, [soundMuted]);

  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = streamRateHz === 1 ? 1000 : 200;
    const timer = setInterval(() => {
      setEventCount((prev) => prev + 1);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, streamRateHz]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    tactileAudio.playClick();
  };

  const toggleRate = () => {
    setStreamRateHz((prev) => (prev === 1 ? 5 : 1));
    tactileAudio.playTelemetryPing();
  };

  const toggleSound = () => {
    setSoundMuted((prev) => !prev);
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-nexus-surface-container/80 dark:bg-stone-900/80 border border-nexus-surface-container-high rounded-full shadow-sm text-xs font-mono backdrop-blur-md ${className}`}>
      <div className="flex items-center gap-1.5 pr-2 border-r border-nexus-surface-container">
        <PulseLED color={isPlaying ? 'emerald' : 'amber'} size="sm" />
        <span className="text-nexus-on-surface font-bold uppercase tracking-wider text-[10px]">
          {isPlaying ? `Telemetry ${streamRateHz}Hz` : 'Stream Paused'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={togglePlay}
          title={isPlaying ? 'Pause live stream' : 'Resume live stream'}
          className="p-1 rounded-md text-nexus-on-surface hover:bg-nexus-surface transition-colors"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
        </button>

        <button
          type="button"
          onClick={toggleRate}
          title={`Switch rate (Current: ${streamRateHz}Hz)`}
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${streamRateHz === 5 ? 'bg-purple-600 text-white' : 'text-nexus-on-surface hover:bg-nexus-surface'}`}
        >
          {streamRateHz === 5 ? '5x' : '1x'}
        </button>

        <button
          type="button"
          onClick={toggleSound}
          title={soundMuted ? 'Unmute tactical audio' : 'Mute tactical audio'}
          className="p-1 rounded-md text-nexus-on-surface-variant hover:text-nexus-on-surface transition-colors"
        >
          {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-nexus-critical" /> : <Volume2 className="w-3.5 h-3.5 text-nexus-primary" />}
        </button>
      </div>

      <span className="text-[10px] text-nexus-on-surface-variant hidden sm:inline pl-1">
        Events: <strong className="text-nexus-on-surface">{eventCount}</strong>
      </span>
    </div>
  );
}
