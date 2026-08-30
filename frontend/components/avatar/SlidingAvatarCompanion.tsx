'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar3D, AvatarMood } from './Avatar3D';
import {
  Sparkles,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Sliders,
  X,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tactileAudio } from '@/lib/sound-effects';

export function SlidingAvatarCompanion() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isMuted, setIsMuted] = React.useState<boolean>(false);
  const [customMood, setCustomMood] = React.useState<AvatarMood | null>(null);
  const [isDismissed, setIsDismissed] = React.useState<boolean>(false);

  // Derive dynamic mood & tactical dialogue from active route
  const getRouteContext = (path: string) => {
    if (path === '/' || path === '/welcome') {
      return {
        mood: 'WELCOME' as AvatarMood,
        title: 'NEXUS Guide Agent',
        status: 'Operational Living Twin Active',
        tip: 'Welcome to NEXUS! Explore the 3D spatial network and deterministic simulation engine.',
        badgeVariant: 'healthy' as const,
      };
    }
    if (path.includes('/simulations')) {
      return {
        mood: 'SIMULATION' as AvatarMood,
        title: 'Tactical Physics Engine',
        status: 'Deterministic Branching Mode',
        tip: 'Evaluating Pareto-optimal trade-offs between delay recovery and fuel surcharges with zero live risk.',
        badgeVariant: 'simulation' as const,
      };
    }
    if (path.includes('/incidents')) {
      return {
        mood: 'CRITICAL' as AvatarMood,
        title: 'Incident Incident Intelligence',
        status: 'Level-3 Blizzard Triaged',
        tip: 'Corridor impass detected on I-80 Pass. Ready to generate automated AI Root Cause Analysis.',
        badgeVariant: 'critical' as const,
      };
    }
    if (path.includes('/admin')) {
      return {
        mood: 'SUCCESS' as AvatarMood,
        title: 'Governance & Security Console',
        status: 'RBAC Enforcement Nominal',
        tip: 'Audit ledger is cryptographically secured with SHA-256 integrity hash verification.',
        badgeVariant: 'healthy' as const,
      };
    }
    if (path.includes('/live-world') || path.includes('/overview')) {
      return {
        mood: 'IDLE' as AvatarMood,
        title: 'Spatial Dispatch Copilot',
        status: '42 Haulers In-Transit',
        tip: 'Spatial telemetry streaming live. Tap space or push-to-talk to trigger voice dispatch commands.',
        badgeVariant: 'healthy' as const,
      };
    }
    return {
      mood: 'IDLE' as AvatarMood,
      title: 'NEXUS Copilot',
      status: 'Ready for Commands',
      tip: 'Click any corridor or vehicle to inspect live telemetry and aerodynamic parameters.',
      badgeVariant: 'neutral' as const,
    };
  };

  const context = getRouteContext(pathname);
  const activeMood = customMood || context.mood;

  // Don't display on minimalist onboarding or if dismissed
  if (isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-4 w-80 md:w-96 rounded-3xl bg-nexus-surface-lowest/95 backdrop-blur-2xl border-2 border-nexus-outline-variant/60 shadow-tactile-lg p-5 text-nexus-on-surface space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-nexus-outline-variant/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-nexus-secondary animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold font-mono-data uppercase tracking-wider text-nexus-on-surface">
                    {context.title}
                  </h4>
                  <span className="text-[10px] font-mono-data text-nexus-on-surface-variant">
                    {context.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    tactileAudio.playClick();
                  }}
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  className="p-1.5 rounded-xl hover:bg-nexus-surface-container text-nexus-on-surface-variant transition-colors"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-nexus-surface-container text-nexus-on-surface-variant transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Central 3D Avatar Display */}
            <div className="relative py-2 flex flex-col items-center justify-center">
              <div className="p-3 rounded-2xl bg-nexus-surface-container/50 border border-nexus-outline-variant/40 shadow-tactile">
                <Avatar3D mood={activeMood} size="md" />
              </div>
              <Badge variant={context.badgeVariant} size="sm" className="mt-2.5 font-mono-data text-[10px]">
                Mood: {activeMood}
              </Badge>
            </div>

            {/* Tactical Advice Balloon */}
            <div className="p-3.5 rounded-2xl bg-nexus-surface-container/70 border border-nexus-outline-variant/30 text-xs text-nexus-on-surface-variant leading-relaxed">
              <div className="flex items-center gap-1.5 text-nexus-secondary font-bold font-mono-data text-[11px] mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Tactical Operational Guidance</span>
              </div>
              {context.tip}
            </div>

            {/* Interactive Mood Quick-Switches */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono-data uppercase tracking-wider text-nexus-on-surface-variant font-semibold">
                Test Avatar Expression State:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['WELCOME', 'SIMULATION', 'CRITICAL', 'SUCCESS'] as AvatarMood[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setCustomMood(m);
                      tactileAudio.playClick();
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-mono-data font-semibold transition-all border ${
                      activeMood === m
                        ? 'bg-nexus-primary-container text-white border-transparent shadow-tactile'
                        : 'bg-nexus-surface-container text-nexus-on-surface-variant border-nexus-outline-variant/30 hover:bg-nexus-surface-container-high'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-2 border-t border-nexus-outline-variant/30 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  tactileAudio.playSuccessChord();
                }}
                className="text-[11px] font-mono-data"
              >
                <Play className="h-3 w-3 mr-1" />
                Audio Chime
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCustomMood(null);
                  setIsOpen(false);
                }}
                className="text-[11px] font-mono-data"
              >
                Dock Agent
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Minimized Sliding Orb Trigger */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          tactileAudio.playClick();
        }}
        className="cursor-pointer group flex items-center gap-3 p-2.5 rounded-full bg-nexus-surface-lowest/90 backdrop-blur-xl border-2 border-nexus-outline-variant/50 shadow-tactile-lg hover:border-nexus-secondary transition-all"
      >
        <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-nexus-surface-container/60 shadow-inner">
          <Avatar3D mood={activeMood} size="sm" />
        </div>

        <div className="hidden sm:flex flex-col pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold font-mono-data text-nexus-on-surface">
              NEXUS Companion
            </span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono-data text-nexus-on-surface-variant">
            {activeMood === 'CRITICAL' ? '⚠️ Anomaly Detected' : 'Tactical HUD Ready'}
          </span>
        </div>

        <div className="p-1 rounded-full bg-nexus-surface-container text-nexus-on-surface-variant group-hover:bg-nexus-primary-container group-hover:text-white transition-colors">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </motion.div>
    </div>
  );
}
