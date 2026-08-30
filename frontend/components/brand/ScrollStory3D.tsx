'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe2,
  Activity,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  BrainCircuit,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NexusHero3D } from './NexusHero3D';
import Link from 'next/link';

export interface StoryChapter {
  id: string;
  stepNumber: string;
  phase: string;
  title: string;
  headline: string;
  description: string;
  badge: string;
  badgeVariant: 'healthy' | 'critical' | 'simulation' | 'ai' | 'neutral';
  kpis: { label: string; value: string; delta?: string; status?: string }[];
  highlightColor: string;
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'observe',
    stepNumber: '01',
    phase: 'OBSERVE',
    title: 'Unified Spatial Network',
    headline: 'Continuous Living Operational Twin',
    description:
      'Live 3D telemetry streams across all interconnected vehicles, warehouses, routes, and priority freight corridors in real time with sub-second precision.',
    badge: '1.2M+ Daily Stream Events',
    badgeVariant: 'healthy',
    kpis: [
      { label: 'Active Haulers', value: '42 Haulers', delta: '+12% capacity' },
      { label: 'Network Latency', value: '18 ms', status: 'Optimal' },
      { label: 'Superhubs Live', value: '6 Distribution Centers' },
    ],
    highlightColor: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    id: 'understand',
    stepNumber: '02',
    phase: 'UNDERSTAND',
    title: 'Instant Operational Clarity',
    headline: 'High-Density Telemetry Synthesis',
    description:
      'NEXUS transforms chaotic sensor streams into transparent metrics: real-time SLA compliance, battery thermal health, and predictive bottleneck indicators.',
    badge: '97.4% SLA Adherence',
    badgeVariant: 'healthy',
    kpis: [
      { label: 'SLA Adherence', value: '97.4%', delta: '+2.1% WoW' },
      { label: 'Fleet Efficiency', value: '95.2%', status: 'Nominal' },
      { label: 'Avg Turnaround', value: '42 mins' },
    ],
    highlightColor: 'from-sky-500/20 to-blue-500/10',
  },
  {
    id: 'investigate',
    stepNumber: '03',
    phase: 'INVESTIGATE',
    title: 'Autonomous Anomaly Detection',
    headline: 'Level-3 Blizzard & Thermal Warning Triaged',
    description:
      'When extreme blizzard conditions block highway passes or cold-chain cargo drifts outside temperature bounds, NEXUS immediately pinpoints root causes and penalty risks.',
    badge: 'Active Critical Anomaly',
    badgeVariant: 'critical',
    kpis: [
      { label: 'Severity', value: 'CRITICAL (Level 3)', status: 'Active' },
      { label: 'Corridor Status', value: 'I-80 Closed (35kt Gusts)' },
      { label: 'Delay Exposure', value: '+180 mins penalty' },
    ],
    highlightColor: 'from-rose-500/20 to-red-500/10',
  },
  {
    id: 'simulate',
    stepNumber: '04',
    phase: 'SIMULATE',
    title: 'Hypothetical What-If Branching',
    headline: 'Safe Twin Modeling with Zero Live Risk',
    description:
      'Evaluate aerodynamic drag equations, rolling resistance, and alternative mountain bypasses in a safe purple simulation layer before touching active dispatch systems.',
    badge: 'Deterministic Physics Engine',
    badgeVariant: 'simulation',
    kpis: [
      { label: 'Physics Engine', value: '100% Deterministic' },
      { label: 'Time Recovery', value: '+135 mins saved' },
      { label: 'Energy Delta', value: '-18.4 kWh' },
    ],
    highlightColor: 'from-purple-500/20 to-indigo-500/10',
  },
  {
    id: 'decide',
    stepNumber: '05',
    phase: 'DECIDE',
    title: 'Multi-Variable Pareto Optimum',
    headline: 'Mathematical Trade-Off Scoring (0 - 100)',
    description:
      'Synthesize scenario costs, fuel deltas, and delivery confidence to select the mathematical optimum without second-guessing.',
    badge: 'Decision Score: 94/100',
    badgeVariant: 'simulation',
    kpis: [
      { label: 'Optimal Route', value: 'I-70 South Highway' },
      { label: 'Net Cost Delta', value: '+$80.00' },
      { label: 'Breach Probability', value: '12.0% (was 88%)' },
    ],
    highlightColor: 'from-purple-600/20 to-fuchsia-500/10',
  },
  {
    id: 'learn',
    stepNumber: '06',
    phase: 'LEARN',
    title: 'Historical Pattern Intelligence',
    headline: 'Continuous AI Closed-Loop Feedback',
    description:
      'Applied decisions automatically enrich the operational knowledge graph, refining future route buffer tolerances and predictive maintenance forecasts.',
    badge: 'Groq LLaMA-3.3-70B RCA',
    badgeVariant: 'ai',
    kpis: [
      { label: 'Pattern Model', value: 'Continuous RL Loop' },
      { label: 'Buffer Precision', value: '±3.2 mins' },
      { label: 'AI Inference', value: '380 ms' },
    ],
    highlightColor: 'from-amber-500/20 to-orange-500/10',
  },
  {
    id: 'operate',
    stepNumber: '07',
    phase: 'OPERATE',
    title: 'Transactional ACID Execution',
    headline: 'One-Click Decision Mutation & Audit Lock',
    description:
      'Execute approved reroutes directly into live fleet telematics with optimistic locking and immutable cryptographic audit logging.',
    badge: 'ACID Guaranteed Execution',
    badgeVariant: 'healthy',
    kpis: [
      { label: 'Execution', value: 'Atomic Lock (<50ms)' },
      { label: 'Ledger Hash', value: 'SHA-256 Verified' },
      { label: 'Telemetry Push', value: 'SSE Broadcast Live' },
    ],
    highlightColor: 'from-emerald-600/20 to-teal-600/10',
  },
];

