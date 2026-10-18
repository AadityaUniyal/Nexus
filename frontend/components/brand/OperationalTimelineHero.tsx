'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ShieldCheck,
  Radio,
  ChevronRight,
  BarChart3,
  Globe2,
  AlertTriangle,
  GitBranch,
  Activity,
  Layers,
  Sparkles,
  Zap,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { NexusHero3D } from '@/components/brand/NexusHero3D';

export interface TimelineMilestone {
  id: string;
  step: string;
  tag: string;
  featureTitle: string;
  featureHref: string;
  headline: string;
  description: string;
  cameraStep: number;
  highlightKpi: { label: string; value: string; note: string };
  featureBadge: string;
  accentColor: string;
  statusIcon: string;
  callToAction: string;
  specDetails: { label: string; value: string }[];
}

export const TIMELINE_MILESTONES: TimelineMilestone[] = [
  {
    id: 'live-stream',
    step: '01',
    tag: 'GLOBAL SPATIAL TELEMETRY',
    featureTitle: 'Live World Operating Graph',
    featureHref: '/live-world',
    headline: 'Continuous Living Operational Graph',
    description:
      'Sub-second telemetry streams across connected fleet haulers, regional superhubs, and priority corridors with zero GPS interpolation lag.',
    cameraStep: 0,
    highlightKpi: { label: 'Daily Stream Events', value: '1.2M+ Active', note: '<18ms Edge Latency' },
    featureBadge: 'SSE Ingestion Live',
    accentColor: 'from-emerald-500/20 to-teal-500/10',
    statusIcon: 'globe',
    callToAction: 'Launch Live World Map',
    specDetails: [
      { label: 'Uplink Ingestion', value: '18ms WebSocket / SSE' },
      { label: 'Active Fleet Hubs', value: '6 Superhubs Synced' },
      { label: 'Signal Fidelity', value: '100% Deterministic' },
    ],
  },
  {
    id: 'incident-ai',
    step: '02',
    tag: 'EARLY-WARNING TRIAGE ENGINE',
    featureTitle: 'Incident Intelligence',
    featureHref: '/incidents',
    headline: 'Autonomous Mountain Pass & Anomaly Triage',
    description:
      'Pinpoint mountain blizzard delays, battery temperature excursions, and cross-dock deadlocks hours before dispatchers notice on static maps.',
    cameraStep: 2,
    highlightKpi: { label: 'Triage Horizon', value: '180 mins saved', note: 'Early corridor warning' },
    featureBadge: 'Level-3 Blizzard Triaged',
    accentColor: 'from-rose-500/20 to-red-500/10',
    statusIcon: 'alert',
    callToAction: 'Inspect Active Incidents',
    specDetails: [
      { label: 'Corridor Status', value: 'I-80 Closed (35kt Gusts)' },
      { label: 'Risk Exposure', value: '$4,200 SLA Penalty' },
      { label: 'Root Cause Engine', value: 'Autonomous Triage' },
    ],
  },
  {
    id: 'simulation-twin',
    step: '03',
    tag: 'WHAT-IF PREDICTIVE PHYSICS',
    featureTitle: 'What-If Corridor Simulation',
    featureHref: '/simulations/new',
    headline: 'Safe Twin Modeling With Zero Live Risk',
    description:
      'Evaluate aerodynamic drag curves, battery charge stops, and alternative southern bypasses in a safe purple simulation layer before touching live dispatch.',
    cameraStep: 3,
    highlightKpi: { label: 'Delay Mitigated', value: '112 mins recovered', note: 'Via I-70 Bypass' },
    featureBadge: 'Deterministic Physics Engine',
    accentColor: 'from-purple-500/20 to-indigo-500/10',
    statusIcon: 'branch',
    callToAction: 'Build What-If Simulation',
    specDetails: [
      { label: 'Energy Delta', value: '-18.4 kWh Recovered' },
      { label: 'Breach Probability', value: 'Reduced from 88% to 12%' },
      { label: 'Physics Accuracy', value: 'Aerodynamic Drag Model' },
    ],
  },
  {
    id: 'executive-analytics',
    step: '04',
    tag: 'EXECUTIVE SLA & LEDGER',
    featureTitle: 'Operations & SLA Analytics',
    featureHref: '/analytics',
    headline: 'Closed-Loop Performance & SLA Tracking',
    description:
      'Track continental on-time delivery percentages, gate turnaround times, and mitigated penalty liabilities verified directly by the cryptographic SHA-256 audit ledger.',
    cameraStep: 6,
    highlightKpi: { label: 'On-Time SLA Adherence', value: '98.1% Verified', note: 'Rolling 30-Day Mean' },
    featureBadge: 'Ledger Audit Locked',
    accentColor: 'from-sky-500/20 to-blue-500/10',
    statusIcon: 'chart',
    callToAction: 'View Fleet Analytics',
    specDetails: [
      { label: 'Cryptographic Trail', value: 'SHA-256 Tamper-Proof' },
      { label: 'Gate Turnaround', value: '24m Average' },
      { label: 'Board Reporting', value: 'One-Click Executive Brief' },
    ],
  },
];

