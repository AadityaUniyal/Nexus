"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Building2,
  AlertTriangle,
  Sparkles,
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
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OperationalTimelineHero } from "@/components/brand/OperationalTimelineHero";
import { AppleSegmentedTabs, AppleGlassCard } from "@/components/motion";

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = React.useState<number>(0);
  const [activeDemoTab, setActiveDemoTab] = React.useState<"telematics" | "disruption" | "hubs" | "simulation">("telematics");
  const [activeRolePerspective, setActiveRolePerspective] = React.useState<number>(0);

  // Auto-cycle through cascade steps if motion is enabled
  React.useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const DISRUPTION_CASCADE = [
    {
      step: "01",
      title: "Interstate Corridor Disruption",
      entity: "Vehicle NX-104 (eCascadia EV)",
      location: "Interstate 80 Mountain Pass (Mile 342)",
      detail: "Unexpected blizzard conditions and mountain pass grade drop reduce average speed to 22 km/h. Vehicle falls 42 minutes behind dispatch schedule.",
      impact: "+42m transit delay",
      status: "WARNING",
      badgeVariant: "critical" as const,
    },
    {
      step: "02",
      title: "Distribution Hub Gate Congestion",
      entity: "Chicago O'Hare Terminal Hub (ORD-01)",
      location: "Inbound Receiving Bay 4",
      detail: "Delayed arrival collides with afternoon inbound wave. Active dock occupancy climbs to 94%, expanding gate-to-dock turnaround from 18m to 46m.",
      impact: "Dock turnaround +28m",
      status: "CONGESTED",
      badgeVariant: "critical" as const,
    },
    {
      step: "03",
      title: "Downstream Cross-Dock At Risk",
      entity: "Denver Regional Intermodal Hub",
      location: "Connecting Relay Shuttle RT-802",
      detail: "Three connecting retail shipments miss scheduled feeder departures. 14 palletized high-value orders risk remaining stalled in cross-dock holding.",
      impact: "14 orders held at hub",
      status: "JEOPARDIZED",
      badgeVariant: "critical" as const,
    },
    {
      step: "04",
      title: "Enterprise Delivery Commitment Threatened",
      entity: "Continental Retail Fulfillment SLA",
      location: "Customer Destination Terminals",
      detail: "Contractual delivery window expires in 2 hours. Financial delay liability estimated at $4,200 if automated reroute is not committed immediately.",
      impact: "SLA breach risk: 88%",
      status: "ESCALATED",
      badgeVariant: "critical" as const,
    },
  ];

  const PRODUCT_DEMOS = {
    telematics: {
      title: "Fleet Visibility & Live Telematics",
      subtitle: "Verified vehicle telemetry synced with route topography and charge state.",
      badge: "Real-Time Telemetry",
      problem: "Operators cannot act on static GPS dots without understanding driver duty hours, vehicle battery reserves, and topography deltas.",
      signal: "Real-time stream from Vehicle NX-104 reports 74% battery SoC, 68 km/h rolling speed, and healthy engine diagnostics over I-80.",
      decision: "Dispatch system automatically flags safe regenerative descent corridors and monitors reserve thresholds.",
      outcome: "Vehicle trajectory confirmed with zero driver intervention required.",
      metrics: [
        { label: "Active Fleet Telematics", value: "100%", sub: "Synced via secure socket" },
        { label: "Battery Reserve Health", value: "88.4%", sub: "Nominal operating envelope" },
        { label: "Turnaround Latency", value: "24m", sub: "Gate-to-dock average" },
      ],
    },
    disruption: {
      title: "Route Disruption & Weather Modeling",
      subtitle: "Continuous environmental monitoring along commercial transport corridors.",
      badge: "Corridor Awareness",
      problem: "Traditional TMS platforms notify dispatchers hours after highway closures happen, when trucks are already caught in deadlocks.",
      signal: "Atmospheric weather feeds detect sub-zero blizzard anomaly on Route RT-CHI-DEN-01 with 180-minute projected clearance delay.",
      decision: "Nexus calculates detour viability via I-70 South Corridor, computing elevation profile and EV charging waypoints.",
      outcome: "Autonomous detour proposed before the vehicle enters the affected mountain segment.",
      metrics: [
        { label: "Incident Hotspots", value: "1 Active", sub: "I-80 Blizzard Anomaly" },
        { label: "Delay Avoidance", value: "112 mins", sub: "Via I-70 South Bypass" },
        { label: "Liability Mitigated", value: "$4,200", sub: "Contract penalty preserved" },
      ],
    },
    hubs: {
      title: "Warehouse & Hub Operations",
      subtitle: "Dynamic cross-dock queue balancing and gate turnaround control.",
      badge: "Terminal Logistics",
      problem: "Distribution terminals operate as isolated black boxes, resulting in severe gate congestion and driver detention charges.",
      signal: "Chicago Terminal Hub ORD-01 reports 8 of 8 active docks engaged with 12,450 units on floor (83% rated capacity).",
      decision: "Nexus reroutes inbound secondary freight to Aurora Satellite Facility, preserving open express bays for critical temperature-controlled cargo.",
      outcome: "Dock efficiency stabilizes at 94.2% with zero gate queue spillover.",
      metrics: [
        { label: "Operating Capacity", value: "83.0%", sub: "12,450 of 15,000 units" },
        { label: "Dock Utilization", value: "6 / 8 Active", sub: "2 reserved for cold-chain" },
        { label: "Terminal Efficiency", value: "94.2%", sub: "On-target throughput" },
      ],
    },
    simulation: {
      title: "Predictive Decision Support & Simulation",
      subtitle: "Monte Carlo stochastic validation before committing operational changes.",
      badge: "Decision Intelligence",
      problem: "Dispatchers hesitate to reroute entire fleets because secondary detour costs and fuel surcharges are impossible to calculate on the fly.",
      signal: "Scenario Engine executes 1,000 iterations varying mountain pass wind resistance, fuel surge (+15%), and driver hours-of-service.",
      decision: "Simulation yields 95% confidence interval: detour delivers 68m delay reduction at a predictable $380 net delta.",
      outcome: "1-Click approval synchronizes waypoints to driver terminal and registers immutable cryptographic audit entry.",
      metrics: [
        { label: "Confidence Interval", value: "95.0%", sub: "Stochastic Monte Carlo" },
        { label: "P90 Delay Reduction", value: "-68 mins", sub: "Deterministic corridor" },
        { label: "Audit State", value: "Verified ✓", sub: "SHA-256 cryptographic trail" },
      ],
    },
  };

  const ROLES = [
    {
      role: "Operations Manager",
      title: "Network Exception & Disruption Triage",
      badge: "Command Cockpit",
      path: "/overview",
      focus: "Operational awareness, critical exception resolution, and service commitment preservation.",
      summary: "Monitors active corridor disruptions, evaluates AI-recommended detour scenarios, and authorizes mission-critical adjustments across regional hubs.",
      capabilities: [
        "Live incident triage with financial liability assessment",
        "1-Click simulation application with verifiable state commit",
        "Multi-hub capacity and receiving dock health monitoring",
      ],
    },
    {
      role: "Fleet Operator",
      title: "Execution, Telematics & Driver Coordination",
      badge: "Field Dispatch",
      path: "/operations",
      focus: "Vehicle telemetry, driver safety, active trip progression, and turnaround execution.",
      summary: "Maintains immediate operational control over the commercial fleet. Tracks battery states, rolling speeds, driver logs, and gateway turnaround times.",
      capabilities: [
        "Individual vehicle telematics with battery SoC & health",
        "Direct driver dispatch and waypoint transmission",
        "Real-time vehicle and order enrollment workflows",
      ],
    },
    {
      role: "Supply Chain Analyst",
      title: "Predictive Modeling & Network Optimization",
      badge: "Simulation & Trends",
      path: "/analytics",
      focus: "Macro performance trends, scenario simulations, and network capacity planning.",
      summary: "Runs multi-parameter Monte Carlo simulations to test route resilience under adverse weather, diesel price swings, and seasonal volume surges.",
      capabilities: [
        "Stochastic simulation engine with variable confidence intervals",
        "Deterministic cost vs. time trade-off evaluations",
        "Exportable datasets in CSV, Parquet, and JSON formats",
      ],
    },
    {
      role: "System Administrator",
      title: "Enterprise Governance, Security & Auditability",
      badge: "Master Governance",
      path: "/admin/company",
      focus: "Tenant isolation, role-based access control, cryptographic ledger, and system health.",
      summary: "Governs company partitions, enforces WebAuthn and enterprise authorization policies, monitors cloud integration probes, and audits immutable decision ledgers.",
      capabilities: [
        "Cryptographic action ledger with SHA-256 verification",
        "Strict multi-tenant workspace partitioning and RBAC",
        "Cloud telemetry health probes and system diagnostics",
      ],
    },
    {
      role: "Executive Viewer",
      title: "High-Level Service Levels & Strategic Outcomes",
      badge: "Executive Briefing",
      path: "/overview",
      focus: "Global on-time delivery rates, cost exposure, network efficiency, and sustainability.",
      summary: "Provides company leadership and board stakeholders with clean, verified summaries of logistics performance without low-level noise.",
      capabilities: [
        "Enterprise on-time delivery indices with SLA tracking",
        "Mitigated contractual delay penalty reporting",
        "One-click downloadable executive board briefing reports",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
      {/* Apple-Grade Global Navigation (48px Frosted Glass with Micro-Typography) */}
      <header className="sticky top-0 z-50 h-12 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-black/70 backdrop-blur-2xl px-6 lg:px-12 flex items-center justify-between transition-colors">
        <Link href="/" className="flex items-center gap-2.5 group">
          <LogoMark size={24} />
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-nexus-on-surface">Nexus</span>
            <span className="text-[10px] font-mono text-nexus-on-surface-variant font-medium hidden sm:inline opacity-70">
              OS
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[12px] font-medium tracking-tight text-nexus-on-surface-variant/80" aria-label="Main Navigation">
          <a href="#the-stakes" className="hover:text-nexus-on-surface hover:opacity-100 transition-all">The Stakes</a>
          <a href="#network-complexity" className="hover:text-nexus-on-surface hover:opacity-100 transition-all">Network Cascade</a>
          <a href="#intelligence" className="hover:text-nexus-on-surface hover:opacity-100 transition-all">Product Intelligence</a>
          <a href="#perspectives" className="hover:text-nexus-on-surface hover:opacity-100 transition-all">Workspaces</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-nexus-primary text-white hover:bg-nexus-primary/90 shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>Access Workspace</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* CHAPTER 1: THE OPENING — INTRODUCE THE STAKES */}
        {/* ========================================================================= */}
        <section id="the-stakes" className="relative min-h-[90vh] flex flex-col justify-center px-6 lg:px-16 pt-16 pb-20 border-b border-nexus-outline-variant/25 overflow-hidden">
          {/* Subtle Ambient Network Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06] bg-[radial-gradient(#0f1a1f_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="max-w-6xl mx-auto w-full relative z-10">
            {/* Architecture Category Identifier */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-surface-container border border-nexus-outline-variant/40 text-nexus-on-surface-variant text-xs font-mono font-medium mb-8">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Logistics Operating System</span>
            </div>

            {/* Core Opening Headline */}
            <div className="space-y-4 max-w-4xl">
              <motion.h1
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-nexus-on-surface leading-[1.08]"
              >
                Every shipment. One clearer picture.
              </motion.h1>

              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg sm:text-2xl text-nexus-on-surface-variant font-normal leading-relaxed max-w-3xl"
              >
                Bring shipments, fleet activity, operational exceptions, and planning decisions into one clear workspace.
              </motion.p>
            </div>

            {/* Restrained Value Proposition & Action Bar */}
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-2xl bg-nexus-primary text-white font-mono text-xs font-bold shadow-tactile-lift hover:bg-nexus-primary/95 transition-all flex items-center justify-center gap-2 text-center"
              >
                <span>Access Your Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#network-complexity"
                className="px-6 py-3.5 rounded-2xl border border-nexus-outline-variant/50 bg-nexus-surface-container/40 hover:bg-nexus-surface-container text-nexus-on-surface font-mono text-xs font-semibold transition-colors flex items-center justify-center gap-2 text-center"
              >
                <span>Explore Network Cascade</span>
                <ChevronRight className="h-4 w-4 text-nexus-on-surface-variant" />
              </a>
            </div>

            {/* Live Corridor Topology Preview (Apple-Grade Glass Card) */}
            <div className="mt-14">
              <AppleGlassCard className="p-6 sm:p-8" hoverScale={1.01}>
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-black/[0.08] dark:border-white/[0.08] gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-nexus-primary uppercase tracking-wider">
                        Live Physical Infrastructure Model
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                        Telemetry Synced
                      </span>
                    </div>
                    <p className="text-xs font-mono text-nexus-on-surface-variant">
                      Corridor RT-CHI-DEN-01 · Chicago Hub to Denver Terminal
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-nexus-on-surface-variant">
                    <span>Distance: 1,620 km</span>
                    <span>·</span>
                    <span>Payload: 45,000 kg</span>
                    <span>·</span>
                    <span className="text-emerald-500 font-semibold">Active Corridor</span>
                  </div>
                </div>

                {/* Waypoint Sequence Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-[20px] bg-white/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-2 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-nexus-on-surface flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-nexus-primary" />
                        Origin: Chicago O&apos;Hare
                      </span>
                      <Badge variant="healthy" size="sm">Departed</Badge>
                    </div>
                    <p className="text-[11px] font-mono text-nexus-on-surface-variant">
                      Terminal ORD-01 · 14 freight orders cleared dock at 06:40 CST.
                    </p>
                  </div>

                  <div className="p-4 rounded-[20px] bg-amber-500/10 border border-amber-500/30 space-y-2 relative backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-nexus-on-surface flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        In Transit: I-80 Pass
                      </span>
                      <Badge variant="critical" size="sm">Delay Detected</Badge>
                    </div>
                    <p className="text-[11px] font-mono text-nexus-on-surface-variant">
                      Mile 342 · Severe mountain blizzard reduces corridor flow by 65%.
                    </p>
                  </div>

                  <div className="p-4 rounded-[20px] bg-white/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-2 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-nexus-on-surface flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-nexus-secondary" />
                        Destination: Denver Hub
                      </span>
                      <Badge variant="neutral" size="sm">Scheduled</Badge>
                    </div>
                    <p className="text-[11px] font-mono text-nexus-on-surface-variant">
                      Terminal DEN-01 · Receiving bay reserved; ETA recalculating.
                    </p>
                  </div>
                </div>
              </AppleGlassCard>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* OPERATIONAL INTELLIGENCE TIMELINE SCROLL STAGE */}
        {/* ========================================================================= */}
        <OperationalTimelineHero />

        {/* ========================================================================= */}
        {/* CHAPTER 2: THE PROBLEM — REVEAL NETWORK COMPLEXITY */}
        {/* ========================================================================= */}
        <section id="network-complexity" className="py-24 px-6 lg:px-16 border-b border-nexus-outline-variant/25 bg-nexus-surface-dim/40">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="space-y-3 max-w-3xl">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Chapter 2 · The Network Cascade
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-nexus-on-surface">
                A single delay never stays single.
              </h2>
              <p className="text-base sm:text-lg text-nexus-on-surface-variant leading-relaxed">
                In distributed logistics networks, time is systemic. A 40-minute mountain pass disruption does not simply hold back one vehicle—it propagates across your entire operating graph.
              </p>
            </div>

            {/* 4-Step Propagation Cascade Interactive Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Selector List */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-mono text-nexus-on-surface-variant uppercase tracking-wider block mb-1">
                  Disruption Causality Sequence (Illustrative Scenario)
                </span>
                {DISRUPTION_CASCADE.map((item, idx) => {
                  const isSelected = activeStep === idx;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setActiveStep(idx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? "bg-nexus-surface-lowest border-nexus-primary shadow-tactile ring-1 ring-nexus-primary/20"
                          : "bg-nexus-surface-container/30 border-nexus-outline-variant/30 hover:bg-nexus-surface-container/60"
                      }`}
                    >
                      <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${
                        isSelected ? "bg-nexus-primary text-white" : "bg-nexus-surface-container text-nexus-on-surface-variant"
                      }`}>
                        {item.step}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-nexus-on-surface">{item.title}</span>
                          <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold">
                            {item.impact}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-nexus-on-surface-variant">
                          {item.entity}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Detail Stage */}
              <div className="lg:col-span-7 bg-nexus-surface-lowest border border-nexus-outline-variant/40 rounded-3xl p-6 sm:p-8 shadow-tactile-lg space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-nexus-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-on-surface">
                      Propagation Analysis: Stage {DISRUPTION_CASCADE[activeStep].step}
                    </span>
                  </div>
                  <Badge variant={DISRUPTION_CASCADE[activeStep].badgeVariant}>
                    {DISRUPTION_CASCADE[activeStep].status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-nexus-on-surface">
                    {DISRUPTION_CASCADE[activeStep].title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-nexus-secondary">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{DISRUPTION_CASCADE[activeStep].location}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-nexus-on-surface-variant leading-relaxed font-mono">
                    {DISRUPTION_CASCADE[activeStep].detail}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold">
                      Network Delta Exposure
                    </span>
                    <p className="text-xs font-mono text-nexus-on-surface font-bold">
                      {DISRUPTION_CASCADE[activeStep].impact}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-nexus-on-surface-variant">
                    Simulated Scenario Data
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 3: THE REVEAL — INTRODUCE NEXUS */}
        {/* ========================================================================= */}
        <section id="intelligence" className="py-24 px-6 lg:px-16 border-b border-nexus-outline-variant/25">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="space-y-3 max-w-3xl">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-primary">
                Chapter 3 · Operational Intelligence
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-nexus-on-surface">
                See the network. Understand the risk. Act with intent.
              </h2>
              <p className="text-base sm:text-lg text-nexus-on-surface-variant leading-relaxed">
                Nexus turns fragmented telemetry into coherent operational decisions. Rather than presenting disconnected dashboards, it models your physical network as an active, predictable system.
              </p>
            </div>

            {/* Demonstration Selector Tabs (Apple-Style Fluid Spring Pill) */}
            <div className="flex items-center overflow-x-auto pb-3 pt-1">
              <AppleSegmentedTabs
                tabs={[
                  { id: "telematics", label: "Fleet Visibility", icon: Truck },
                  { id: "disruption", label: "Corridor Modeling", icon: AlertTriangle },
                  { id: "hubs", label: "Hub Operations", icon: Building2 },
                  { id: "simulation", label: "Decision Simulation", icon: Sparkles, badge: "AI" },
                ]}
                activeId={activeDemoTab}
                onChange={(id) => setActiveDemoTab(id as any)}
                layoutId="apple-demo-active-pill"
                size="md"
              />
            </div>

            {/* Active Product Demonstration Showcase (Apple Glass Card) */}
            {(() => {
              const demo = PRODUCT_DEMOS[activeDemoTab];
              return (
                <AppleGlassCard className="p-6 sm:p-10" hoverScale={1.008}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left 7 Columns: Product Behavior & Decision Narrative */}
                    <div className="lg:col-span-7 space-y-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="simulation" size="sm">
                          {demo.badge}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-nexus-on-surface tracking-tight mt-2">
                        {demo.title}
                      </h3>
                      <p className="text-xs font-mono text-nexus-on-surface-variant">
                        {demo.subtitle}
                      </p>
                    </div>

                    {/* Operational Flow: Problem -> Signal -> Decision -> State */}
                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3.5 rounded-2xl bg-nexus-surface-container/30 border border-nexus-outline-variant/20 space-y-1">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                          Operational Friction
                        </span>
                        <p className="text-nexus-on-surface-variant leading-relaxed">
                          {demo.problem}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-nexus-surface-container/30 border border-nexus-outline-variant/20 space-y-1">
                        <span className="text-[10px] font-bold text-nexus-secondary uppercase tracking-wider block">
                          Ingested Signal
                        </span>
                        <p className="text-nexus-on-surface-variant leading-relaxed">
                          {demo.signal}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-nexus-primary/5 border border-nexus-primary/20 space-y-1">
                        <span className="text-[10px] font-bold text-nexus-primary uppercase tracking-wider block">
                          Nexus Decision Synthesis
                        </span>
                        <p className="text-nexus-on-surface leading-relaxed">
                          {demo.decision}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                          Confirmed System State
                        </span>
                        <p className="text-nexus-on-surface leading-relaxed font-semibold">
                          {demo.outcome}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right 5 Columns: Verified Metrics & Preview */}
                  <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-nexus-outline-variant/25 pt-6 lg:pt-0 lg:pl-8 space-y-6">
                    <div className="space-y-4">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-on-surface block">
                        Verified Operational Indicators
                      </span>
                      <div className="space-y-3">
                        {demo.metrics.map((m) => (
                          <div
                            key={m.label}
                            className="p-4 rounded-2xl bg-nexus-surface-container/40 border border-nexus-outline-variant/25 space-y-0.5"
                          >
                            <span className="text-[10px] font-mono uppercase tracking-wider text-nexus-on-surface-variant">
                              {m.label}
                            </span>
                            <div className="text-2xl font-bold text-nexus-on-surface tracking-tight font-mono">
                              {m.value}
                            </div>
                            <span className="text-[11px] font-mono text-nexus-secondary font-medium">
                              {m.sub}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-nexus-surface-container/20 border border-nexus-outline-variant/20 flex items-center justify-between">
                      <span className="text-xs font-mono text-nexus-on-surface-variant">
                        Ready to inspect the live interface?
                      </span>
                      <Link
                        href="/login"
                        className="px-3.5 py-1.5 rounded-xl bg-nexus-surface-container hover:bg-nexus-surface-container-high text-nexus-on-surface text-xs font-mono font-bold transition-colors flex items-center gap-1"
                      >
                        <span>Open View</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </AppleGlassCard>
            );
          })()}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 4: THE PEOPLE — ROLE-SPECIFIC INTELLIGENCE */}
        {/* ========================================================================= */}
        <section id="perspectives" className="py-24 px-6 lg:px-16 border-b border-nexus-outline-variant/25 bg-nexus-surface-dim/40">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="space-y-3 max-w-3xl">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-primary">
                Chapter 4 · Role-Specific Intelligence
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-nexus-on-surface">
                One network. Different perspectives.
              </h2>
              <p className="text-base sm:text-lg text-nexus-on-surface-variant leading-relaxed">
                A fleet dispatcher on the road, an operations director in the control hub, and an executive reviewing quarterly SLA exposure require distinct signals from the same underlying physical truth.
              </p>
            </div>

            {/* 5 Distinct Roles Switcher (Apple-Grade Segmented Tabs) */}
            <div className="flex items-center overflow-x-auto pb-4 pt-1">
              <AppleSegmentedTabs
                tabs={ROLES.map((r, idx) => ({
                  id: String(idx),
                  label: r.role,
                  badge: `0${idx + 1}`,
                }))}
                activeId={String(activeRolePerspective)}
                onChange={(id) => setActiveRolePerspective(Number(id))}
                layoutId="apple-roles-active-pill"
                size="md"
              />
            </div>

            {/* Detailed Active Role Card (Apple-Grade Glass Card) */}
            {(() => {
              const role = ROLES[activeRolePerspective];
              return (
                <AppleGlassCard className="p-6 sm:p-10 space-y-6" hoverScale={1.008}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.08] dark:border-white/[0.08]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="simulation" size="sm">
                          {role.badge}
                        </Badge>
                        <span className="text-xs font-mono text-nexus-secondary font-semibold">
                          Authorized Workspace Perspective
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-nexus-on-surface tracking-tight mt-1">
                        {role.role} · {role.title}
                      </h3>
                      <p className="text-xs font-mono text-nexus-on-surface-variant">
                        Primary Scope: {role.focus}
                      </p>
                    </div>

                    <Link
                      href={`/login?role=${encodeURIComponent(role.role)}`}
                      className="shrink-0 px-4 py-2.5 rounded-full bg-nexus-primary text-white text-xs font-mono font-bold shadow-tactile hover:bg-nexus-primary/95 transition-all flex items-center gap-2 active:scale-[0.98]"
                    >
                      <span>Sign In as {role.role.split(" ")[0]}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <p className="text-sm text-nexus-on-surface-variant leading-relaxed">
                    {role.summary}
                  </p>

                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-on-surface block">
                      Core Workspace Responsibilities
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {role.capabilities.map((cap) => (
                        <div
                          key={cap}
                          className="p-3.5 rounded-[18px] bg-white/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] flex items-start gap-2.5 backdrop-blur-md"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-xs font-mono text-nexus-on-surface leading-snug">
                            {cap}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AppleGlassCard>
              );
            })()}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 5: THE OUTCOME — CLOSE WITH A CLEAR PROMISE */}
        {/* ========================================================================= */}
        <section className="py-28 px-6 lg:px-16 relative overflow-hidden">
          <AppleGlassCard className="max-w-4xl mx-auto text-center space-y-8 relative z-10 py-16 px-8 sm:px-12" hoverScale={1.005}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-nexus-on-surface-variant text-xs font-mono font-semibold backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Chapter 5 · Operational Resolution</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-nexus-on-surface leading-tight apple-display">
              Don&apos;t just track movement.
              <br />
              <span className="text-nexus-secondary">Shape the outcome.</span>
            </h2>

            <p className="text-base sm:text-xl text-nexus-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Connect the signals, understand what is changing, and help your team make better operational decisions across every mile.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-full bg-nexus-primary text-white font-mono text-xs font-bold shadow-tactile-lg hover:bg-nexus-primary/95 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Access Your Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/features"
                className="px-8 py-3.5 rounded-full border border-black/[0.1] dark:border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.1] text-nexus-on-surface font-mono text-xs font-semibold transition-colors flex items-center justify-center gap-2 active:scale-[0.98] backdrop-blur-md"
              >
                <span>Explore Capabilities</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </AppleGlassCard>
        </section>
      </main>

      {/* Restrained Architectural Footer */}
      <footer className="border-t border-nexus-outline-variant/30 bg-nexus-surface-lowest px-6 lg:px-16 py-14 text-xs font-mono text-nexus-on-surface-variant">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-nexus-on-surface font-bold text-sm">
              <LogoMark size={24} />
              <span>Nexus Logistics OS</span>
            </div>
            <p className="leading-relaxed text-[11px] text-nexus-on-surface-variant max-w-xs">
              Intelligent logistics operating system connecting telemetry streams, corridor physics, and human operations.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-nexus-on-surface block">Workspaces</span>
            <ul className="space-y-1.5">
              <li><Link href="/login?role=OPERATIONS_MANAGER" className="hover:text-nexus-on-surface transition-colors">Operations Manager</Link></li>
              <li><Link href="/login?role=OPERATOR" className="hover:text-nexus-on-surface transition-colors">Fleet Operator</Link></li>
              <li><Link href="/login?role=ANALYST" className="hover:text-nexus-on-surface transition-colors">Supply Chain Analyst</Link></li>
              <li><Link href="/login?role=ADMINISTRATOR" className="hover:text-nexus-on-surface transition-colors">System Administrator</Link></li>
              <li><Link href="/login?role=VIEWER" className="hover:text-nexus-on-surface transition-colors">Executive Viewer</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-nexus-on-surface block">Product</span>
            <ul className="space-y-1.5">
              <li><Link href="/features" className="hover:text-nexus-on-surface transition-colors">Platform Capabilities</Link></li>
              <li><Link href="/live-world" className="hover:text-nexus-on-surface transition-colors">Live World Map</Link></li>
              <li><Link href="/driver-pass" className="hover:text-nexus-on-surface transition-colors">Driver Gateway Pass</Link></li>
              <li><Link href="/faq" className="hover:text-nexus-on-surface transition-colors">Operational FAQ</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-nexus-on-surface block">Security &amp; Governance</span>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5 text-nexus-on-surface">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Tenant Isolation Enforced</span>
              </li>
              <li><span>PostgreSQL Row-Level Security</span></li>
              <li><span>Cryptographic SHA-256 Ledger</span></li>
              <li><span>SOC 2 Type II Aligned</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-nexus-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span>© {new Date().getFullYear()} Nexus Autonomous Logistics Platform. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="hover:text-nexus-on-surface transition-colors">Contact Support</Link>
            <Link href="/feedback" className="hover:text-nexus-on-surface transition-colors">Feedback</Link>
            <Link href="/features" className="hover:text-nexus-on-surface transition-colors">Platform Overview</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