export function ScrollStory3D() {
  const [activeStep, setActiveStep] = React.useState<number>(0);
  const currentChapter = STORY_CHAPTERS[activeStep];

  return (
    <div className="relative w-full">
      {/* 3D WebGL Canvas Backdrop & Sticky Choreographer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Interactive 3D Spatial Canvas */}
        <div className="lg:col-span-7 sticky top-24 h-[460px] lg:h-[580px] rounded-3xl bg-nexus-surface-lowest/80 backdrop-blur-xl border border-nexus-outline-variant/40 shadow-tactile-lg overflow-hidden flex flex-col justify-between p-6">
          {/* Top HUD overlay */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono-data uppercase tracking-wider text-nexus-on-surface-variant font-semibold">
                Living 3D Spatial Twin · Chapter {currentChapter.stepNumber} of 07
              </span>
            </div>
            <Badge variant={currentChapter.badgeVariant} size="sm">
              {currentChapter.badge}
            </Badge>
          </div>

          {/* Core Three.js WebGL Interactive Scene */}
          <div className="absolute inset-0">
            <NexusHero3D currentStep={activeStep} interactive={true} />
          </div>

          {/* Bottom Interactive Step Navigation Pill */}
          <div className="z-10 flex items-center justify-between pt-4 border-t border-nexus-outline-variant/30 bg-nexus-surface-lowest/60 backdrop-blur-sm px-4 py-3 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {STORY_CHAPTERS.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveStep(idx)}
                  className={`px-3 py-1.5 rounded-xl font-mono-data text-xs transition-all flex items-center gap-1.5 ${
                    activeStep === idx
                      ? 'bg-nexus-primary-container text-white shadow-tactile font-bold scale-105'
                      : 'bg-nexus-surface-container hover:bg-nexus-surface-container-high text-nexus-on-surface-variant'
                  }`}
                >
                  <span>{ch.stepNumber}</span>
                  <span className="hidden sm:inline text-[10px]">{ch.phase}</span>
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant">
              <span>{activeStep + 1} / 7</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Scrollytelling Detail Cards */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentChapter.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="p-8 rounded-3xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile-lg space-y-6"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-black font-mono-data text-nexus-outline/60">
                    {currentChapter.stepNumber}
                  </span>
                  <span className="text-xs font-mono-data text-nexus-secondary font-bold tracking-wider uppercase">
                    Phase {currentChapter.phase}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-nexus-on-surface tracking-tight">
                  {currentChapter.title}
                </h3>
                <h4 className="text-sm font-semibold text-nexus-secondary mt-1">
                  {currentChapter.headline}
                </h4>

                <p className="text-sm text-nexus-on-surface-variant mt-4 leading-relaxed">
                  {currentChapter.description}
                </p>
              </div>

              {/* Dynamic KPI Metrics Grid for the Chapter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentChapter.kpis.map((kpi, kIdx) => (
                  <div
                    key={kIdx}
                    className="p-3.5 rounded-2xl bg-nexus-surface-container/60 border border-nexus-outline-variant/30 font-mono-data"
                  >
                    <p className="text-[11px] text-nexus-on-surface-variant font-medium">{kpi.label}</p>
                    <p className="text-base font-bold text-nexus-on-surface mt-1">{kpi.value}</p>
                    {kpi.delta && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {kpi.delta}
                      </span>
                    )}
                    {kpi.status && (
                      <span className="text-[10px] text-nexus-secondary font-semibold">
                        Status: {kpi.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Chapter Actions */}
              <div className="pt-4 border-t border-nexus-outline-variant/30 flex items-center justify-between gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : STORY_CHAPTERS.length - 1))}
                  className="font-mono-data text-xs"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Link href={activeStep === 3 || activeStep === 4 ? '/simulations/new' : '/overview'}>
                    <Button variant="primary" size="sm" className="font-mono-data text-xs shadow-tactile">
                      Try {currentChapter.phase}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveStep((prev) => (prev < STORY_CHAPTERS.length - 1 ? prev + 1 : 0))}
                    className="font-mono-data text-xs"
                  >
                    Next Phase
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
