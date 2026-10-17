"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  LineChart,
  ScanSearch,
  GitBranch,
  FileText,
  ShieldCheck,
  Database,
  Cloud,
  Gauge,
  Check,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Truck,
  Building2,
  Activity,
  Globe2,
  DollarSign,
  Leaf,
  Layers,
  Zap,
  Box,
  CheckCircle2,
  Shield,
  Cpu,
  ChevronRight,
  Sliders,
  Users,
  Compass,
  Lock,
  Workflow,
  Radio,
  Clock,
  Terminal,
  ExternalLink,
  Mail,
  Github,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NexusScrollytellingStage } from "@/components/brand/NexusScrollytellingStage";

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

const PROPRIETARY_FEATURES = [
  {
    icon: Activity,
    title: "Sub-Second StreamGrid™ Telemetry",
    body: "Ingest high-frequency GPS coordinates, battery state-of-charge, engine RPM, and cold-chain thermal telemetry with sub-18ms latency.",
    tag: "StreamGrid™ Ingestion",
  },
  {
    icon: GitBranch,
    title: "Kinetic Reroute Matrix™",
    body: "Evaluates rolling resistance, aerodynamic drag, mountain grade deltas, and Monte Carlo confidence intervals before dispatching detours.",
    tag: "Kinetic Physics",
  },
  {
    icon: Sparkles,
    title: "Nexus Neural Engine™",
    body: "Autonomous situation intelligence synthesizing atmospheric corridor hazards, dock congestion, and actionable executive briefings.",
    tag: "Neural Core",
  },
  {
    icon: ScanSearch,
    title: "Automated ML Anomaly Hunter",
    body: "Unsupervised Isolation Forest algorithms detecting micro-delays, route variances, and mechanical anomalies in real time.",
    tag: "Anomaly Detection",
  },
  {
    icon: ShieldCheck,
    title: "Aegis Verifiable State Protocol™",
    body: "Execute approved reroutes with optimistic database locks and immutable cryptographic audit trails in sovereign storage.",
    tag: "ACID Guaranteed",
  },
  {
    icon: Lock,
    title: "4-Tier Enterprise Isolation",
    body: "Strict multi-tenant security partitions with dedicated RBAC access for Solo Admins and 3 supervisory operational tiers.",
    tag: "Enterprise Ready",
  },
];

const PROPRIETARY_STACK = [
  { icon: Gauge, name: "Nexus Sovereign Edge Grid", desc: "Sub-second edge compute, ultra-low latency caching & global distribution" },
  { icon: Cpu, name: "Nexus Neural Engine™", desc: "Autonomous multi-variable situation reasoning & dispatch synthesis" },
  { icon: Database, name: "Nexus ACID State Ledger", desc: "High-performance operational state repository with async pooling" },
  { icon: Zap, name: "Kinetic Reroute Matrix™", desc: "Deterministic physics acceleration & energy optimization equations" },
  { icon: Layers, name: "Nexus DeepStorage Medallion™", desc: "Bronze / Silver / Gold multi-tier telemetry lakehouse" },
  { icon: Shield, name: "Aegis Cryptographic Enclave", desc: "Hardware-backed cryptographic signing & immutable compliance auditing" },
];

const ROLES_OVERVIEW = [
  {
    level: "Solo Executive Admin",
    title: "Company Solo Administrator (COO)",
    roleTag: "Master Governance",
    badgeVariant: "simulation" as const,
    icon: ShieldCheck,
    desc: "Oversees company logistics governance, tunes automated reroute policy thresholds, manages cloud partitions, and delegates supervisory authority.",
    primaryPath: "/admin/company",
    features: [
      "Custom SLA & Delay Threshold Policies",
      "Multi-Hub Capacity & ESG Carbon Accounting",
      "Dedicated Enterprise Workspace Partitioning",
      "Supervisor Team Provisioning & Audit Export",
    ],
  },
  {
    level: "Level 1 Supervisor",
    title: "Regional Operations Director",
    roleTag: "Regional Multi-Hub",
    badgeVariant: "healthy" as const,
    icon: Sparkles,
    desc: "Maintains high-level oversight across regional distribution hubs, analyzes macro corridor health, and triggers executive AI briefings during critical disruptions.",
    primaryPath: "/overview",
    features: [
      "Cross-Regional Hub Throughput Tracking",
      "Executive Situation Intelligence Briefings",
      "High-Impact Incident Escalation & Response",
      "Fleet Utilization & Bottleneck Analytics",
    ],
  },
  {
    level: "Level 2 Supervisor",
    title: "Fleet & Hub Dispatch Supervisor",
    roleTag: "Active Operations",
    badgeVariant: "ai" as const,
    icon: Truck,
    desc: "Coordinates active vehicle dispatches, runs deterministic detour simulations, verifies battery charging buffers, and communicates directly with fleet drivers.",
    primaryPath: "/operations",
    features: [
      "Live Vehicle Telematics & Corridor Tracking",
      "What-If Detour Simulation & Pareto Optimization",
      "EV Battery State & Charging Reserve Validation",
      "One-Click Transactional Route Mutations",
    ],
  },
  {
    level: "Level 3 Supervisor",
    title: "Field Safety & Incident Specialist",
    roleTag: "Hazard Mitigation",
    badgeVariant: "critical" as const,
    icon: AlertTriangle,
    desc: "Triages severe weather hazards (blizzards, black ice, storms), monitors pharmaceutical cold-chain temperatures, and tracks live spatial terrain in 3D.",
    primaryPath: "/incidents",
    features: [
      "Real-Time Weather Radar & Hazard Overlays",
      "Cold-Chain Thermal Sensor Breach Alerts",
      "Mechanical Breakdown & Emergency Assistance",
      "3D Spatial Digital Twin Fleet Inspection",
    ],
  },
];

