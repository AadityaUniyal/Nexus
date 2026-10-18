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
  CheckCircle2,
  Clock,
  Compass,
  BarChart3,
  Sliders,
  Globe2,
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
  Snowflake,
  Fuel,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export default function LandingPage() {
  const { toast } = useToast();
  const [theme, setTheme] = React.useState<"day" | "night">("night");

  // Hero interactive console tab
  const [activeHeroTab, setActiveHeroTab] = React.useState<
    "telemetry" | "disruption" | "dock" | "simulation"
  >("telemetry");

  // Telemetry section vehicle selector
  const [selectedVehicle, setSelectedVehicle] = React.useState<number>(0);

  // Disruption section mode toggle (Unmanaged vs Nexus Detour)
  const [disruptionMode, setDisruptionMode] = React.useState<"unmanaged" | "nexus">("nexus");

  // Stochastic scenario selector
  const [activeScenario, setActiveScenario] = React.useState<number>(0);

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

  // Fleet assets data for Section 01
  const FLEET_ASSETS = [
    {
      id: "NX-104",
      model: "Freightliner eCascadia",
      type: "Pharma Cold-Chain Reefer",
      driver: "Rajesh Sharma",
      soc: 74,
      speed: 68,
      cargoTemp: "-4.2°C",
      tempStatus: "NOMINAL ENVELOPE",
      psi: 105,
      hosRemaining: "05h 42m",
      corridor: "I-80 Mountain Pass (Mile 342)",
      destination: "Cheyenne Terminal Bay 04",
      eta: "18:42 CST",
      status: "IN TRANSIT · ON SCHEDULE",
    },
    {
      id: "NX-218",
      model: "Volvo VNR Electric",
      type: "Interstate Dry Van",
      driver: "Sarah Jenkins",
      soc: 82,
      speed: 72,
      cargoTemp: "+19.0°C",
      tempStatus: "AMBIENT DRY",
      psi: 108,
      hosRemaining: "07h 15m",
      corridor: "I-70 Southbound Bypass (Mile 190)",
      destination: "Denver Cross-Dock Bay 12",
      eta: "19:10 CST",
      status: "IN TRANSIT · DETOUR ACTIVE",
    },
    {
      id: "NX-309",
      model: "Peterbilt 579EV",
      type: "Specialized Hazmat Trailer",
      driver: "Marcus Thorne",
      soc: 61,
      speed: 64,
      cargoTemp: "+4.0°C",
      tempStatus: "TEMPERATURE CONTROLLED",
      psi: 104,
      hosRemaining: "03h 50m",
      corridor: "I-90 Eastbound Transit (Mile 84)",
      destination: "Chicago ORD-01 Primary Hub",
      eta: "20:30 CST",
      status: "HOLDING · BAY REBALANCED",
    },
  ];

  // Scenarios data for Section 03
  const SCENARIOS = [
    {
      id: "SCN-01",
      title: "Donner Pass Summit Blizzard Bypass",
      corridor: "Corridor I-80 → I-70 South Detour",
      riskLevel: "HIGH PRECIPITATION",
      confidence: "95% (5,000 runs)",
      delayDelta: "-112 mins saved",
      fuelDelta: "+$142 fuel / charging",
      slaPenaltyAvoided: "$4,200",
      description:
        "Deterministic bypass routing 18 commercial haulers through I-70 before severe blizzard closes Donner Pass summit.",
    },
    {
      id: "SCN-02",
      title: "Chicago Superhub Cross-Dock Rebalance",
      corridor: "ORD-01 Primary → Aurora Satellite Hub",
      riskLevel: "TERMINAL CONGESTION",
      confidence: "98% (3,500 runs)",
      delayDelta: "-45 mins gate turnaround",
      fuelDelta: "-$28 drayage delta",
      slaPenaltyAvoided: "$6,800",
      description:
        "Re-allocates 6 inbound non-refrigerated trailers to satellite cross-dock, preserving express pharmaceutical receiving bays.",
    },
    {
      id: "SCN-03",
      title: "EV Mountain Grade Energy Recovery",
      corridor: "Rockies Descent · Elevation Profile",
      riskLevel: "BATTERY THERMAL STRESS",
      confidence: "92% (4,000 runs)",
      delayDelta: "+8 mins controlled descent",
      fuelDelta: "+18% battery regen",
      slaPenaltyAvoided: "$1,100 (Battery cycle)",
      description:
        "Calculates optimal descent speed and regenerative braking curve down 6% highway grades to prevent battery thermal throttling.",
    },
  ];

  // Technical specifications data for Section 04
  const SPECIFICATIONS = [
    {
      k: "Deterministic GIS Corridors",
      v: "Highways, mountain passes, and meteorological disruptions are indexed as deterministic graph edges with exact elevation profiles. The engine computes verified route bounds without speculative AI hallucinations.",
    },
    {
      k: "Pharma Cold-Chain Telemetry",
      v: "Continuous -20°C to +4°C temperature envelopes sampled at 1-second intervals with fail-closed cryptographic logging and automated dispatch warning thresholds.",
    },
    {
      k: "Multi-Variate Monte Carlo Engine",
      v: "Evaluates 1,000 to 10,000 stochastic runs varying headwinds, elevation grades, fuel surcharges, and driver rest intervals to generate mathematically verified P50 and P90 confidence envelopes.",
    },
    {
      k: "Dynamic Dock Queue Equilibrium",
      v: "Monitors gate turnaround times, driver detention windows, and cross-dock pallet staging in real time across primary and satellite logistics terminals to prevent receiving bay saturation.",
    },
    {
      k: "Sub-Second SSE Telemetry Stream",
      v: "High-throughput Server-Sent Events deliver live telematics to dispatch consoles and enterprise TMS systems with zero SDK overhead and sub-200ms latency.",
    },
    {
      k: "FastAPI + Next.js 15 Architecture",
      v: "Unified, ultra-responsive engineering stack. Sub-second route evaluations, PostgreSQL row-level multi-tenant partitioning, and Apple-grade fluid typography.",
    },
    {
      k: "Cryptographic Action Ledger",
      v: "SHA-256 hash-chained proof of every human dispatcher approval and automated reroute intervention. Audit logs are tamper-evident and permanently verifiable.",
    },
    {
      k: "Single Authority 2D Leaflet GIS Map",
      v: "Robust GIS projection with absolute coordinate precision: inspect asset telematics, toggle corridor weather overlays, and monitor fleet breadcrumbs without WebGL crashes.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F4EE] dark:bg-[#0B0B0D] text-[#11120F] dark:text-[#F4F2EC] flex flex-col font-sans transition-colors duration-500 selection:bg-amber-500/20 selection:text-amber-600">
      {/* ========================================================================= */}
      {/* APPLE + XERJ TOP NAVIGATION (Frosted Glass, Monospace Tracking & Day/Night) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 h-14 border-b border-[#CFCBBF] dark:border-[#3A3836] bg-[#F6F4EE]/85 dark:bg-[#0B0B0D]/85 backdrop-blur-2xl px-6 lg:px-16 flex items-center justify-between transition-colors duration-500">
        <Link href="/" className="flex items-center gap-2.5 group">
          <LogoMark size={22} />
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm font-bold tracking-tight text-[#11120F] dark:text-white uppercase">
              Nexus
            </span>
            <span className="text-[10px] text-[#7F5200] dark:text-[#FFC400] font-bold">OS</span>
          </div>
        </Link>

        {/* Monospace Editorial Nav Links with Apple Hover Transitions */}
        <nav
          className="hidden lg:flex items-center gap-7 text-[11px] font-mono font-medium uppercase tracking-[0.14em] text-[#696762] dark:text-[#8A8680]"
          aria-label="Main Navigation"
        >
          <a
            href="#hero"
            className="hover:text-[#11120F] dark:hover:text-white transition-colors duration-200"
          >
            OVERVIEW
          </a>
          <a
            href="#telemetry"
            className="hover:text-[#11120F] dark:hover:text-white transition-colors duration-200"
          >
            FLEET TELEMETRY
          </a>
          <a
            href="#disruptions"
            className="hover:text-[#11120F] dark:hover:text-white transition-colors duration-200"
          >
            DISRUPTIONS
          </a>
          <a
            href="#planning"
            className="hover:text-[#11120F] dark:hover:text-white transition-colors duration-200"
          >
            PLANNING LAB
          </a>
          <a
            href="#specifications"
            className="hover:text-[#11120F] dark:hover:text-white transition-colors duration-200"
          >
            SPECIFICATIONS
          </a>
          <Link
            href="/live-world"
            className="hover:text-[#11120F] dark:hover:text-white transition-colors duration-200"
          >
            LIVE MAP
          </Link>
        </nav>

        {/* Action Controls & Apple-Smooth Day/Night Pill */}
        <div className="flex items-center gap-3">
          {/* Day/Night Segmented Pill with Apple Sliding Indicator */}
          <div className="relative flex items-center p-0.5 rounded-full bg-[#EBE7DE] dark:bg-[#1C1C22] border border-[#CFCBBF] dark:border-[#3A3836] text-[10px] font-mono font-bold tracking-wider">
            <button
              type="button"
              onClick={() => toggleTheme("day")}
              className={`relative z-10 px-3 py-1 rounded-full transition-colors duration-200 ${
                theme === "day"
                  ? "text-[#11120F]"
                  : "text-[#696762] hover:text-[#11120F] dark:text-[#8A8680] dark:hover:text-white"
              }`}
            >
              DAY
            </button>
            <button
              type="button"
              onClick={() => toggleTheme("night")}
              className={`relative z-10 px-3 py-1 rounded-full transition-colors duration-200 ${
                theme === "night"
                  ? "text-[#FFC400]"
                  : "text-[#696762] hover:text-[#11120F] dark:text-[#8A8680] dark:hover:text-white"
              }`}
            >
              NIGHT
            </button>
            {/* Apple Smooth Sliding Pill */}
            <motion.div
              layoutId="themePillIndicator"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className={`absolute top-0.5 bottom-0.5 rounded-full ${
                theme === "day"
                  ? "left-0.5 w-[calc(50%-2px)] bg-white shadow-xs"
                  : "left-[50%] w-[calc(50%-2px)] bg-[#0B0B0D] shadow-xs"
              }`}
            />
          </div>

          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-[#11120F] dark:bg-[#F4F2EC] text-white dark:text-[#0B0B0D] hover:opacity-95 shadow-sm transition-all duration-200 flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>WORKSPACE</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION — EDITORIAL TYPOGRAPHY & INTERACTIVE LOGISTICS STAGE */}
        {/* ========================================================================= */}
        <section
          id="hero"
          className="relative pt-16 pb-20 px-6 lg:px-16 border-b border-[#CFCBBF] dark:border-[#3A3836] overflow-hidden"
        >
          {/* Subtle Ambient Technical Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.045] bg-[radial-gradient(#11120F_1px,transparent_1px)] dark:bg-[radial-gradient(#F4F2EC_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="max-w-4xl mx-auto w-full relative z-10 text-center">
            {/* Kicker Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono text-[11px] font-bold tracking-[0.22em] uppercase text-[#696762] dark:text-[#8A8680] mb-6"
            >
              NEXUS LOGISTICS OS · DETERMINISTIC CORRIDOR INTELLIGENCE
            </motion.p>

            {/* Editorial Display Title */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.035em] uppercase leading-[0.93] text-[#11120F] dark:text-white"
            >
              EVERY COMMERCIAL HAUL.<br />
              <span className="text-[#7F5200] dark:text-[#FFC400]">ONE LIVING PICTURE.</span>
            </motion.h1>

            {/* Subtitle with Honest Logistics OS Definition */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 text-base sm:text-xl text-[#696762] dark:text-[#8A8680] max-w-2xl mx-auto leading-relaxed font-normal"
            >
              Nexus binds commercial fleet GPS, highway blizzard corridors, and cross-dock terminal capacity into a unified operational graph. When disruptions strike, bypasses are calculated deterministically before delays cascade.
            </motion.p>

            {/* ===================================================================== */}
            {/* THE INTERACTIVE LOGISTICS COMMAND STAGE (Apple Segmented Console) */}
            {/* ===================================================================== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 max-w-3xl mx-auto text-left"
            >
              {/* Apple-Style Segmented Tab Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#EBE7DE] dark:bg-[#16161A] border border-[#CFCBBF] dark:border-[#3A3836] overflow-x-auto">
                {[
                  { id: "telemetry", label: "Fleet Telemetry", badge: "Live SSE" },
                  { id: "disruption", label: "Disruption Cascade", badge: "I-80 Alert" },
                  { id: "dock", label: "Terminal Rebalance", badge: "ORD-01" },
                  { id: "simulation", label: "Stochastic Lab", badge: "5,000 Runs" },
                ].map((tab) => {
                  const isActive = activeHeroTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        tactileAudio.playClick();
                        setActiveHeroTab(tab.id as any);
                      }}
                      className={`relative z-10 flex-1 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                        isActive
                          ? "text-[#11120F] dark:text-white"
                          : "text-[#696762] hover:text-[#11120F] dark:text-[#8A8680] dark:hover:text-white"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? "bg-[#7F5200]/15 dark:bg-[#FFC400]/20 text-[#7F5200] dark:text-[#FFC400]"
                            : "bg-black/5 dark:bg-white/5 text-[#696762] dark:text-[#8A8680]"
                        }`}
                      >
                        {tab.badge}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="heroTabIndicator"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          className="absolute inset-0 bg-white dark:bg-[#0B0B0D] rounded-xl shadow-sm -z-10 border border-[#CFCBBF]/60 dark:border-[#3A3836]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Console Screen Box with Apple Spring Dissolve */}
              <div className="mt-3.5 p-6 rounded-2xl bg-white dark:bg-[#121216] border border-[#CFCBBF] dark:border-[#3A3836] shadow-sm transition-all duration-300">
                <AnimatePresence mode="wait">
                  {activeHeroTab === "telemetry" && (
                    <motion.div
                      key="telemetry"
                      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#CFCBBF]/60 dark:border-[#3A3836] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-bold text-[#11120F] dark:text-white">
                            NX-104 · Freightliner eCascadia
                          </span>
                          <span className="text-[#696762] dark:text-[#8A8680]">
                            (Continental Cold-Chain Express)
                          </span>
                        </div>
                        <span className="text-[#7F5200] dark:text-[#FFC400] font-bold">
                          SSE STREAM ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            Battery SoC
                          </div>
                          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            74.2%
                          </div>
                          <div className="text-[10px] text-[#696762] dark:text-[#8A8680] mt-0.5">
                            280 km range
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            Reefer Temp
                          </div>
                          <div className="text-xl font-bold text-[#11120F] dark:text-white mt-1">
                            -4.2°C
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Nominal Pharma
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            Ground Speed
                          </div>
                          <div className="text-xl font-bold text-[#11120F] dark:text-white mt-1">
                            68 km/h
                          </div>
                          <div className="text-[10px] text-[#696762] dark:text-[#8A8680] mt-0.5">
                            I-80 Mile 342
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            HOS Remaining
                          </div>
                          <div className="text-xl font-bold text-[#11120F] dark:text-white mt-1">
                            05h 42m
                          </div>
                          <div className="text-[10px] text-[#696762] dark:text-[#8A8680] mt-0.5">
                            Driver Compliant
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-[#696762] dark:text-[#8A8680] pt-1">
                        <span>Checkpoint: Cheyenne Hub Bay 04 · ETA 18:42 CST</span>
                        <Link
                          href="/operations"
                          className="text-[#7F5200] dark:text-[#FFC400] font-bold hover:underline flex items-center gap-1 mt-2 sm:mt-0"
                        >
                          <span>Open Full Telematics Feed</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  )}

                  {activeHeroTab === "disruption" && (
                    <motion.div
                      key="disruption"
                      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#CFCBBF]/60 dark:border-[#3A3836] pb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="font-bold text-[#11120F] dark:text-white">
                            INC-8921 · I-80 Donner Pass Summit Blizzard
                          </span>
                        </div>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          CASCADE DETECTED
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            Without Intervention
                          </div>
                          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                            +180 min
                          </div>
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                            Summit closure trap
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            Nexus Detour (I-70)
                          </div>
                          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            -112 min
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Preserved schedule
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            SLA Liability Saved
                          </div>
                          <div className="text-xl font-bold text-[#7F5200] dark:text-[#FFC400] mt-1">
                            $4,200
                          </div>
                          <div className="text-[10px] text-[#696762] dark:text-[#8A8680] mt-0.5">
                            14 critical orders
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-[#696762] dark:text-[#8A8680] pt-1">
                        <span>Alternate Corridor: I-70 Southbound Bypass clear with 0 snow cover</span>
                        <Link
                          href="/incidents"
                          className="text-[#7F5200] dark:text-[#FFC400] font-bold hover:underline flex items-center gap-1 mt-2 sm:mt-0"
                        >
                          <span>Review Exceptions Queue</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  )}

                  {activeHeroTab === "dock" && (
                    <motion.div
                      key="dock"
                      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#CFCBBF]/60 dark:border-[#3A3836] pb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#7F5200] dark:text-[#FFC400]" />
                          <span className="font-bold text-[#11120F] dark:text-white">
                            ORD-01 Chicago Superhub · Dynamic Bay Equilibrium
                          </span>
                        </div>
                        <span className="text-[#7F5200] dark:text-[#FFC400] font-bold">
                          REBALANCED
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            Primary ORD-01 Load
                          </div>
                          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                            94% → 78%
                          </div>
                          <div className="text-[10px] text-[#696762] dark:text-[#8A8680] mt-0.5">
                            Gate bottleneck relieved
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            Aurora Satellite Transfer
                          </div>
                          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            6 Inbound
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Dry van re-allocation
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            Cold-Chain Receiving
                          </div>
                          <div className="text-xl font-bold text-[#11120F] dark:text-white mt-1">
                            100% Bay 04
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Priority preserved
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-[#696762] dark:text-[#8A8680] pt-1">
                        <span>Gate Turnaround Time reduced by 34 minutes per hauler</span>
                        <Link
                          href="/operations/orders"
                          className="text-[#7F5200] dark:text-[#FFC400] font-bold hover:underline flex items-center gap-1 mt-2 sm:mt-0"
                        >
                          <span>Inspect Shipments Manifest</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  )}

                  {activeHeroTab === "simulation" && (
                    <motion.div
                      key="simulation"
                      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#CFCBBF]/60 dark:border-[#3A3836] pb-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-[#7F5200] dark:text-[#FFC400]" />
                          <span className="font-bold text-[#11120F] dark:text-white">
                            Monte Carlo Decision Lab · 5,000 Stochastic Iterations
                          </span>
                        </div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          95% CONFIDENCE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            P50 Arrival Window
                          </div>
                          <div className="text-xl font-bold text-[#11120F] dark:text-white mt-1">
                            18:42 CST
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Median expectation
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            P90 Risk Boundary
                          </div>
                          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                            19:15 CST
                          </div>
                          <div className="text-[10px] text-[#696762] dark:text-[#8A8680] mt-0.5">
                            Worst-case headwind
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                          <div className="text-[10px] uppercase text-[#696762] dark:text-[#8A8680]">
                            Net Economic Delta
                          </div>
                          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            +$4,058
                          </div>
                          <div className="text-[10px] text-[#696762] dark:text-[#8A8680] mt-0.5">
                            SLA savings net of fuel
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-[#696762] dark:text-[#8A8680] pt-1">
                        <span>Human Dispatcher Authorization Gate Required before commit</span>
                        <Link
                          href="/simulations"
                          className="text-[#7F5200] dark:text-[#FFC400] font-bold hover:underline flex items-center gap-1 mt-2 sm:mt-0"
                        >
                          <span>Launch Simulation Studio</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Primary Call to Action Bar */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#11120F] dark:bg-white text-white dark:text-[#0B0B0D] font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>LAUNCH OPERATIONAL WORKSPACE</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/live-world"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-[#CFCBBF] dark:border-[#3A3836] hover:bg-black/5 dark:hover:bg-white/5 text-[#11120F] dark:text-white font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#7F5200] dark:text-[#FFC400]" />
                  <span>VIEW LIVE CORRIDOR MAP</span>
                </Link>
              </div>

              {/* Verified Metrics Strip */}
              <div className="mt-10 pt-6 border-t border-[#CFCBBF]/70 dark:border-[#3A3836] grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#11120F] dark:text-white">
                    42/42
                  </div>
                  <div className="text-[10px] text-[#696762] dark:text-[#8A8680] uppercase tracking-wider mt-0.5">
                    FLEET ASSETS SYNCED
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#7F5200] dark:text-[#FFC400]">
                    3.2×
                  </div>
                  <div className="text-[10px] text-[#696762] dark:text-[#8A8680] uppercase tracking-wider mt-0.5">
                    DELAY MITIGATION
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    &lt; 200ms
                  </div>
                  <div className="text-[10px] text-[#696762] dark:text-[#8A8680] uppercase tracking-wider mt-0.5">
                    DETOUR CALCULATION
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#11120F] dark:text-white">
                    SHA-256
                  </div>
                  <div className="text-[10px] text-[#696762] dark:text-[#8A8680] uppercase tracking-wider mt-0.5">
                    CRYPTOGRAPHIC AUDIT
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 01 — REAL-TIME FLEET TELEMETRICS (Interactive Hauler Explorer) */}
        {/* ========================================================================= */}
        <section
          id="telemetry"
          className="py-20 px-6 lg:px-16 border-b border-[#CFCBBF] dark:border-[#3A3836] max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#696762] dark:text-[#8A8680] uppercase tracking-widest mb-3">
            <span className="text-[#7F5200] dark:text-[#FFC400] font-black text-sm">01</span>
            <span>·</span>
            <span>LIVING CORRIDOR TELEMETRICS · COMMERCIAL ASSET ENVELOPE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#11120F] dark:text-white leading-[1.05]">
            CONTINUOUS TELEMATICS.<br />
            <span className="text-[#7F5200] dark:text-[#FFC400]">ZERO BLIND SPOTS.</span>
          </h2>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm sm:text-base text-[#696762] dark:text-[#8A8680] leading-relaxed font-normal">
            <p>
              Traditional telematics report raw GPS pins without operational context. When an interstate commercial hauler falls behind schedule on a mountain grade, dispatchers have no way of knowing whether the delay is driver fatigue, high-cube crosswinds, or battery thermal throttling.
            </p>
            <p>
              Nexus binds physical engine telematics, battery state of charge, cargo refrigeration envelopes, and highway topology into a single deterministic stream. Dispatchers see the exact status of each haul before committing any intervention.
            </p>
          </div>

          {/* Interactive Hauler Selector Chips */}
          <div className="mt-10">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {FLEET_ASSETS.map((asset, idx) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    tactileAudio.playClick();
                    setSelectedVehicle(idx);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-200 border flex items-center gap-2.5 whitespace-nowrap active:scale-[0.98] ${
                    selectedVehicle === idx
                      ? "bg-white dark:bg-[#16161A] text-[#11120F] dark:text-white border-[#7F5200] dark:border-[#FFC400] shadow-sm"
                      : "bg-[#EBE7DE]/60 dark:bg-[#121216] text-[#696762] dark:text-[#8A8680] border-[#CFCBBF] dark:border-[#3A3836] hover:border-stone-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedVehicle === idx ? "bg-[#7F5200] dark:bg-[#FFC400]" : "bg-stone-400"
                    }`}
                  />
                  <span>{asset.id}</span>
                  <span className="text-[10px] opacity-70">({asset.type})</span>
                </button>
              ))}
            </div>

            {/* Selected Hauler Telematics Card with Apple Spring Animation */}
            {(() => {
              const currentAsset = FLEET_ASSETS[selectedVehicle];
              return (
                <motion.div
                  key={currentAsset.id}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-4 p-6 rounded-2xl bg-white dark:bg-[#121216] border border-[#CFCBBF] dark:border-[#3A3836] shadow-sm space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CFCBBF]/60 dark:border-[#3A3836] pb-4">
                    <div>
                      <div className="text-xs font-mono font-bold text-[#7F5200] dark:text-[#FFC400] uppercase tracking-wider">
                        {currentAsset.status}
                      </div>
                      <div className="text-xl font-bold font-mono text-[#11120F] dark:text-white mt-1">
                        {currentAsset.id} · {currentAsset.model}
                      </div>
                      <div className="text-xs text-[#696762] dark:text-[#8A8680] font-mono mt-0.5">
                        Driver: {currentAsset.driver} · Corridor: {currentAsset.corridor}
                      </div>
                    </div>
                    <div className="text-left sm:text-right font-mono">
                      <div className="text-[10px] text-[#696762] dark:text-[#8A8680] uppercase">
                        Destination Bay
                      </div>
                      <div className="text-sm font-bold text-[#11120F] dark:text-white">
                        {currentAsset.destination}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        ETA: {currentAsset.eta}
                      </div>
                    </div>
                  </div>

                  {/* 4 Essential Logistics Gauges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                    <div className="p-3.5 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                      <div className="flex items-center justify-between text-[#696762] dark:text-[#8A8680] text-[10px] uppercase">
                        <span>Battery SoC</span>
                        <Zap className="h-3 w-3 text-emerald-500" />
                      </div>
                      <div className="text-2xl font-black text-[#11120F] dark:text-white mt-2">
                        {currentAsset.soc}%
                      </div>
                      <div className="w-full bg-[#EBE7DE] dark:bg-[#1C1C22] h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${currentAsset.soc}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                      <div className="flex items-center justify-between text-[#696762] dark:text-[#8A8680] text-[10px] uppercase">
                        <span>Cargo Reefer</span>
                        <Snowflake className="h-3 w-3 text-cyan-500" />
                      </div>
                      <div className="text-2xl font-black text-[#11120F] dark:text-white mt-2">
                        {currentAsset.cargoTemp}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                        {currentAsset.tempStatus}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                      <div className="flex items-center justify-between text-[#696762] dark:text-[#8A8680] text-[10px] uppercase">
                        <span>Tire Pressure</span>
                        <Activity className="h-3 w-3 text-[#7F5200] dark:text-[#FFC400]" />
                      </div>
                      <div className="text-2xl font-black text-[#11120F] dark:text-white mt-2">
                        {currentAsset.psi} PSI
                      </div>
                      <div className="text-[10px] text-[#696762] dark:text-[#8A8680] mt-1">
                        All 18 axles balanced
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F6F4EE] dark:bg-[#0B0B0D] border border-[#CFCBBF]/50 dark:border-[#3A3836]/60">
                      <div className="flex items-center justify-between text-[#696762] dark:text-[#8A8680] text-[10px] uppercase">
                        <span>Driver HOS Cycle</span>
                        <Clock className="h-3 w-3 text-stone-400" />
                      </div>
                      <div className="text-2xl font-black text-[#11120F] dark:text-white mt-2">
                        {currentAsset.hosRemaining}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                        FMCSA Compliant
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs font-mono text-[#696762] dark:text-[#8A8680]">
            <Link
              href="/operations"
              className="text-[#7F5200] dark:text-[#FFC400] font-bold hover:underline"
            >
              INSPECT LIVE COMMERCIAL FLEET TELEMETRY →
            </Link>
            <span>Sub-second SSE stream verified</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 02 — THE CASCADE PROBLEM & DETERMINISTIC DETOURS */}
        {/* ========================================================================= */}
        <section
          id="disruptions"
          className="py-20 px-6 lg:px-16 border-b border-[#CFCBBF] dark:border-[#3A3836] max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#696762] dark:text-[#8A8680] uppercase tracking-widest mb-3">
            <span className="text-[#7F5200] dark:text-[#FFC400] font-black text-sm">02</span>
            <span>·</span>
            <span>NETWORK DISRUPTION CASCADE · CORRIDOR RESOLUTION</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#11120F] dark:text-white leading-[1.05]">
            PREDICT DELAYS.<br />
            <span className="text-[#7F5200] dark:text-[#FFC400]">BEFORE THEY CASCADE.</span>
          </h2>

          <p className="mt-6 text-sm sm:text-base text-[#696762] dark:text-[#8A8680] leading-relaxed font-normal">
            A single highway obstruction never stays isolated. A 40-minute delay on an interstate mountain pass cascades into missed cross-dock feeder connections at destination superhubs, secondary driver detention fees, and customer SLA penalties. Nexus calculates bypasses hours before the truck reaches the bottleneck.
          </p>

          {/* Interactive Before/After Segmented Toggle */}
          <div className="mt-10">
            <div className="flex items-center justify-center mb-6">
              <div className="relative flex items-center p-1 rounded-full bg-[#EBE7DE] dark:bg-[#16161A] border border-[#CFCBBF] dark:border-[#3A3836] font-mono text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    tactileAudio.playClick();
                    setDisruptionMode("unmanaged");
                  }}
                  className={`relative z-10 px-5 py-2 rounded-full transition-colors duration-200 ${
                    disruptionMode === "unmanaged"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-[#696762] dark:text-[#8A8680]"
                  }`}
                >
                  Unmanaged Reaction
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tactileAudio.playClick();
                    setDisruptionMode("nexus");
                  }}
                  className={`relative z-10 px-5 py-2 rounded-full transition-colors duration-200 ${
                    disruptionMode === "nexus"
                      ? "text-[#7F5200] dark:text-[#FFC400]"
                      : "text-[#696762] dark:text-[#8A8680]"
                  }`}
                >
                  Nexus Deterministic Detour
                </button>
                <motion.div
                  layoutId="disruptionPill"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className={`absolute top-1 bottom-1 rounded-full bg-white dark:bg-[#0B0B0D] shadow-sm border border-[#CFCBBF]/50 dark:border-[#3A3836] ${
                    disruptionMode === "unmanaged"
                      ? "left-1 w-[calc(50%-4px)]"
                      : "left-[50%] w-[calc(50%-4px)]"
                  }`}
                />
              </div>
            </div>

            {/* Step-by-Step Cascade Timeline */}
            <AnimatePresence mode="wait">
              {disruptionMode === "unmanaged" ? (
                <motion.div
                  key="unmanaged"
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6 rounded-2xl bg-white dark:bg-[#121216] border border-rose-300 dark:border-rose-900/60 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider pb-2 border-b border-rose-200 dark:border-rose-950">
                    <span>DOMINO DELAY CASCADE · NO DETOUR APPLIED</span>
                    <span>NET LOSS: -$18,400</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                      <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400">
                        14:10 CST · PASS CLOSURE
                      </div>
                      <p className="mt-1 text-[#11120F] dark:text-stone-300 leading-snug">
                        I-80 Donner Pass shuts down. 3 commercial haulers get trapped on summit.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                      <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400">
                        17:30 CST · MISSED HUB WAVE
                      </div>
                      <p className="mt-1 text-[#11120F] dark:text-stone-300 leading-snug">
                        Chicago ORD-01 cross-dock evening sorting wave missed. Receiving bay sits empty.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                      <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400">
                        21:00 CST · DRIVER HOS EXPIRY
                      </div>
                      <p className="mt-1 text-[#11120F] dark:text-stone-300 leading-snug">
                        Driver hours-of-service limit reached while idling. Secondary tow mandatory.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                      <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400">
                        DAY 2 · 14 SLA BREACHES
                      </div>
                      <p className="mt-1 text-[#11120F] dark:text-stone-300 leading-snug">
                        14 high-value pharmaceutical consignments miss hospital delivery deadline.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="nexus"
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6 rounded-2xl bg-white dark:bg-[#121216] border border-emerald-300 dark:border-emerald-900/60 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider pb-2 border-b border-emerald-200 dark:border-emerald-950">
                    <span>NEXUS DETERMINISTIC DETOUR · EARLY INTERVENTION</span>
                    <span>SLA PRESERVED: 100%</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        11:45 CST · NOAA RADAR ALERT
                      </div>
                      <p className="mt-1 text-[#11120F] dark:text-stone-300 leading-snug">
                        Nexus detects 3-hour projected snowfall accumulation on I-80 summit.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        11:46 CST · DETOUR EVALUATED
                      </div>
                      <p className="mt-1 text-[#11120F] dark:text-stone-300 leading-snug">
                        I-70 South route computed in 180ms. Net delay: -112 mins vs summit roadblock.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        11:48 CST · DISPATCHER SIGNS
                      </div>
                      <p className="mt-1 text-[#11120F] dark:text-stone-300 leading-snug">
                        Human dispatcher authorizes reroute. Cryptographic approval logged to ledger.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        18:42 CST · ON-TIME DELIVERY
                      </div>
                      <p className="mt-1 text-[#11120F] dark:text-stone-300 leading-snug">
                        Hauler arrives safely at Cheyenne Bay 04. 0 missed SLAs, $4,200 preserved.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs font-mono text-[#696762] dark:text-[#8A8680]">
            <Link
              href="/incidents"
              className="text-[#7F5200] dark:text-[#FFC400] font-bold hover:underline"
            >
              REVIEW LIVE EXCEPTIONS QUEUE →
            </Link>
            <span>Verified against NOAA Weather & State DOT feeds</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 03 — THE STOCHASTIC PLANNING LAB (Monte Carlo Decision Engine) */}
        {/* ========================================================================= */}
        <section
          id="planning"
          className="py-20 px-6 lg:px-16 border-b border-[#CFCBBF] dark:border-[#3A3836] max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#696762] dark:text-[#8A8680] uppercase tracking-widest mb-3">
            <span className="text-[#7F5200] dark:text-[#FFC400] font-black text-sm">03</span>
            <span>·</span>
            <span>PLANNING LAB · STOCHASTIC MONTE CARLO ENGINE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#11120F] dark:text-white leading-[1.05]">
            ONE DECISION.<br />
            <span className="text-[#7F5200] dark:text-[#FFC400]">ZERO GUESSWORK.</span>
          </h2>

          <p className="mt-6 text-sm sm:text-base text-[#696762] dark:text-[#8A8680] leading-relaxed font-normal">
            Never gamble on arbitrary AI recommendations. The Planning Lab runs isolated what-if scenarios comparing baseline routes against detours, evaluating net time saved versus fuel surcharges across 5,000 stochastic runs. Applying an intervention requires deliberate human authorization.
          </p>

          {/* 3 Real Logistics Scenario Cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {SCENARIOS.map((s, idx) => (
              <motion.div
                key={s.id}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="p-6 rounded-2xl bg-white dark:bg-[#121216] border border-[#CFCBBF] dark:border-[#3A3836] shadow-sm flex flex-col justify-between space-y-4 hover:border-[#7F5200] dark:hover:border-[#FFC400] transition-colors duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider text-[#7F5200] dark:text-[#FFC400]">
                    <span>{s.id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#EBE7DE] dark:bg-[#1C1C22] text-[#11120F] dark:text-stone-300">
                      {s.confidence}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#11120F] dark:text-white tracking-tight">
                    {s.title}
                  </h3>

                  <div className="text-[11px] font-mono text-[#696762] dark:text-[#8A8680]">
                    {s.corridor}
                  </div>

                  <p className="text-xs text-[#696762] dark:text-[#8A8680] leading-relaxed">
                    {s.description}
                  </p>

                  <div className="pt-2 border-t border-[#CFCBBF]/50 dark:border-[#3A3836]/60 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <div className="text-[9px] uppercase text-[#696762] dark:text-[#8A8680]">
                        Delay Delta
                      </div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {s.delayDelta}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-[#696762] dark:text-[#8A8680]">
                        SLA Saved
                      </div>
                      <div className="font-bold text-[#7F5200] dark:text-[#FFC400]">
                        {s.slaPenaltyAvoided}
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/simulations"
                  className="pt-3 border-t border-[#CFCBBF]/50 dark:border-[#3A3836]/60 text-xs font-mono font-bold text-[#11120F] dark:text-stone-100 flex items-center justify-between hover:text-[#7F5200] dark:hover:text-[#FFC400] transition-colors"
                >
                  <span>EVALUATE IN STUDIO</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs font-mono text-[#696762] dark:text-[#8A8680]">
            <Link
              href="/simulations"
              className="text-[#7F5200] dark:text-[#FFC400] font-bold hover:underline"
            >
              RUN CUSTOM MONTE CARLO SCENARIO →
            </Link>
            <span>Bounded P50 / P90 distributions</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 04 — SPECIFICATION BY SPECIFICATION (Xerj 1px Rules + Pure Logistics) */}
        {/* ========================================================================= */}
        <section
          id="specifications"
          className="py-20 px-6 lg:px-16 border-b border-[#CFCBBF] dark:border-[#3A3836] max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#696762] dark:text-[#8A8680] uppercase tracking-widest mb-3">
            <span className="text-[#7F5200] dark:text-[#FFC400] font-black text-sm">04</span>
            <span>·</span>
            <span>TECHNICAL SPECIFICATION · OPERATIONAL GUARANTEES</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#11120F] dark:text-white leading-[1.05]">
            SYSTEM<br />
            <span className="text-[#7F5200] dark:text-[#FFC400]">SPECIFICATION.</span>
          </h2>

          <p className="mt-6 text-sm sm:text-base text-[#696762] dark:text-[#8A8680] leading-relaxed font-normal">
            Every architectural decision exists to eliminate what commercial supply chains actually lose: operational certainty. No theatrical black-box AI suggestions without verified telemetry backing and human operator control.
          </p>

          {/* Crisp 1px Key / Value Table Rows */}
          <div className="mt-10 divide-y divide-[#CFCBBF] dark:divide-[#3A3836] border-t border-b border-[#CFCBBF] dark:border-[#3A3836] font-mono text-xs">
            {SPECIFICATIONS.map((item, idx) => (
              <div
                key={idx}
                className="py-4.5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 items-baseline transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.015] px-2 rounded-lg"
              >
                <div className="md:col-span-4 font-bold text-[#11120F] dark:text-stone-100 flex items-center gap-2">
                  <span className="text-[#7F5200] dark:text-[#FFC400] font-normal">›</span>
                  <span>{item.k}</span>
                </div>
                <div className="md:col-span-8 text-[#696762] dark:text-[#8A8680] font-sans text-xs sm:text-sm leading-relaxed">
                  {item.v}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* BIG ACTION CTA (Apple Spring Tactile Button) */}
        {/* ========================================================================= */}
        <section className="py-20 px-6 lg:px-16 text-center max-w-2xl mx-auto space-y-6">
          <Link
            href="/login"
            className="w-full py-5 px-8 rounded-2xl bg-[#11120F] dark:bg-[#F4F2EC] text-white dark:text-[#0B0B0D] font-mono text-sm font-bold tracking-wider uppercase hover:opacity-95 shadow-md transition-all duration-200 flex items-center justify-between group active:scale-[0.99]"
          >
            <span>ENTER LOGISTICS WORKSPACE</span>
            <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <p className="text-xs font-mono text-[#696762] dark:text-[#8A8680]">
            Enterprise multi-tenant, cloud-native, or self-hosted deployment.
          </p>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* SITEMAP & FOOTER (Structured 4-Column Logistics Map) */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#CFCBBF] dark:border-[#3A3836] bg-[#F6F4EE] dark:bg-[#0B0B0D] px-6 lg:px-16 pt-14 pb-12 text-xs font-mono">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-[#CFCBBF]/70 dark:border-[#3A3836]">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-[#696762] dark:text-[#8A8680] uppercase tracking-widest block">
              OPERATIONS
            </span>
            <ul className="space-y-2 text-[#696762] dark:text-[#8A8680]">
              <li>
                <Link href="/overview" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Overview HUD
                </Link>
              </li>
              <li>
                <Link href="/operations" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Fleet Assets
                </Link>
              </li>
              <li>
                <Link
                  href="/operations/orders"
                  className="hover:text-[#7F5200] dark:hover:text-[#FFC400]"
                >
                  Shipments Manifest
                </Link>
              </li>
              <li>
                <Link href="/live-world" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Live 2D GIS Map
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-[#696762] dark:text-[#8A8680] uppercase tracking-widest block">
              PLANNING
            </span>
            <ul className="space-y-2 text-[#696762] dark:text-[#8A8680]">
              <li>
                <Link href="/simulations" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Planning Lab
                </Link>
              </li>
              <li>
                <Link
                  href="/simulations/new"
                  className="hover:text-[#7F5200] dark:hover:text-[#FFC400]"
                >
                  Stochastic Runs
                </Link>
              </li>
              <li>
                <Link href="/incidents" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Exceptions Queue
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Corridor Analytics
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-[#696762] dark:text-[#8A8680] uppercase tracking-widest block">
              DEVELOPERS
            </span>
            <ul className="space-y-2 text-[#696762] dark:text-[#8A8680]">
              <li>
                <Link href="/status" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  API Health Status
                </Link>
              </li>
              <li>
                <Link href="/import-data" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  CSV & Telemetry Ingest
                </Link>
              </li>
              <li>
                <Link href="/driver-pass" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Driver Beacon Pass
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/AadityaUniyal/Nexus"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#7F5200] dark:hover:text-[#FFC400]"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-[#696762] dark:text-[#8A8680] uppercase tracking-widest block">
              GOVERNANCE
            </span>
            <ul className="space-y-2 text-[#696762] dark:text-[#8A8680]">
              <li>
                <Link href="/admin/audit" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Cryptographic Ledger
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Workspace Settings
                </Link>
              </li>
              <li>
                <Link href="/admin/roles" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Access Control & RBAC
                </Link>
              </li>
              <li>
                <Link href="/environment" className="hover:text-[#7F5200] dark:hover:text-[#FFC400]">
                  Environment Verification
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#696762] dark:text-[#8A8680]">
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
