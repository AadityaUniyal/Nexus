"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Smartphone,
  ChevronRight,
  Cloud,
  Fingerprint,
  TrendingDown,
  Layers,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  Navigation,
  Fuel,
  Leaf,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { AppleGlassCard } from "@/components/motion/apple-glass-card";
import { AppleAuthCard } from "@/components/auth/AppleAuthCard";
import { tactileAudio } from "@/lib/sound-effects";

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [scrubberHour, setScrubberHour] = React.useState(14); // 2:00 PM default peak

  // Pinned Hero Scroll Animation
  const heroRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  const smoothHeroProgress = useSpring(heroProgress, { stiffness: 220, damping: 28 });

  // Transforms for the Apple zoom-in perspective hardware reveal
  const heroTextOpacity = useTransform(smoothHeroProgress, [0, 0.35], [1, 0]);
  const heroTextY = useTransform(smoothHeroProgress, [0, 0.35], [0, -60]);
  const heroTextScale = useTransform(smoothHeroProgress, [0, 0.35], [1, 0.94]);

  const previewScale = useTransform(smoothHeroProgress, [0.15, 0.75], [0.82, 1]);
  const previewRotateX = useTransform(smoothHeroProgress, [0.15, 0.75], [18, 0]);
  const previewY = useTransform(smoothHeroProgress, [0.15, 0.75], [140, 0]);
  const previewOpacity = useTransform(smoothHeroProgress, [0.08, 0.28], [0.4, 1]);

  // Dynamic Detention Scrubber calculations
  const isPeakHour = scrubberHour >= 11 && scrubberHour <= 16;
  const estimatedDwellMinutes = Math.round(isPeakHour ? 45 + (scrubberHour - 10) * 18 : 38 + (scrubberHour % 6) * 4);
  const detentionRiskPct = Math.min(96, Math.max(8, Math.round((estimatedDwellMinutes / 180) * 100)));
  const demurrageExposureUsd = Math.max(0, Math.round(((estimatedDwellMinutes - 120) / 60) * 75));

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-[#0071E3] selection:text-white transition-colors duration-500 overflow-x-hidden">
      {/* 1. Global Apple Frosted Capsule Header */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-2xl bg-white/70 dark:bg-black/75 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none group">
            <LogoMark size={26} />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold tracking-[-0.03em] text-[15px] text-neutral-900 dark:text-white">
                VOYAGE
              </span>
              <span className="hidden sm:inline-flex text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                OS 2.6
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium tracking-tight text-neutral-600 dark:text-neutral-400">
            <a href="#overview" className="hover:text-black dark:hover:text-white transition-colors">
              Overview
            </a>
            <a href="#detention" className="hover:text-black dark:hover:text-white transition-colors">
              Detention Radar
            </a>
            <a href="#driver-pass" className="hover:text-black dark:hover:text-white transition-colors">
              Driver Pass
            </a>
            <a href="#specs" className="hover:text-black dark:hover:text-white transition-colors">
              Specifications
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                tactileAudio.playClick();
                setShowAuthModal(true);
              }}
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white/60 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Fingerprint className="w-3.5 h-3.5 text-[#0071E3]" />
              Passkey Sign In
            </button>
            <Link
              href="/overview"
              className="text-[12px] font-medium px-4 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white transition-all shadow-[0_2px_8px_rgba(0,113,227,0.25)] hover:shadow-[0_4px_12px_rgba(0,113,227,0.35)]"
            >
              Open Console
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Pinned Apple Scroll-Driven Hero Reveal Section */}
      <section ref={heroRef} id="overview" className="relative min-h-[200vh]">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 pt-16 overflow-hidden">
          {/* Ambient Lighting Dome */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-b from-[#0071E3]/20 via-[#2997FF]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

          {/* Kinetic Fading Headline */}
          <motion.div
            style={{ opacity: heroTextOpacity, y: heroTextY, scale: heroTextScale }}
            className="text-center max-w-4xl mx-auto z-10 select-none mb-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.06] text-[12px] font-medium text-neutral-600 dark:text-neutral-300 mb-6 backdrop-blur-xl shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              The Autonomous Freight Operating System
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.04em] text-neutral-900 dark:text-white leading-[1.06]">
              Light years ahead. <br />
              <span className="bg-gradient-to-r from-[#0071E3] via-[#2997FF] to-[#0071E3] bg-clip-text text-transparent">
                Miles before deadline.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed tracking-tight">
              Preempt dock detention penalties, dispatch freight via zero-install WhatsApp passes, and eliminate empty deadhead corridors with mathematical precision.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/overview"
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-medium text-[14px] hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 dark:shadow-white/10"
              >
                Launch Live Dispatch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-black/[0.12] dark:border-white/[0.16] bg-white/80 dark:bg-neutral-900/80 font-medium text-[14px] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 text-neutral-800 dark:text-neutral-200 backdrop-blur-md"
              >
                <Fingerprint className="w-4 h-4 text-[#0071E3]" />
                Try Apple Passkey Login
              </button>
            </div>
          </motion.div>

          {/* 3D Hardware Canvas: The macOS Precision Dispatch Window */}
          <motion.div
            style={{
              scale: previewScale,
              rotateX: previewRotateX,
              y: previewY,
              opacity: previewOpacity,
              transformPerspective: 1200,
            }}
            className="w-full max-w-5xl mx-auto rounded-[24px] border border-black/[0.12] dark:border-white/[0.14] bg-white dark:bg-[#1C1C1E] shadow-[0_32px_100px_-24px_rgba(0,0,0,0.25)] dark:shadow-[0_32px_100px_-24px_rgba(0,0,0,0.85)] overflow-hidden z-20"
          >
            {/* macOS Precision Title Bar */}
            <div className="h-10 px-4 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-neutral-100/70 dark:bg-neutral-900/70 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                <span className="ml-3 text-[11px] font-mono text-neutral-500 tracking-tight">
                  voyage-control-tower — 42 Active Highway Dispatches
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Azure Serverless Connected
              </div>
            </div>

            {/* Inner High-Density Live Telemetry Surface */}
            <div className="p-6 text-left">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F9F9FB] dark:bg-neutral-900/50">
                  <span className="text-[10px] uppercase font-mono text-neutral-500">Active Trucks</span>
                  <p className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white mt-0.5">42 Units</p>
                  <span className="text-[11px] text-emerald-600 font-medium">96.8% SLA on-schedule</span>
                </div>
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.04]">
                  <span className="text-[10px] uppercase font-mono text-rose-600 dark:text-rose-400">Detention Clocks</span>
                  <p className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400 mt-0.5">0 Active Fees</p>
                  <span className="text-[11px] text-neutral-500 font-medium">Free window preserved</span>
                </div>
                <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F9F9FB] dark:bg-neutral-900/50">
                  <span className="text-[10px] uppercase font-mono text-neutral-500">Deadhead Avoided</span>
                  <p className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white mt-0.5">-340 km</p>
                  <span className="text-[11px] text-emerald-600 font-medium">+$142 fuel preserved</span>
                </div>
                <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F9F9FB] dark:bg-neutral-900/50">
                  <span className="text-[10px] uppercase font-mono text-neutral-500">Camera PODs</span>
                  <p className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white mt-0.5">100% Stored</p>
                  <span className="text-[11px] text-[#0071E3] font-medium">Encrypted on Azure Blob</span>
                </div>
              </div>

              {/* Live Dispatch Stream Strip */}
              <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.10] overflow-hidden">
                <div className="bg-neutral-100/70 dark:bg-neutral-900/70 px-4 py-2 text-[11px] font-mono text-neutral-500 flex justify-between">
                  <span>DISPATCH STREAM</span>
                  <span>AUTONOMOUS TELEMETRY ADAPTER</span>
                </div>
                <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08] text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 font-semibold">
                        GEOFENCE DOCKED
                      </span>
                      <span className="font-mono font-medium text-neutral-900 dark:text-white">#TRP-DEL-MUM-892</span>
                      <span className="text-neutral-500 text-[11px] hidden sm:inline">Bhiwandi Hub (MH-04-AB-1234)</span>
                    </div>
                    <span className="text-neutral-500 text-[11px] font-mono">Dwell: 18m / 120m</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0071E3]/10 text-[#0071E3] font-semibold">
                        BACKHAUL PAIRED
                      </span>
                      <span className="font-mono font-medium text-neutral-900 dark:text-white">#TRP-BLR-HYD-401</span>
                      <span className="text-neutral-500 text-[11px] hidden sm:inline">Return load matched to Bangalore</span>
                    </div>
                    <span className="text-emerald-600 font-mono text-[11px]">+$850 revenue</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Apple Interactive Lab: Live Dock Detention Radar Scrubber */}
      <section id="detention" className="py-28 px-6 max-w-6xl mx-auto border-t border-black/[0.08] dark:border-white/[0.10]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[11px] font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" /> INTERACTIVE PREDICTIVE RADAR
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Detention Zero.
          </h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
            Legacy transporters lose 4.8 hours waiting at unloading bays. Scrub the arrival hour below to see how VOYAGE predicts queue depth and prevents demurrage penalties.
          </p>
        </div>

        {/* Interactive Scrubber Card */}
        <div className="max-w-3xl mx-auto rounded-3xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl p-6 sm:p-8 shadow-tactile">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div>
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block">Target Facility</span>
              <span className="text-lg font-bold text-neutral-900 dark:text-white">Bhiwandi Continental Logistics Hub</span>
              <span className="text-xs text-neutral-500 block">Dock Capacity: 12 Active / 14 Total Bays</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block">Scheduled Arrival</span>
              <span className="text-2xl font-mono font-bold text-[#0071E3]">
                {String(scrubberHour).padStart(2, "0")}:00 hrs
              </span>
              <span className="text-[11px] text-neutral-500 block">
                {isPeakHour ? "Peak Congestion Window" : "Off-Peak Fluid Window"}
              </span>
            </div>
          </div>

          {/* Interactive Hour Slider */}
          <div className="my-6">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-2">
              <span>06:00 (Early Morning)</span>
              <span>14:00 (Peak Inbound)</span>
              <span>22:00 (Night Transit)</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={scrubberHour}
              onChange={(e) => {
                setScrubberHour(Number(e.target.value));
                tactileAudio.playClick();
              }}
              className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#0071E3]"
            />
          </div>

          {/* Scrubber Outcome Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center font-mono">
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-[11px] text-neutral-500 block mb-1">Expected Dwell</span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-neutral-400" /> {estimatedDwellMinutes}m
              </span>
              <span className="text-[10px] text-neutral-400 mt-1 block">Free limit: 120m</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-[11px] text-neutral-500 block mb-1">Detention Probability</span>
              <span
                className={`text-2xl font-bold ${
                  detentionRiskPct > 60
                    ? "text-rose-500"
                    : detentionRiskPct > 35
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`}
              >
                {detentionRiskPct}%
              </span>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                {detentionRiskPct > 60 ? "Critical Liability" : "Nominal Turnaround"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-[11px] text-neutral-500 block mb-1">Demurrage Liability</span>
              <span
                className={`text-2xl font-bold ${
                  demurrageExposureUsd > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-500"
                }`}
              >
                ${demurrageExposureUsd.toFixed(0)}
              </span>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                {demurrageExposureUsd > 0 ? "$75/hr over free window" : "$0 Demurrage"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Apple iPhone Titanium Showcase: Zero-Install WhatsApp Driver Pass */}
      <section id="driver-pass" className="py-24 px-6 max-w-6xl mx-auto border-t border-black/[0.08] dark:border-white/[0.10]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
              <Smartphone className="w-3.5 h-3.5" /> 100% DRIVER ADOPTION
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
              Drivers don&apos;t install apps. <br />
              They open WhatsApp.
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Dispatching requires zero training. A 1-click WhatsApp pass streams GPS telemetry through mobile Chrome, guides drivers directly to unloading docks, and lets them capture camera biltis with cryptographic timestamps.
            </p>

            <div className="space-y-3 pt-2 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  <strong>Zero App Store barrier:</strong> Works on any \$80 smartphone browser.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  <strong>Camera POD verification:</strong> Stamped physical receipts uploaded straight to Azure Blob.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  <strong>Fast invoice settlement:</strong> Cuts invoice settlement cycles from 28 days to 48 hours.
                </span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/driver-pass"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-neutral-800 transition-all shadow-md"
              >
                Experience Driver Mobile Pass <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* iPhone 16 Pro Titanium Chassis Frame */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-[290px] h-[580px] rounded-[50px] border-[5px] border-neutral-800 bg-[#000000] p-3.5 shadow-[0_24px_72px_-16px_rgba(0,0,0,0.5)]">
              {/* Dynamic Island */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black z-30 flex items-center justify-between px-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-800" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Screen Interior */}
              <div className="w-full h-full rounded-[38px] bg-[#121214] text-white p-4 flex flex-col justify-between overflow-hidden relative">
                <div className="pt-7 text-center">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">VOYAGE PASS</span>
                  <span className="text-xs font-bold text-white block mt-0.5">TRIP #TRP-DEL-MUM-892</span>
                  <span className="text-[9px] font-mono text-emerald-400">● LIVE DISPATCH EN ROUTE</span>
                </div>

                <div className="space-y-2.5 my-auto">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
                    <span className="text-[10px] text-neutral-400 block">Destination</span>
                    <span className="font-semibold block text-white text-xs">Bhiwandi Logistics Hub, Dock 4</span>
                    <span className="text-[10px] font-mono text-neutral-400">ETA: 45 min · Free Queue</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                    <span className="text-[10px] text-neutral-400 block">Consignment</span>
                    <span className="font-medium text-xs text-white">400 Cartons Automotive Electronics</span>
                    <span className="text-[10px] font-mono text-emerald-400 block">Temperature: 21.4°C (Normal)</span>
                  </div>
                </div>

                <div className="space-y-2 pb-2">
                  <Link
                    href="/driver-pass"
                    className="w-full py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    Snap Proof-of-Delivery <ArrowRight className="w-3 h-3" />
                  </Link>
                  <span className="text-[9px] text-neutral-500 text-center block font-mono">
                    Zero-Install WhatsApp Mobile Pass
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Apple Hardware Pro Specifications Matrix */}
      <section id="specs" className="py-24 px-6 max-w-6xl mx-auto border-t border-black/[0.08] dark:border-white/[0.10]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#0071E3] block mb-2">Enterprise Benchmarks</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Engineered to perfection.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-6 rounded-3xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E]">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-mono block">
              &lt; 45ms
            </span>
            <span className="text-xs text-neutral-500 mt-2 block font-medium">Global Dispatch Latency</span>
          </div>

          <div className="p-6 rounded-3xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E]">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-mono block">
              0 MB
            </span>
            <span className="text-xs text-neutral-500 mt-2 block font-medium">Driver Install Footprint</span>
          </div>

          <div className="p-6 rounded-3xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E]">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-mono block">
              120 min
            </span>
            <span className="text-xs text-neutral-500 mt-2 block font-medium">Geofence Detention Watch</span>
          </div>

          <div className="p-6 rounded-3xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E]">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono block">
              $0 Idle
            </span>
            <span className="text-xs text-neutral-500 mt-2 block font-medium">Azure Student Free Tier</span>
          </div>
        </div>
      </section>

      {/* 6. Apple Call to Action */}
      <section className="py-24 px-6 text-center border-t border-black/[0.08] dark:border-white/[0.10] bg-white dark:bg-[#0A0A0C]">
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Your fleet. <br />
            Elevated to pure certainty.
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            Sign in with Apple Passkey or launch the live console to experience real logistics certainty.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/overview"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs tracking-tight shadow-md shadow-[#0071E3]/25 transition-all"
            >
              Enter VOYAGE Workspace
            </Link>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-black/[0.12] dark:border-white/[0.16] bg-black/[0.03] dark:bg-white/[0.05] text-xs font-semibold hover:bg-black/[0.06] transition-all flex items-center justify-center gap-1.5"
            >
              <Fingerprint className="w-3.5 h-3.5 text-[#0071E3]" />
              Authorize with Passkey
            </button>
          </div>
        </div>
      </section>

      {/* 7. Apple Minimalist Footer */}
      <footer className="py-10 px-6 border-t border-black/[0.06] dark:border-white/[0.08] text-[11px] text-neutral-500 bg-[#F5F5F7] dark:bg-black">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">VOYAGE</span>
            <span>— The Autonomous Freight Operating System</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/overview" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Console</Link>
            <Link href="/driver-pass" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Driver Pass</Link>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Passkey Auth
            </button>
          </div>
        </div>
      </footer>

      {/* Apple Passkey Authentication Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[460px]"
            >
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border border-black/10 dark:border-white/10 flex items-center justify-center text-neutral-500 hover:text-black dark:hover:text-white shadow-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <AppleAuthCard onSuccess={() => setShowAuthModal(false)} isModal />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
