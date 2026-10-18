'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, useScroll, useSpring } from 'motion/react';
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Radio,
  Sliders,
  ChevronRight,
  BrainCircuit,
  BarChart3,
  MapPin,
  GitBranch,
  Layers,
  Sparkles
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
  statusColor: string;
  callToAction: string;
}

export const TIMELINE_MILESTONES: TimelineMilestone[] = [
  {
    id: 'ingestion',
    step: '01',
    tag: 'REAL-TIME TELEMETRY STREAM',
    featureTitle: 'Live World Spatial Twin',
    featureHref: '/live-world',
    headline: 'Continuous Living Operational Graph',
    description:
      'Sub-second telemetry streams across vehicles, freight hubs, and priority transit corridors with zero GPS interpolation lag.',
    cameraStep: 0,
    highlightKpi: { label: 'Active Stream Events', value: '1.2M/day', note: '<18ms Edge Latency' },
    featureBadge: 'SSE Telemetry Active',
    statusColor: 'emerald',
    callToAction: 'Launch Live World Map',
  },
  {
    id: 'anomaly',
    step: '02',
    tag: 'AUTONOMOUS TRIAGE ENGINE',
    featureTitle: 'Incident Intelligence',
    featureHref: '/incidents',
    headline: 'Early-Warning Anomaly Detection',
    description:
      'Pinpoint mountain blizzard delays, temperature excursions in cold-chain reefers, and transit deadlocks hours before dispatchers notice.',
    cameraStep: 2,
    highlightKpi: { label: 'Triage Horizon', value: '180 mins', note: 'Advance corridor warning' },
    featureBadge: 'Incident Radar Online',
    statusColor: 'rose',
    callToAction: 'Inspect Active Incidents',
  },
  {
    id: 'simulation',
    step: '03',
    tag: 'WHAT-IF DIGITAL TWIN',
    featureTitle: 'What-If Corridor Simulation',
    featureHref: '/simulations/new',
    headline: 'Safe Twin Modeling With Zero Live Risk',
    description:
      'Test weather detours, electric charge stops, and capacity reroutes in a 100% deterministic physics layer before mutating live dispatch.',
    cameraStep: 3,
    highlightKpi: { label: 'Delay Mitigated', value: '112 mins', note: '$4,200 penalty saved' },
    featureBadge: 'Deterministic Physics',
    statusColor: 'purple',
    callToAction: 'Build What-If Simulation',
  },
  {
    id: 'analytics',
    step: '04',
    tag: 'EXECUTIVE INTELLIGENCE',
    featureTitle: 'Operations & SLA Analytics',
    featureHref: '/analytics',
    headline: 'Closed-Loop Performance & SLA Tracking',
    description:
      'Track continental on-time performance, carrier turnaround times, and mitigated delay liabilities directly from verified audit records.',
    cameraStep: 6,
    highlightKpi: { label: 'SLA Adherence', value: '98.1%', note: 'Verified by Audit Ledger' },
    featureBadge: 'Executive Overview',
    statusColor: 'sky',
    callToAction: 'View Fleet Analytics',
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
    stiffness: 100,
    damping: 20,
    restDelta: 0.001,
  });

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

  const activeMilestone = TIMELINE_MILESTONES[activeIndex];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[360vh] bg-nexus-surface text-nexus-on-surface border-b border-nexus-outline-variant/30"
    >
      {/* Sticky Interactive Console (Pinned to Viewport) */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden px-6 lg:px-14 py-8">
        {/* Top Operational Header */}
        <div className="relative z-20 max-w-7xl mx-auto w-full flex items-center justify-between pb-4 border-b border-nexus-outline-variant/30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-nexus-primary bg-nexus-primary/10 px-3 py-1 rounded-full border border-nexus-primary/20 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational Timeline
            </span>
            <span className="text-xs font-mono text-nexus-on-surface-variant hidden sm:inline">
              Scroll through the Nexus Intelligence Lifecycle
            </span>
          </div>

          {/* Interactive Stepper Indicator */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
            {TIMELINE_MILESTONES.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeIndex === idx
                    ? 'bg-nexus-primary text-white font-bold shadow-tactile'
                    : 'bg-nexus-surface-container text-nexus-on-surface-variant hover:bg-nexus-surface-container-high'
                }`}
              >
                <span>{item.step}</span>
                <span className="hidden md:inline">{item.featureTitle.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center Spatial Stage: Two-Column Interactive View */}
        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center max-w-7xl mx-auto w-full my-auto z-10 py-4">
          {/* Left Column: 3D Living Spatial Network Canvas */}
          <div className="lg:col-span-7 h-[340px] sm:h-[420px] lg:h-[500px] w-full rounded-3xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile-lg relative overflow-hidden flex flex-col justify-between p-5">
            {/* HUD Status Bar */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2 text-[11px] font-mono text-nexus-on-surface-variant">
                <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span className="font-semibold text-nexus-on-surface">Spatial Twin Feed</span>
                <span>·</span>
                <span>Stage {activeMilestone.step} of 04</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-nexus-surface-container border border-nexus-outline-variant/30 text-nexus-on-surface">
                {activeMilestone.featureBadge}
              </span>
            </div>

            {/* Living 3D WebGL Scene synced with timeline milestone */}
            <div className="absolute inset-0">
              <NexusHero3D currentStep={activeMilestone.cameraStep} interactive={true} />
            </div>

            {/* Bottom In-Canvas Metric Pill */}
            <div className="relative z-10 flex items-center justify-between bg-nexus-surface-lowest/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-nexus-outline-variant/30 text-xs font-mono">
              <div>
                <span className="text-[10px] text-nexus-on-surface-variant uppercase block">
                  {activeMilestone.highlightKpi.label}
                </span>
                <span className="text-base font-bold text-nexus-on-surface">
                  {activeMilestone.highlightKpi.value}
                </span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {activeMilestone.highlightKpi.note}
              </span>
            </div>
          </div>

          {/* Right Column: Narrative Feature Card with Direct Product Destination */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <motion.div
              key={activeMilestone.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="p-6 sm:p-8 rounded-3xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile-lg space-y-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-secondary">
                    {activeMilestone.tag}
                  </span>
                  <span className="text-2xl font-black font-mono text-nexus-outline-variant">
                    {activeMilestone.step}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-nexus-on-surface leading-snug">
                  {activeMilestone.headline}
                </h3>
              </div>

              <p className="text-sm text-nexus-on-surface-variant leading-relaxed">
                {activeMilestone.description}
              </p>

              {/* Feature Target Link */}
              <div className="pt-3 border-t border-nexus-outline-variant/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Link
                  href={activeMilestone.featureHref}
                  className="px-5 py-3 rounded-2xl bg-nexus-primary text-white text-xs font-mono font-bold shadow-tactile hover:bg-nexus-primary/95 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>{activeMilestone.callToAction}</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="px-4 py-3 rounded-2xl border border-nexus-outline-variant/40 hover:bg-nexus-surface-container text-nexus-on-surface-variant text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Operator Login</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Progress Bar & Scroll Directive */}
        <div className="relative z-20 max-w-7xl mx-auto w-full pt-3 border-t border-nexus-outline-variant/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-nexus-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Spatial Telemetry Twin Active</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Scroll down to advance timeline or click any phase above</span>
          </div>
        </div>
      </div>
    </div>
  );
}
