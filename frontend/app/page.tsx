"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Building2,
  AlertTriangle,
  Activity,
  Layers,
  ChevronRight,
  CheckCircle2,
  Lock,
  Clock,
  Compass,
  BarChart3,
  Sliders,
  Award,
  Globe2,
  ExternalLink,
  Shield,
  FileText,
  MapPin,
  RefreshCw,
  GitBranch,
  Terminal,
  Zap,
  Copy,
  Check,
  Cpu,
  Database,
  ArrowUpRight,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export default function LandingPage() {
  const { toast } = useToast();
  const [theme, setTheme] = React.useState<"day" | "night">("night");
  const [copiedCmd, setCopiedCmd] = React.useState(false);
  const [copiedPrompt, setCopiedPrompt] = React.useState(false);
  const [activeRecipe, setActiveRecipe] = React.useState<number>(0);

  // Initialize theme state from DOM
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "night" : "day");
    }
  }, []);

  const toggleTheme = (targetTheme: "day" | "night") => {
    setTheme(targetTheme);
    tactileAudio.playClick();
    if (targetTheme === "night") {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  };

  const handleCopy = (text: string, type: "cmd" | "prompt") => {
    navigator.clipboard.writeText(text);
    tactileAudio.playSuccess();
    if (type === "cmd") {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
      toast({
        title: "Telemetry Command Copied",
        message: "Live telemetry stream cURL command copied to clipboard.",
        type: "success",
      });
    } else {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
      toast({
        title: "Agent Dispatch Prompt Copied",
        message: "Logistics agent system prompt copied to clipboard.",
        type: "info",
      });
    }
  };

  const STREAM_CMD = "curl -fsSL https://api.nexus-logistics.io/v1/telemetry/stream | jq .";
  const AGENT_PROMPT =
    "Connect to Nexus OS (docs: https://nexus-logistics.io/llms.txt), stream active Corridor I-80 telematics, monitor dock capacities, and simulate detour trade-offs before committing reroutes.";

  const RECIPES = [
    {
      num: "RECIPE · FLAGSHIP",
      title: "Zero-Config Corridor Detour",
      code: "nexus simulate --corridor I-80 --avoid-blizzard",
      lead: "Computes mountain pass grade deltas, EV battery drain, and secondary hub turnaround in under 200ms without touching live fleet dispatch.",
      badge: "Determinism",
    },
    {
      num: "RECIPE · STOCHASTIC",
      title: "Monte Carlo Decision Lab",
      code: "nexus evaluate --iterations 5000 --confidence 95",
      lead: "Simulate 5,000 runs varying wind shear, fuel surges (+15%), and driver rest intervals to generate bounded P50/P90 delay distributions.",
      badge: "Predictive",
    },
    {
      num: "RECIPE · TERMINAL",
      title: "Cross-Dock Equilibrium",
      code: "nexus dock rebalance --hub ORD-01 --max-capacity 85%",
      lead: "Monitors active receiving bays and re-allocates inbound secondary freight to Aurora satellite terminals to preserve express cold-chain bays.",
      badge: "Real-Time",
    },
  ];

  const FEATURES = [
    {
      k: "Deterministic GIS Corridors",
      v: "Highways, mountain summits, and meteorological obstructions are indexed as deterministic graph edges—the engine returns an exact path and timestamp boundaries, not a speculative suggestion.",
    },
    {
      k: "Pharma Cold-Chain Telemetry",
      v: "Continuous -20°C to +4°C temperature envelopes sampled at 1-second intervals with fail-closed cryptographic telemetry records and automatic alert thresholds.",
    },
    {
      k: "Multi-Variate Monte Carlo",
      v: "Evaluate 1,000 to 10,000 iterations varying wind resistance, fuel surges, and driver hours-of-service before presenting human dispatchers with a verified P90 confidence window.",
    },
    {
      k: "Dynamic Dock Queue Equilibrium",
      v: "Gate turnaround times, driver detention windows, and cross-dock pallet staging managed in real time across primary and satellite logistics terminals.",
    },
    {
      k: "Zero-SDK REST & WebSocket API",
      v: "Standard HTTP calls on :8000 and streaming WebSocket telematics on /stream. Existing TMS platforms, Python automation agents, and dashboard clients connect unchanged.",
    },
    {
      k: "FastAPI + Next.js 15 Architecture",
      v: "One unified, ultra-responsive stack. Sub-second route calculations, PostgreSQL row-level multi-tenant partitioning, and Apple-grade fluid typography.",
    },
    {
      k: "Cryptographic Action Ledger",
      v: "SHA-256 hash-chained proof of human and automated dispatch approvals. Wins and losses logged transparently with immutable audit timestamps.",
    },
    {
      k: "Single Authority 2D Leaflet Map",
      v: "Robust GIS projection with absolute grid control: toggle coordinate lines completely off, inspect asset telemetry, and monitor corridors without WebGL crashes.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#0B0B0D] text-[#151B1A] dark:text-[#E8ECEB] flex flex-col font-sans transition-colors duration-300 selection:bg-amber-500/20 selection:text-amber-600">
      {/* ========================================================================= */}
      {/* APPLE + XERJ TOP NAVIGATION (Frosted Glass, Monospace Tracking & Day/Night) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 h-13 border-b border-black/[0.07] dark:border-white/[0.08] bg-[#FAFAF7]/80 dark:bg-[#0B0B0D]/80 backdrop-blur-2xl px-6 lg:px-16 flex items-center justify-between transition-colors">
        <Link href="/" className="flex items-center gap-2.5 group">
          <LogoMark size={22} />
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm font-bold tracking-tight text-[#151B1A] dark:text-white uppercase">
              Nexus
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">OS</span>
          </div>
        </Link>

        {/* Monospace Editorial Nav Links */}
        <nav
          className="hidden lg:flex items-center gap-7 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400"
          aria-label="Main Navigation"
        >
          <a href="#hero" className="hover:text-black dark:hover:text-white transition-colors">
            HOME
          </a>
          <a href="#telemetry" className="hover:text-black dark:hover:text-white transition-colors">
            TELEMETRY
          </a>
          <a href="#detours" className="hover:text-black dark:hover:text-white transition-colors">
            DETOURS
          </a>
          <a href="#planning" className="hover:text-black dark:hover:text-white transition-colors">
            PLANNING LAB
          </a>
          <a href="#features" className="hover:text-black dark:hover:text-white transition-colors">
            SPECIFICATION
          </a>
          <Link href="/live-world" className="hover:text-black dark:hover:text-white transition-colors">
            LIVE MAP
          </Link>
          <Link href="/simulations" className="hover:text-black dark:hover:text-white transition-colors">
            SCENARIOS
          </Link>
        </nav>

        {/* Action Controls & Day/Night Toggle */}
        <div className="flex items-center gap-3">
          {/* XERJ Style Day/Night Switcher */}
          <div className="flex items-center p-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800/80 border border-black/5 dark:border-white/10 text-[10px] font-mono font-bold tracking-wider">
            <button
              type="button"
              onClick={() => toggleTheme("day")}
              className={`px-2.5 py-1 rounded-full transition-all ${
                theme === "day"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
              }`}
            >
              DAY
            </button>
            <span className="text-stone-400 px-0.5">·</span>
            <button
              type="button"
              onClick={() => toggleTheme("night")}
              className={`px-2.5 py-1 rounded-full transition-all ${
                theme === "night"
                  ? "bg-[#1C1C21] text-amber-400 shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
              }`}
            >
              NIGHT
            </button>
          </div>

          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#151B1A] dark:bg-white text-white dark:text-[#151B1A] hover:opacity-90 shadow-tactile transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>WORKSPACE</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION — XERJ INSPIRED EDITORIAL TYPOGRAPHY & INTERACTIVE PROMPT CARD */}
        {/* ========================================================================= */}
        <section id="hero" className="relative pt-16 pb-20 px-6 lg:px-16 border-b border-stone-200 dark:border-stone-800/80 overflow-hidden">
          {/* Subtle Ambient Technical Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="max-w-4xl mx-auto w-full relative z-10 text-center">
            {/* Kicker Eyebrow */}
            <p className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-stone-500 dark:text-stone-400 mb-6">
              LOGISTICS OPERATING SYSTEM · DETERMINISTIC ROUTING · ZERO SENSATIONALISM
            </p>

            {/* Massive Editorial Display Title (XERJ Inspired Scale + Apple Contrast) */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.03em] uppercase leading-[0.94] text-stone-900 dark:text-white">
              EVERY SHIPMENT.<br />
              <span className="text-amber-500 dark:text-amber-400">ONE CLEARER PICTURE.</span>
            </h1>

            {/* Subtitle with Honest Product Definition */}
            <p className="mt-7 text-base sm:text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Nexus indexes your fleet telemetry, fulfillment hubs, and corridor weather in real time, then evaluates disruptions deterministically instead of guessing.
            </p>

            {/* ===================================================================== */}
            {/* THE COMMAND / PROMPT HERO STAGE (XERJ Dual Alternative Box) */}
            {/* ===================================================================== */}
            <div className="mt-12 max-w-2xl mx-auto text-left space-y-4">
              {/* Option A: Direct Stream Connection */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#121216] border-l-4 border-l-amber-500 border border-stone-200/90 dark:border-stone-800 shadow-tactile transition-all hover:border-amber-500/60">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider uppercase text-stone-400 dark:text-stone-500 mb-2.5">
                  <span>STREAM · ONE LINE · REAL-TIME WEBSOCKET & REST</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">TLS VERIFIED ✓</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 dark:bg-[#0B0B0D] p-3 rounded-xl border border-stone-200/60 dark:border-stone-800/80">
                  <code className="font-mono text-xs text-stone-800 dark:text-stone-200 select-all overflow-x-auto">
                    {STREAM_CMD}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(STREAM_CMD, "cmd")}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[11px] font-mono font-bold tracking-wider hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-center"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCmd ? "COPIED" : "COPY"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                  Linux, macOS, and Windows. Speaks standard JSONL. Zero SDK required.
                </p>
              </div>

              {/* Option B: Coding / Automation Agent Prompt */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#121216] border-l-4 border-l-stone-400 dark:border-l-stone-600 border border-stone-200/90 dark:border-stone-800 shadow-tactile transition-all hover:border-stone-400">
                <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-400 dark:text-stone-500 mb-2.5">
                  OR HAND THIS TO YOUR LOGISTICS AGENT / MCP CLIENT
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#0B0B0D] border border-stone-200/60 dark:border-stone-800/80">
                  <code className="font-mono text-xs text-stone-700 dark:text-stone-300 block leading-relaxed select-all">
                    {AGENT_PROMPT}
                  </code>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-[11px] font-mono text-stone-400">
                    Supports Claude, OpenAI, Antigravity, and MCP tools
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(AGENT_PROMPT, "prompt")}
                    className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 text-[11px] font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPrompt ? "PROMPT COPIED" : "COPY THE PROMPT"}
                  </button>
                </div>
              </div>
            </div>

            {/* Proof Sub-line */}
            <p className="mt-8 text-xs font-mono text-stone-500 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
              Autonomous reroutes evaluated on deterministic corridors reduced delay propagation by{" "}
              <strong className="text-stone-900 dark:text-white font-bold">3.2×</strong>. Every metric verified on the{" "}
              <Link href="/admin/audit" className="underline hover:text-amber-500 text-stone-700 dark:text-stone-300">
                cryptographic audit ledger
              </Link>.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SCENE 01 — REAL-TIME TELEMETRICS (XERJ Numbered Architecture) */}
        {/* ========================================================================= */}
        <section id="telemetry" className="py-20 px-6 lg:px-16 border-b border-stone-200 dark:border-stone-800/80 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
            <span className="text-amber-500 font-black text-sm">01</span>
            <span>·</span>
            <span>REAL-TIME TELEMETRICS · LIVE CORRIDORS & EV FLEET ENVELOPE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-stone-900 dark:text-white leading-[1.05]">
            EVERY COMMERCIAL HAULER.<br />
            <span className="text-amber-500 dark:text-amber-400">ZERO TELEMETRY BLIND SPOTS.</span>
          </h2>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            <p>
              Traditional telematics report raw GPS coordinates without context. When a vehicle runs behind schedule on a mountain pass, dispatchers have no way to know whether the delay is driver fatigue, high-cube wind resistance, or battery thermal throttling.
            </p>
            <p>
              Nexus binds physical engine state, battery SoC, cargo reefer temperature, and highway topography into a unified living telemetry graph. You know the exact status of each haul before dispatch commits an intervention.
            </p>
          </div>

          {/* Authentic Real-Time Telemetry Terminal Box */}
          <div className="mt-8 p-5 rounded-2xl bg-stone-900 text-stone-100 font-mono text-xs border border-stone-800 shadow-tactile-lg overflow-x-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800 text-[10px] text-stone-400 tracking-wider uppercase">
              <span>$ nexus telemetry inspect NX-104 --live</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE SOCKET CONNECTED
              </span>
            </div>
            <pre className="text-stone-300 leading-relaxed font-mono">
              <span className="text-stone-500">[2026-10-18T20:00:00Z]</span> <span className="text-amber-400 font-bold">vehicle:</span> NX-104 (Freightliner eCascadia) · <span className="text-amber-400 font-bold">driver:</span> Rajesh Sharma{"\n"}
              <span className="text-stone-500">corridor:</span> I-80 Mountain Pass (Mile 342) · <span className="text-emerald-400 font-bold">SoC:</span> 74.2% · <span className="text-stone-200">speed:</span> 68.5 km/h{"\n"}
              <span className="text-stone-500">payload:</span> 17,800 kg · <span className="text-cyan-400">cargo_temp:</span> -4.2°C (nominal) · <span className="text-stone-400">psi:</span> 105 nominal{"\n"}
              <span className="text-stone-500">status:</span> <span className="text-amber-300 font-bold">IN_TRANSIT</span> · <span className="text-stone-400">next_checkpoint:</span> Cheyenne Hub Bay 04 (ETA 18:42 CST)
            </pre>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs font-mono text-stone-500">
            <Link href="/operations" className="underline hover:text-amber-500">
              INSPECT LIVE COMMERCIAL FLEET TELEMETRY →
            </Link>
            <span>Sub-second SSE stream verified</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SCENE 02 — DETERMINISTIC DETOURS & GROUND-TRUTH TICKER */}
        {/* ========================================================================= */}
        <section id="detours" className="py-20 px-6 lg:px-16 border-b border-stone-200 dark:border-stone-800/80 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
            <span className="text-amber-500 font-black text-sm">02</span>
            <span>·</span>
            <span>DETERMINISTIC DETOURS · BLIZZARDS & BOTTLENECKS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-stone-900 dark:text-white leading-[1.05]">
            PREDICT DELAYS.<br />
            <span className="text-amber-500 dark:text-amber-400">BEFORE THEY CASCADE.</span>
          </h2>

          <p className="mt-6 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            A single highway blizzard never stays isolated. A 40-minute delay on an interstate summit delays receiving bays at destination superhubs, cascades into missed cross-dock feeder connections, and triggers contractual SLA penalty clauses. Nexus computes bypasses before the vehicle reaches the bottleneck.
          </p>

          {/* XERJ-Style Ground-Truth Ticker */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#121216] border border-stone-200 dark:border-stone-800 shadow-tactile space-y-2">
              <div className="text-[10px] font-mono uppercase font-bold text-stone-400 tracking-wider">
                GROUND-TRUTH FLEET EXAM
              </div>
              <div className="text-3xl font-black font-mono text-stone-900 dark:text-white">
                <span className="text-amber-500">42/42</span> ASSETS
              </div>
              <p className="text-[11px] font-mono text-stone-500 leading-normal">
                100% telemetry synced across commercial haulers · zero unmonitored dead-drops
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#121216] border border-stone-200 dark:border-stone-800 shadow-tactile space-y-2">
              <div className="text-[10px] font-mono uppercase font-bold text-stone-400 tracking-wider">
                I-80 BLIZZARD AVOIDANCE
              </div>
              <div className="text-3xl font-black font-mono text-stone-900 dark:text-white">
                <span className="text-amber-500">-112</span> MINS
              </div>
              <p className="text-[11px] font-mono text-stone-500 leading-normal">
                Deterministic detour via I-70 South calculated before mountain obstruction
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#121216] border border-stone-200 dark:border-stone-800 shadow-tactile space-y-2">
              <div className="text-[10px] font-mono uppercase font-bold text-stone-400 tracking-wider">
                SLA BREACH LIABILITY
              </div>
              <div className="text-3xl font-black font-mono text-stone-900 dark:text-white">
                <span className="text-emerald-500">$4,200</span> SAVED
              </div>
              <p className="text-[11px] font-mono text-stone-500 leading-normal">
                Preserved delivery guarantees across 14 high-value retail consignments
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs font-mono text-stone-500">
            <Link href="/incidents" className="underline hover:text-amber-500">
              REVIEW OPERATIONAL EXCEPTIONS QUEUE →
            </Link>
            <span>Verified against NOAA Weather & DOT feeds</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SCENE 03 — PLANNING LAB & RECIPES (XERJ 3-Recipe Grid) */}
        {/* ========================================================================= */}
        <section id="planning" className="py-20 px-6 lg:px-16 border-b border-stone-200 dark:border-stone-800/80 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
            <span className="text-amber-500 font-black text-sm">03</span>
            <span>·</span>
            <span>PLANNING LAB · STOCHASTIC MONTE CARLO ENGINE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-stone-900 dark:text-white leading-[1.05]">
            ONE DECISION.<br />
            <span className="text-amber-500 dark:text-amber-400">ZERO DISPATCH IMPACT UNTIL COMMITTED.</span>
          </h2>

          <p className="mt-6 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            Never guess secondary costs. The Planning Lab runs isolated what-if scenarios comparing baseline routes against detours, evaluating net time saved versus fuel surcharges. Applying a decision requires deliberate human confirmation.
          </p>

          {/* XERJ Style Recipe Cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {RECIPES.map((r, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-[#121216] border border-stone-200 dark:border-stone-800 shadow-tactile flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider text-amber-600 dark:text-amber-400">
                    <span>{r.num}</span>
                    <Badge variant="outline" size="sm" className="text-[9px]">
                      {r.badge}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white tracking-tight">
                    {r.title}
                  </h3>
                  <code className="text-[11px] font-mono text-stone-700 dark:text-stone-300 p-2 rounded bg-stone-100 dark:bg-stone-900 block overflow-x-auto">
                    {r.code}
                  </code>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    {r.lead}
                  </p>
                </div>

                <Link
                  href="/simulations"
                  className="pt-2 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1 hover:text-amber-500 transition-colors"
                >
                  <span>EVALUATE SCENARIO</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SCENE 04 — FEATURE BY FEATURE TABLE (XERJ 2-Column Specs) */}
        {/* ========================================================================= */}
        <section id="features" className="py-20 px-6 lg:px-16 border-b border-stone-200 dark:border-stone-800/80 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
            <span className="text-amber-500 font-black text-sm">04</span>
            <span>·</span>
            <span>TECHNICAL SPECIFICATION · WHAT YOU ACTUALLY GET</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-stone-900 dark:text-white leading-[1.05]">
            FEATURE<br />
            <span className="text-amber-500 dark:text-amber-400">BY FEATURE.</span>
          </h2>

          <p className="mt-6 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            Every capability exists to eliminate the thing logistics operators actually lose: operational certainty. No theatrical confidence scores, no black-box automation without human override.
          </p>

          {/* XERJ Style Key / Value Table Rows */}
          <div className="mt-10 divide-y divide-stone-200 dark:divide-stone-800 border-t border-b border-stone-200 dark:border-stone-800 font-mono text-xs">
            {FEATURES.map((item, idx) => (
              <div key={idx} className="py-4.5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 items-baseline">
                <div className="md:col-span-4 font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span className="text-amber-500 font-normal">›</span>
                  <span>{item.k}</span>
                </div>
                <div className="md:col-span-8 text-stone-600 dark:text-stone-400 font-sans text-xs sm:text-sm leading-relaxed">
                  {item.v}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* BIG ACTION CTA (XERJ Single Arrow Button) */}
        {/* ========================================================================= */}
        <section className="py-16 px-6 lg:px-16 text-center max-w-2xl mx-auto space-y-6">
          <Link
            href="/login"
            className="w-full py-5 px-8 rounded-2xl bg-[#151B1A] dark:bg-white text-white dark:text-[#151B1A] font-mono text-sm font-bold tracking-wider uppercase hover:opacity-95 shadow-tactile-lg transition-all flex items-center justify-between group active:scale-[0.99]"
          >
            <span>ENTER LOGISTICS WORKSPACE</span>
            <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <p className="text-xs font-mono text-stone-400">
            Self-hosted, cloud-native, or enterprise managed. Ready in minutes.
          </p>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* SITEMAP & FOOTER (XERJ 4-Column Structured Map + Apple Restraint) */}
      {/* ========================================================================= */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-[#FAFAF7] dark:bg-[#0B0B0D] px-6 lg:px-16 pt-14 pb-12 text-xs font-mono">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-stone-200 dark:border-stone-800/80">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
              OPERATIONS
            </span>
            <ul className="space-y-2 text-stone-600 dark:text-stone-400">
              <li><Link href="/overview" className="hover:text-amber-500">Overview HUD</Link></li>
              <li><Link href="/operations" className="hover:text-amber-500">Fleet Assets</Link></li>
              <li><Link href="/operations/orders" className="hover:text-amber-500">Shipments Manifest</Link></li>
              <li><Link href="/live-world" className="hover:text-amber-500">Live 2D GIS Map</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
              PLANNING
            </span>
            <ul className="space-y-2 text-stone-600 dark:text-stone-400">
              <li><Link href="/simulations" className="hover:text-amber-500">Planning Lab</Link></li>
              <li><Link href="/simulations/new" className="hover:text-amber-500">Stochastic Runs</Link></li>
              <li><Link href="/incidents" className="hover:text-amber-500">Exceptions Queue</Link></li>
              <li><Link href="/analytics" className="hover:text-amber-500">Corridor Analytics</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
              DEVELOPERS
            </span>
            <ul className="space-y-2 text-stone-600 dark:text-stone-400">
              <li><Link href="/status" className="hover:text-amber-500">API Health Status</Link></li>
              <li><Link href="/import-data" className="hover:text-amber-500">CSV & Telemetry Ingest</Link></li>
              <li><Link href="/driver-pass" className="hover:text-amber-500">Driver Beacon Pass</Link></li>
              <li><a href="https://github.com/AadityaUniyal/Nexus" target="_blank" rel="noreferrer" className="hover:text-amber-500">GitHub Repository</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
              GOVERNANCE
            </span>
            <ul className="space-y-2 text-stone-600 dark:text-stone-400">
              <li><Link href="/admin/audit" className="hover:text-amber-500">Cryptographic Ledger</Link></li>
              <li><Link href="/settings" className="hover:text-amber-500">Workspace Settings</Link></li>
              <li><Link href="/admin/roles" className="hover:text-amber-500">Access Control & RBAC</Link></li>
              <li><Link href="/environment" className="hover:text-amber-500">Environment Verification</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>NEXUS.OS · V2.4.0-RC · 2026</span>
          </div>
          <div className="text-center sm:text-right">
            <span>DETERMINISTIC LOGISTICS · TRUTH OVER THEATRE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
