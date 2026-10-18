'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  Zap,
  Radio,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Gauge,
  Compass,
  Server,
  BarChart3,
  Network
} from 'lucide-react';
import Link from 'next/link';

interface SpecFeature {
  label: string;
  value: string;
  sub: string;
}

const PHASES = [
  {
    index: 0,
    stage: '01 · TELEMETRY INGESTION',
    title: 'Nexus Edge Telematics Gateway',
    headline: 'Physical Fleets. Sub-Second Signals.',
    description:
      'Nexus connects directly to your existing vehicles, trailers, and temperature probes via high-throughput CAN-bus and 5G uplink—turning physical movement into continuous structured data.',
    image: '/hero-nexus-gateway.jpg',
    specs: [
      { label: 'Uplink Latency', value: '< 25 ms', sub: 'Sub-second real-time sync' },
      { label: 'Bus Compatibility', value: 'J1939 / OBD-II', sub: 'Universal fleet protocol' },
      { label: 'Signal Encryption', value: 'mTLS & SHA-256', sub: 'Hardware tamper-proof' },
    ],
  },
  {
    index: 1,
    stage: '02 · HARDWARE ARCHITECTURE',
    title: 'Edge Processing & Neural Telemetry',
    headline: 'Real-Time Edge Telemetry Teardown',
    description:
      'Multi-core ARM processing and GNSS satellite positioning filter sensor noise at the edge, computing fuel burn, battery thermodynamics, and corridor elevation before transmitting to the cloud.',
    image: '/hero-nexus-gateway-exploded.jpg',
    specs: [
      { label: 'Onboard Compute', value: 'Nexus AI Engine', sub: 'Edge anomaly detection' },
      { label: 'Satellite Precision', value: 'Multi-GNSS L1/L5', sub: 'Centimeter corridor lock' },
      { label: 'Power Resilience', value: 'Supercap Reserve', sub: 'Zero-drop telemetry buffer' },
    ],
  },
  {
    index: 2,
    stage: '03 · OPERATIONAL INTELLIGENCE',
    title: 'Executive Logistics Command Console',
    headline: 'From Raw Signals to Decisive Action',
    description:
      'Where fleet owners, operations managers, and analysts command their entire distribution footprint. Real-time corridor routing, predictive delay alerts, and instant what-if re-dispatching.',
    image: '/hero-nexus-console.jpg',
    specs: [
      { label: 'On-Time Delivery', value: '98.1%', sub: 'Continuous SLA audit' },
      { label: 'Active Corridors', value: '1,452 Routes', sub: 'Live topology tracking' },
      { label: 'Delay Avoidance', value: '112 mins saved', sub: 'Automated detour reroute' },
    ],
  },
];

