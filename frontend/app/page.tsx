"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Globe2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar3D } from "@/components/avatar/Avatar3D";
import { StatusLed } from "@/components/ui/status-led";

export default function LandingPage() {
  const [activeStoryStep, setActiveStoryStep] = React.useState(0);

  const storySteps = [
    {
      num: "01",
      title: "OBSERVE",
      subtitle: "Unified Spatial Network",
      desc: "Live 3D telemetry streaming across all interconnected vehicles, warehouses, routes, and high-value shipments in real time.",
      badge: "Realtime Telemetry",
      badgeVariant: "healthy" as const,
    },
    {
      num: "02",
      title: "UNDERSTAND",
      subtitle: "Instant Operational Clarity",
      desc: "High-density telemetry metrics synthesize SLA compliance, fleet utilization, bottleneck probabilities, and dock cycle efficiencies.",
      badge: "97.4% SLA Adherence",
      badgeVariant: "healthy" as const,
    },
    {
      num: "03",
      title: "INVESTIGATE",
      subtitle: "Autonomous Anomaly Detection",
      desc: "When weather disruptions or thermal drifts occur, NEXUS immediately flags affected routes, estimated penalty exposure, and root causes.",
      badge: "Critical Alert Triaged",
      badgeVariant: "critical" as const,
    },
    {
      num: "04",
      title: "SIMULATE",
      subtitle: "Hypothetical What-If Branching",
      desc: "Evaluate alternate corridors and split-load transfers in a safe purple simulation layer without risking live fleet operations.",
      badge: "Pure Deterministic Engine",
      badgeVariant: "simulation" as const,
    },
    {
      num: "05",
      title: "DECIDE",
      subtitle: "Multi-Variable Trade-off Matrix",
      desc: "Compare scenario cost deltas, net time recoveries, and order risk profiles to select the mathematical Pareto optimum.",
      badge: "135 Mins Recovered",
      badgeVariant: "simulation" as const,
    },
    {
      num: "06",
      title: "LEARN",
      subtitle: "Historical Pattern Intelligence",
      desc: "Every applied decision feeds back into pattern recognition models, refining future dispatch models and buffer tolerances.",
      badge: "Continuous Optimization",
      badgeVariant: "ai" as const,
    },
    {
      num: "07",
      title: "OPERATE",
      subtitle: "Transactional Decision Execution",
      desc: "One click applies reroutes to live dispatch systems, generates auditable event logs, and alerts affected consignees.",
      badge: "ACID Guaranteed",
      badgeVariant: "healthy" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
      {/* Top Navigation */}
      <header className="h-20 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-nexus-primary-container flex items-center justify-center text-white shadow-tactile">
            <span className="font-bold text-sm tracking-tighter">NX</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-nexus-on-surface">NEXUS</span>
            <span className="text-xs font-mono-data text-nexus-on-surface-variant font-medium hidden sm:inline">
              Operational Intelligence
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-nexus-on-surface-variant">
          <a href="#story" className="hover:text-nexus-on-surface transition-colors">
            Product Story
          </a>
          <a href="#simulation" className="hover:text-nexus-on-surface transition-colors">
            Simulation Lab
          </a>
          <a href="#technology" className="hover:text-nexus-on-surface transition-colors">
            Architecture
          </a>
          <Link href="/login" className="hover:text-nexus-on-surface transition-colors">
            Sign In
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="secondary" size="sm" className="font-mono-data text-xs">
              Sign In
            </Button>
          </Link>
          <Link href="/overview">
            <Button variant="primary" size="sm" className="font-mono-data text-xs">
              Explore NEXUS
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Top Operational Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile mb-8"
        >
          <StatusLed status="HEALTHY" size="sm" />
          <span className="text-xs font-mono-data text-nexus-on-surface font-semibold tracking-wide">
            NEXUS ENGINE V2.4 · LIVING OPERATIONAL TWIN
          </span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-nexus-on-surface max-w-5xl leading-[1.1]"
        >
          See operations differently.
        </motion.h1>

        {/* Hero Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-nexus-on-surface-variant max-w-2xl font-normal leading-relaxed"
        >
          A warm, tactile operational intelligence and decision-simulation platform. Observe living
          physical networks, investigate anomalies, and simulate tactical resolutions before
          applying decisions.
        </motion.p>

        {/* Hero CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/overview">
            <Button size="lg" variant="primary" className="shadow-tactile-lg font-mono-data text-sm">
              Enter Operations Center
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/simulations/new">
            <Button size="lg" variant="simulation" className="shadow-tactile font-mono-data text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Launch Simulation Lab
            </Button>
          </Link>
        </motion.div>

        {/* 3D Avatar Companion Hero Presentation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 relative flex flex-col items-center"
        >
          <div className="relative p-6 rounded-3xl bg-nexus-surface-lowest/70 backdrop-blur-md border border-nexus-outline-variant/40 shadow-tactile-lg">
            <Avatar3D mood="WELCOME" size="hero" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-nexus-primary-container text-white text-[11px] font-mono-data tracking-wider uppercase font-semibold shadow-tactile">
              NEXUS Companion Agent
            </div>
          </div>
        </motion.div>
      </section>

      {/* Product Story Section: OBSERVE -> UNDERSTAND -> INVESTIGATE -> SIMULATE -> DECIDE -> LEARN -> OPERATE */}
      <section id="story" className="py-20 bg-nexus-surface-container-low/40 border-y border-nexus-outline-variant/30 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono-data text-nexus-secondary font-bold uppercase tracking-wider">
              The Seven-Step Loop
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-nexus-on-surface mt-2 tracking-tight">
              From Observation to Actionable Decisions
            </h2>
            <p className="text-sm text-nexus-on-surface-variant mt-3">
              NEXUS transforms chaotic physical logistics telemetry into a coherent, simulated decision engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storySteps.map((step, idx) => (
              <div
                key={step.num}
                className="tactile-card p-6 flex flex-col justify-between hover:translate-y-[-2px] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono-data text-nexus-outline/60">
                      {step.num}
                    </span>
                    <Badge variant={step.badgeVariant} size="sm">
                      {step.badge}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-nexus-on-surface tracking-tight">
                    {step.title} · {step.subtitle}
                  </h3>
                  <p className="text-xs text-nexus-on-surface-variant mt-2.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-nexus-outline-variant/20 flex items-center justify-between text-xs font-mono-data text-nexus-secondary font-semibold">
                  <span>Explore Phase</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simulation Lab Showcase */}
      <section id="simulation" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="p-8 md:p-12 rounded-3xl bg-nexus-surface-lowest border-2 border-purple-500/20 shadow-tactile-lg simulation-layer">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge variant="simulation" size="md">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Decision Simulation Engine
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-nexus-on-surface mt-4 tracking-tight">
                Hypothetical Scenarios with Zero Live Risk
              </h2>
              <p className="text-sm text-nexus-on-surface-variant mt-4 leading-relaxed">
                Test weather diversions, fleet allocation surges, and warehouse capacity rebalancing
                before executing live commands. The pure deterministic engine calculates Pareto-optimal
                trade-offs between delay recovery and fuel surcharges.
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-xs font-mono-data text-nexus-on-surface">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Pure deterministic calculation: Identical input yields identical proof.</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono-data text-nexus-on-surface">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Groq AI LLaMA 3.3 executive briefings summarize operational impact.</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono-data text-nexus-on-surface">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Transactional Apply: ACID operational mutation with full audit trail.</span>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/simulations/new">
                  <Button variant="simulation" size="lg" className="font-mono-data text-xs">
                    Open What-If Scenario Builder
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Simulation Preview Card */}
            <div className="p-6 rounded-2xl bg-nexus-surface-lowest border border-purple-500/30 shadow-tactile space-y-4">
              <div className="flex items-center justify-between border-b border-nexus-outline-variant/30 pb-3">
                <div>
                  <span className="text-[10px] font-mono-data text-purple-700 font-bold uppercase">
                    SIM-SCENARIO-901
                  </span>
                  <h4 className="text-sm font-bold text-nexus-on-surface">
                    I-70 South Reroute vs Holding Pattern
                  </h4>
                </div>
                <Badge variant="simulation" size="sm">
                  Recommended
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono-data">
                <div className="p-3 rounded-lg bg-nexus-surface-container/60">
                  <p className="text-nexus-on-surface-variant text-[10px]">Net Time Saved</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    +135 mins
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-nexus-surface-container/60">
                  <p className="text-nexus-on-surface-variant text-[10px]">Cost Delta</p>
                  <p className="text-lg font-bold text-nexus-on-surface mt-1">+$80.00</p>
                </div>
                <div className="p-3 rounded-lg bg-nexus-surface-container/60">
                  <p className="text-nexus-on-surface-variant text-[10px]">SLA Breach Risk</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    12.0% (was 88%)
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-nexus-surface-container/60">
                  <p className="text-nexus-on-surface-variant text-[10px]">Confidence Score</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-400 mt-1">
                    94 / 100
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-nexus-on-surface-variant">
                <span className="font-bold text-purple-900 dark:text-purple-300 font-mono-data">
                  AI Summary:
                </span>{" "}
                Rerouting Vehicle NX-TRK-104 via the I-70 South corridor completely bypasses the
                Cheyenne blizzard, preserving high-value AeroTech aerospace shipment SLA.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-nexus-outline-variant/30 bg-nexus-surface-container-low/60 py-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-nexus-on-surface-variant font-mono-data">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-nexus-primary-container text-white flex items-center justify-center font-bold text-xs">
              NX
            </div>
            <span>NEXUS Operational Intelligence Platform © 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/overview" className="hover:text-nexus-on-surface">
              Dashboard
            </Link>
            <Link href="/live-world" className="hover:text-nexus-on-surface">
              3D Live World
            </Link>
            <Link href="/simulations" className="hover:text-nexus-on-surface">
              Simulation Lab
            </Link>
            <Link href="/admin" className="hover:text-nexus-on-surface">
              Admin Platform
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