/* Interactive ROI & Disruption Cost Calculator Component */
function InteractiveRoiCalculator() {
  const [fleetSize, setFleetSize] = React.useState(75);
  const [delaysPerWeek, setDelaysPerWeek] = React.useState(12);
  const [avgDelayMins, setAvgDelayMins] = React.useState(90);
  const [hourlyTruckCost, setHourlyTruckCost] = React.useState(110);

  const hoursLostPerYear = Math.round(delaysPerWeek * (avgDelayMins / 60) * 52);
  const annualCostOfDisruptions = Math.round(hoursLostPerYear * hourlyTruckCost);
  const recoveredHoursWithNexus = Math.round(hoursLostPerYear * 0.74); // 74% projected recovery
  const annualSavings = Math.round(annualCostOfDisruptions * 0.74);
  const co2OffsetTons = Math.round(recoveredHoursWithNexus * 0.082); // 82kg CO2 per idle/detour hour

  return (
    <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-tactile-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Fleet Disruption ROI Model
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mt-1">
            Calculate Disruption Recovery for Your Fleet
          </h3>
          <p className="text-xs text-stone-500 font-mono mt-1">
            Adjust fleet parameters below to simulate projected time and cost savings with autonomous rerouting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="healthy" size="md">
            74% Avg Delay Recovery
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Sliders Area */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-stone-800 dark:text-stone-200 mb-2">
              <span>Active Commercial Fleet Scale</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{fleetSize} Trucks</span>
            </div>
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={fleetSize}
              onChange={(e) => setFleetSize(parseInt(e.target.value))}
              className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-stone-800 dark:text-stone-200 mb-2">
              <span>Weather & Traffic Delays (Per Week)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{delaysPerWeek} Incidents</span>
            </div>
            <input
              type="range"
              min={2}
              max={50}
              step={1}
              value={delaysPerWeek}
              onChange={(e) => setDelaysPerWeek(parseInt(e.target.value))}
              className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-stone-800 dark:text-stone-200 mb-2">
              <span>Average Disruption Duration</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{avgDelayMins} Minutes</span>
            </div>
            <input
              type="range"
              min={30}
              max={240}
              step={15}
              value={avgDelayMins}
              onChange={(e) => setAvgDelayMins(parseInt(e.target.value))}
              className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-stone-800 dark:text-stone-200 mb-2">
              <span>Operating Cost (Fuel + Driver/hr)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">${hourlyTruckCost} / hr</span>
            </div>
            <input
              type="range"
              min={60}
              max={200}
              step={5}
              value={hourlyTruckCost}
              onChange={(e) => setHourlyTruckCost(parseInt(e.target.value))}
              className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>

        {/* Calculated Results Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-500">Projected Annual Net Savings</p>
              <p className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ${annualSavings.toLocaleString()}
              </p>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                From {recoveredHoursWithNexus.toLocaleString()} driver hours recovered annually.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-200/60 dark:border-stone-800 text-left">
              <div>
                <p className="text-[10px] font-mono text-stone-500 uppercase">SLA Boost</p>
                <p className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5">+4.8% SLA</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-stone-500 uppercase">CO₂ Offset</p>
                <p className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5">{co2OffsetTons} Tons/yr</p>
              </div>
            </div>
          </div>

          <Link href="/signup" className="w-full">
            <Button variant="primary" size="md" className="w-full font-mono text-xs font-semibold gap-2 shadow-tactile">
              Provision Workspace for {fleetSize} Trucks <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0c0c0e] text-stone-900 dark:text-stone-100 selection:bg-emerald-500/20 selection:text-emerald-700 font-sans">
      {/* 1. Master 3D Scrollytelling & Exploded View Sticky Hero Stage */}
      <NexusScrollytellingStage />

      {/* 2. The 4-Phase Operational Loop (01 OBSERVE -> 02 PREDICT -> 03 ACT -> 04 GOVERN) */}
      <section id="loop" className="relative px-6 sm:px-12 py-28 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="healthy" size="sm">The 4-Phase Operational Loop</Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            How Autonomous Resilience Actually Works
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-mono">
            Nexus closes the gap between raw telemetry ingestion, physics simulation, and verifiable transaction execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Phase 01: OBSERVE */}
          <motion.div {...fade} transition={{ duration: 0.4, delay: 0.1 }}>
            <div className="h-full p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">01</span>
                  <Badge variant="healthy" size="sm">STREAMGRID™</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Observe</h3>
                  <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Living Spatial Network
                  </p>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Real-time sub-second GPS, battery thermal health, speed, and heading stream continuously from all fleet vehicles across global corridors.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 text-[11px] font-mono text-stone-600 dark:text-stone-400">
                ⚡ 1.2M+ Daily Stream Events at &lt;18ms latency
              </div>
            </div>
          </motion.div>

          {/* Phase 02: PREDICT */}
          <motion.div {...fade} transition={{ duration: 0.4, delay: 0.2 }}>
            <div className="h-full p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">02</span>
                  <Badge variant="critical" size="sm">ANOMALY HUNTER</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Predict</h3>
                  <p className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                    Atmospheric & Micro-Variance
                  </p>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Unsupervised ML algorithms pinpoint mountain pass blizzards, route variance, and cold-chain temperature breaches before customer delays occur.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 text-[11px] font-mono text-stone-600 dark:text-stone-400">
                ❄️ Instant Root-Cause & SLA Penalty Triaging
              </div>
            </div>
          </motion.div>

          {/* Phase 03: ACT */}
          <motion.div {...fade} transition={{ duration: 0.4, delay: 0.3 }}>
            <div className="h-full p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-purple-600 dark:text-purple-400">03</span>
                  <Badge variant="simulation" size="sm">KINETIC MATRIX™</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Act</h3>
                  <p className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                    What-If Branching Physics
                  </p>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Tests thousands of detour permutations against rolling resistance, grade angles, and fuel costs to calculate the Pareto optimal recovery path.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 text-[11px] font-mono text-stone-600 dark:text-stone-400">
                🎯 135 Mins Recovered & 94/100 Decision Score
              </div>
            </div>
          </motion.div>

          {/* Phase 04: GOVERN */}
          <motion.div {...fade} transition={{ duration: 0.4, delay: 0.4 }}>
            <div className="h-full p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">04</span>
                  <Badge variant="ai" size="sm">AEGIS PROTOCOL™</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Govern</h3>
                  <p className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5">
                    Verifiable State Ledger
                  </p>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Mutations are atomically locked, verified against company policy guardrails, and written to an immutable cryptographic compliance ledger.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 text-[11px] font-mono text-stone-600 dark:text-stone-400">
                🔒 Cryptographic Proof & SOC-2 Audit Trail
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Enterprise Differentiation: Why Nexus Wins vs. Legacy TMS */}
      <section className="px-6 sm:px-12 py-24 bg-stone-100/70 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="simulation" size="sm">The Competitive Edge</Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Why Legacy TMS Fails Volatility
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-mono">
              Comparing outdated relational dispatch systems against the Nexus Autonomous Intelligence Engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Legacy TMS */}
            <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <span className="text-sm font-mono font-bold text-rose-600">TRADITIONAL TMS &amp; ERPs</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-mono">Legacy Model</span>
              </div>
              <ul className="space-y-4 text-xs font-mono text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Batch updates with 15–30 minute polling intervals that miss highway bottlenecks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Manual phone tree dispatch when severe weather closes interstate corridors.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>No physics calculations — routes ignore elevation grade and EV battery consumption.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Fragmented spreadsheets with zero immutable compliance or cryptographic audit logs.</span>
                </li>
              </ul>
            </div>

            {/* Nexus Sovereign OS */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white to-cyan-500/10 dark:from-emerald-950/30 dark:via-stone-900 dark:to-cyan-950/20 border-2 border-emerald-500/40 shadow-tactile-lg space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">NEXUS AUTONOMOUS SOVEREIGN OS</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500 text-white font-mono font-bold">Autonomous Standard</span>
              </div>
              <ul className="space-y-4 text-xs font-mono text-stone-800 dark:text-stone-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Sub-second stream processing with continuous living 3D digital twin synchronization.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Autonomous What-If branching computing mathematical Pareto optimal detour routes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Deterministic physics engine calculating aerodynamic drag and regenerative energy offset.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Aegis cryptographic ledger recording every state transition with tamper-proof signatures.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Bento Grid */}
      <section id="features" className="px-6 sm:px-12 py-24 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="healthy" size="sm">Platform Capabilities</Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            Engineered for High-Consequence Freight
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-mono">
            From atmospheric winter storms to maritime dock strikes, Nexus provides instant operational clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROPRIETARY_FEATURES.map((f, i) => (
            <motion.div key={f.title} {...fade} transition={{ duration: 0.4, delay: i * 0.08 }}>
              <div className="h-full p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/50 hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 font-semibold">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">{f.title}</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 font-mono leading-relaxed">{f.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. 4-Tier Company Roles & Governance Section */}
      <section id="roles" className="px-6 sm:px-12 py-24 bg-stone-100/70 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="simulation" size="sm">Organizational Architecture</Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Built for the Solo Admin &amp; 3 Supervisory Tiers
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-mono">
              Every persona in your organization operates in a dedicated, isolated workspace tailored to their exact scope of command.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES_OVERVIEW.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md hover:border-emerald-500/40 transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant={r.badgeVariant} size="sm">
                        {r.level}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">{r.title}</h3>
                      <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        {r.roleTag}
                      </p>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 font-mono leading-relaxed">
                      {r.desc}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                      {r.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2 text-[11px] font-mono text-stone-700 dark:text-stone-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link href="/login" className="w-full">
                    <Button variant="secondary" size="sm" className="w-full font-mono text-xs font-semibold gap-1.5">
                      Enter as {r.level.split(" ")[0]} →
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Interactive ROI Calculator */}
      <section id="calculator" className="px-6 sm:px-12 py-20 max-w-7xl mx-auto">
        <motion.div {...fade}>
          <InteractiveRoiCalculator />
        </motion.div>
      </section>

      {/* 7. Proprietary Technology Architecture */}
      <section id="architecture" className="px-6 sm:px-12 py-20 bg-stone-100/70 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="simulation" size="sm">Proprietary Technology</Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Nexus Technology Architecture
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-mono">
              Designed from the ground up for microsecond latency, mathematical precision, and verifiable state integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROPRIETARY_STACK.map((s) => (
              <div key={s.name} className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-start gap-3 shadow-sm">
                <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 shrink-0 mt-0.5">
                  <s.icon className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{s.name}</p>
                  <p className="text-[11px] text-stone-500 font-mono mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Call to Action Banner */}
      <section className="px-6 sm:px-12 py-24 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
          <ShieldCheck className="h-3.5 w-3.5" /> Sovereign Enterprise Security
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-100">
          Ready to Modernize Your Fleet Operations?
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 font-mono max-w-xl mx-auto">
          Provision your company partition to activate sub-second fleet telematics, autonomous rerouting, and compliance governance.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/signup">
            <Button variant="primary" size="lg" className="font-mono text-sm font-semibold gap-2 shadow-tactile-lg px-8">
              Provision Company Workspace <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg" className="font-mono text-sm font-semibold gap-2 px-6">
              Sign In to Command Portal →
            </Button>
          </Link>
        </div>
      </section>

      {/* 9. Developer & Enterprise Contact Footer */}
      <footer className="border-t border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 py-12 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100 font-mono">NEXUS</span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-stone-500 font-mono">Autonomous Operational Logistics Platform</span>
            </div>
            <p className="text-[11px] text-stone-400 font-mono mt-1">
              Engineered with deterministic physics, sub-second telemetry, and cryptographic state governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <a
              href="mailto:aadityauniyal@gmail.com"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 transition-colors font-medium"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>aadityauniyal@gmail.com</span>
            </a>

            <a
              href="https://github.com/AadityaUniyal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 transition-colors font-medium"
            >
              <Github className="w-3.5 h-3.5" />
              <span>github.com/AadityaUniyal</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>

            <Link
              href="/contact"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
            >
              Enterprise Inquiries
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 text-center text-[11px] text-stone-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Nexus Platform. Developed by Aaditya Uniyal. All proprietary rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:underline">FAQ</Link>
            <Link href="/features" className="hover:underline">Features</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