export function OperationalTimelineHero() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 22,
    restDelta: 0.001,
  });

  // Calculate timeline milestone smoothly
  React.useEffect(() => {
    return smoothProgress.on('change', (v) => {
      if (v < 0.28) {
        setActiveIndex(0);
      } else if (v < 0.55) {
        setActiveIndex(1);
      } else if (v < 0.82) {
        setActiveIndex(2);
      } else {
        setActiveIndex(3);
      }
    });
  }, [smoothProgress]);

  // Smooth scrollbar progress bar width
  const progressWidth = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  const activeMilestone = TIMELINE_MILESTONES[activeIndex];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380vh] bg-nexus-surface text-nexus-on-surface border-b border-nexus-outline-variant/30"
    >
      {/* Sticky Interactive Console (Pinned to Viewport like Apple Keynote stage) */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden px-6 lg:px-16 py-8">
        {/* Top Operational Header with Scrub Timeline Indicator */}
        <div className="relative z-20 max-w-7xl mx-auto w-full pb-4 border-b border-nexus-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-nexus-primary bg-nexus-primary/10 px-3 py-1 rounded-full border border-nexus-primary/20 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Operational Architecture Timeline
              </span>
              <span className="text-xs font-mono text-nexus-on-surface-variant hidden sm:inline">
                How Nexus Solves Enterprise Disruption
              </span>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono">
              {TIMELINE_MILESTONES.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeIndex === idx
                      ? 'bg-nexus-primary text-white font-bold shadow-tactile scale-105'
                      : 'bg-nexus-surface-container/60 text-nexus-on-surface-variant hover:bg-nexus-surface-container'
                  }`}
                >
                  <span className="text-[10px] font-bold">{item.step}</span>
                  <span className="hidden md:inline">{item.featureTitle.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Thin Apple-style dynamic scrub line */}
          <div className="w-full h-1 bg-nexus-surface-container rounded-full overflow-hidden">
            <motion.div
              style={{ width: progressWidth }}
              className="h-full bg-gradient-to-r from-emerald-500 via-purple-500 to-sky-500 rounded-full"
            />
          </div>
        </div>

        {/* Center Spatial Stage: Two-Column Choreographed Layout */}
        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full my-auto z-10 py-4">
          {/* Left Column: 3D Living Spatial Network Canvas */}
          <div className="lg:col-span-7 h-[360px] sm:h-[440px] lg:h-[520px] w-full rounded-3xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile-lg relative overflow-hidden flex flex-col justify-between p-6">
            {/* HUD Status Bar */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2 text-[11px] font-mono text-nexus-on-surface-variant">
                <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span className="font-semibold text-nexus-on-surface">Spatial Twin Topology</span>
                <span>·</span>
                <span>Milestone {activeMilestone.step} of 04</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-nexus-surface-container border border-nexus-outline-variant/30 text-nexus-on-surface">
                {activeMilestone.featureBadge}
              </span>
            </div>

            {/* Living 3D WebGL Scene synced with timeline milestone */}
            <div className="absolute inset-0">
              <NexusHero3D currentStep={activeMilestone.cameraStep} interactive={true} />
            </div>

            {/* Bottom In-Canvas Glass HUD with Specs */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-nexus-surface-lowest/85 backdrop-blur-md px-5 py-3 rounded-2xl border border-nexus-outline-variant/30 text-xs font-mono">
              <div>
                <span className="text-[10px] text-nexus-on-surface-variant uppercase tracking-wider block font-semibold">
                  {activeMilestone.highlightKpi.label}
                </span>
                <span className="text-lg font-bold text-nexus-on-surface">
                  {activeMilestone.highlightKpi.value}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-nexus-on-surface-variant uppercase tracking-wider block">
                  Verification Note
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  {activeMilestone.highlightKpi.note}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative Card with Direct Feature Gateway */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMilestone.id}
                initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -18, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="p-7 sm:p-9 rounded-3xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile-lg space-y-6 relative overflow-hidden"
              >
                {/* Subtle Ambient Color Bleed */}
                <div
                  className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${activeMilestone.accentColor} blur-3xl pointer-events-none`}
                />

                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-secondary">
                      {activeMilestone.tag}
                    </span>
                    <span className="text-3xl font-black font-mono text-nexus-outline-variant/60">
                      {activeMilestone.step}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-nexus-on-surface leading-tight">
                    {activeMilestone.headline}
                  </h3>
                </div>

                <p className="text-sm text-nexus-on-surface-variant leading-relaxed relative z-10">
                  {activeMilestone.description}
                </p>

                {/* Technical Specs Breakdown */}
                <div className="space-y-2 pt-2 border-t border-nexus-outline-variant/20 relative z-10">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-nexus-on-surface-variant block font-semibold">
                    Core Operational Architecture
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {activeMilestone.specDetails.map((spec) => (
                      <div
                        key={spec.label}
                        className="px-3.5 py-2 rounded-xl bg-nexus-surface-container/30 border border-nexus-outline-variant/20 flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-nexus-on-surface-variant">{spec.label}</span>
                        <span className="font-bold text-nexus-on-surface">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Action Callout Leading Toward Feature */}
                <div className="pt-3 border-t border-nexus-outline-variant/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
                  <Link
                    href={activeMilestone.featureHref}
                    className="px-5 py-3.5 rounded-2xl bg-nexus-primary text-white text-xs font-mono font-bold shadow-tactile hover:bg-nexus-primary/95 transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>{activeMilestone.callToAction}</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/login"
                    className="px-4 py-3.5 rounded-2xl border border-nexus-outline-variant/40 hover:bg-nexus-surface-container text-nexus-on-surface-variant text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Operator Login</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Directive & Status */}
        <div className="relative z-20 max-w-7xl mx-auto w-full pt-3 border-t border-nexus-outline-variant/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-nexus-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive 3D Spatial Twin Synced</span>
          </div>

          <div className="flex items-center gap-2">
            <ChevronDown className="h-3.5 w-3.5 text-nexus-primary animate-bounce" />
            <span>Scroll smoothly to advance the timeline or click stages above</span>
          </div>
        </div>
      </div>
    </div>
  );
}