export function AppleVisionProScrollHero() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  // Calculate current active phase from progress
  const [activePhaseIndex, setActivePhaseIndex] = React.useState(0);

  React.useEffect(() => {
    return smoothProgress.on('change', (latest) => {
      if (latest < 0.33) {
        setActivePhaseIndex(0);
      } else if (latest < 0.68) {
        setActivePhaseIndex(1);
      } else {
        setActivePhaseIndex(2);
      }
    });
  }, [smoothProgress]);

  // Image transitions
  const img1Opacity = useTransform(smoothProgress, [0, 0.28, 0.35], [1, 1, 0]);
  const img1Scale = useTransform(smoothProgress, [0, 0.35], [1, 0.95]);

  const img2Opacity = useTransform(smoothProgress, [0.32, 0.38, 0.62, 0.68], [0, 1, 1, 0]);
  const img2Scale = useTransform(smoothProgress, [0.32, 0.68], [1.05, 0.98]);

  const img3Opacity = useTransform(smoothProgress, [0.65, 0.72, 1], [0, 1, 1]);
  const img3Scale = useTransform(smoothProgress, [0.65, 1], [1.04, 1]);

  const activePhase = PHASES[activePhaseIndex];

  return (
    <div ref={containerRef} className="relative w-full h-[320vh] bg-[#fbfbfd] text-[#1d1d1f]">
      {/* Sticky Screen Viewport (Apple Vision Pro style pinned viewer) */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden px-6 lg:px-16 py-10">
        {/* Top Header / Spec Bar */}
        <div className="relative z-20 max-w-6xl mx-auto w-full flex items-center justify-between border-b border-black/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-800 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Nexus Telematics Architecture
            </span>
            <span className="text-xs font-mono text-black/50 hidden sm:inline">
              How Physical Movement Becomes Operational Intelligence
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-black/40">Phase</span>
              <span className="font-bold text-black">{activePhase.stage}</span>
            </div>
            <div className="flex gap-1.5">
              {PHASES.map((p, i) => (
                <div
                  key={p.stage}
                  className={`h-1.5 transition-all duration-300 rounded-full ${
                    i === activePhaseIndex ? 'w-6 bg-emerald-600' : 'w-2 bg-black/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center Canvas: Interactive Scrollable Object Visual */}
        <div className="relative flex-1 flex items-center justify-center max-w-6xl mx-auto w-full my-auto">
          {/* Subtitle floating headline (Apple Keynote typography) */}
          <div className="absolute top-2 left-0 right-0 text-center z-10 pointer-events-none">
            <motion.h2
              key={activePhase.headline}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1d1d1f]"
            >
              {activePhase.headline}
            </motion.h2>
            <motion.p
              key={activePhase.description}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-2 text-sm sm:text-base text-black/60 max-w-2xl mx-auto line-clamp-2 px-4"
            >
              {activePhase.description}
            </motion.p>
          </div>

          {/* Layered Hardware Image Stages with Apple Studio Drop Shadow */}
          <div className="relative w-full max-w-4xl h-[320px] sm:h-[440px] md:h-[500px] flex items-center justify-center">
            {/* Image 1: Telematics Edge Gateway */}
            <motion.div
              style={{ opacity: img1Opacity, scale: img1Scale }}
              className="absolute inset-0 flex items-center justify-center transition-all"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/hero-nexus-gateway.jpg"
                  alt="Nexus Telematics Edge Gateway Hardware Device"
                  fill
                  priority
                  className="object-contain mix-blend-multiply"
                />
              </div>
            </motion.div>

            {/* Image 2: Exploded Telematics Hardware Teardown */}
            <motion.div
              style={{ opacity: img2Opacity, scale: img2Scale }}
              className="absolute inset-0 flex items-center justify-center transition-all"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/hero-nexus-gateway-exploded.jpg"
                  alt="Nexus Edge Gateway Exploded Architecture Teardown"
                  fill
                  priority
                  className="object-contain mix-blend-multiply"
                />
              </div>
            </motion.div>

            {/* Image 3: Executive Logistics Command Console */}
            <motion.div
              style={{ opacity: img3Opacity, scale: img3Scale }}
              className="absolute inset-0 flex items-center justify-center transition-all"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/hero-nexus-console.jpg"
                  alt="Nexus Logistics Operations Analytics Console"
                  fill
                  priority
                  className="object-contain mix-blend-multiply"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Hardware Spec Metrics & Scroll Prompt */}
        <div className="relative z-20 max-w-6xl mx-auto w-full pt-4 border-t border-black/[0.08]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            {activePhase.specs.map((spec) => (
              <div key={spec.label} className="flex flex-col">
                <span className="text-[11px] font-mono uppercase tracking-wider text-black/50 font-medium">
                  {spec.label}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-800">
                  {spec.value}
                </span>
                <span className="text-xs text-black/60 font-mono">{spec.sub}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-mono text-black/40">
            <span className="flex items-center gap-1.5">
              <ChevronDown className="h-3.5 w-3.5 animate-bounce text-emerald-600" />
              Scroll down to explore edge architecture & live analytics console
            </span>
            <Link
              href="/login"
              className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
            >
              <span>Access Operations Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
