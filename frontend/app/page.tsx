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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollStory3D } from "@/components/brand/ScrollStory3D";
import { NexusHero3D } from "@/components/brand/NexusHero3D";

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

const FEATURES = [
  {
    icon: BarChart3,
    title: "Sub-Second IoT Telematics Engine",
    body: "Ingest live GPS coordinates, battery state-of-charge, engine RPM, and cold-chain temperature telemetry with zero lag.",
    tag: "Real-Time Ingestion",
  },
  {
    icon: GitBranch,
    title: "Deterministic Physics Simulation",
    body: "Model rolling resistance, aerodynamic drag, gradient deltas, and Monte Carlo SLA confidence before approving reroutes.",
    tag: "Physics Modeling",
  },
  {
    icon: Sparkles,
    title: "Dual-Provider Groq & Gemini AI",
    body: "Multi-LLM intelligence synthesizing corridor weather hazards, dock congestion delays, and executive situation briefings.",
    tag: "AI Synthesis",
  },
  {
    icon: ScanSearch,
    title: "Automated ML Anomaly Hunter",
    body: "Unsupervised Isolation Forest algorithms detecting micro-delays, route deviations, and mechanical anomalies in real time.",
    tag: "Anomaly Detection",
  },
  {
    icon: ShieldCheck,
    title: "Transactional ACID Execution",
    body: "Execute approved reroutes with optimistic database locks and immutable cryptographic audit trails in PostgreSQL.",
    tag: "ACID Guaranteed",
  },
  {
    icon: Lock,
    title: "4-Tier Enterprise Isolation",
    body: "Strict multi-tenant cloud partitions with dedicated RBAC access for Solo Admins and 3 supervisory operational tiers.",
    tag: "SOC-2 Ready",
  },
];

const STACK = [
  { icon: Gauge, name: "Vercel Edge Network", desc: "Next.js App Router, edge caching & global distribution" },
  { icon: Cloud, name: "Azure App Service", desc: "FastAPI asynchronous computational engine" },
  { icon: Database, name: "Neon Serverless Postgres", desc: "ACID operational database with asyncpg pooling" },
  { icon: Sparkles, name: "Groq & Gemini AI", desc: "Ultra-fast LLaMA 3.3 & Gemini 2.5 Flash synthesis" },
  { icon: Layers, name: "Azure Blob Storage", desc: "Bronze / Silver / Gold medallion telemetry lake" },
  { icon: Shield, name: "Azure Key Vault", desc: "Hardware-backed cryptographic secrets management" },
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
      "Dedicated Azure & Neon Database Partitioning",
      "Supervisor Team Provisioning & Audit Log",
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
      "Executive AI Situation Briefings (Groq/Gemini)",
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
    desc: "Triage severe weather hazards (blizzards, black ice, storms), monitors pharmaceutical cold-chain cargo temperatures, and tracks live spatial terrain in 3D.",
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

  const hoursLostPerYear = Math.round((delaysPerWeek * (avgDelayMins / 60)) * 52);
  const annualCostOfDisruptions = Math.round(hoursLostPerYear * hourlyTruckCost);
  const recoveredHoursWithNexus = Math.round(hoursLostPerYear * 0.74); // 74% projected recovery
  const annualSavings = Math.round(annualCostOfDisruptions * 0.74);
  const co2OffsetTons = Math.round(recoveredHoursWithNexus * 0.082); // 82kg CO2 per idle/detour hour

  return (
    <div className="rounded-3xl border border-nexus-outline-variant/60 bg-nexus-surface-lowest p-6 sm:p-8 shadow-tactile-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-nexus-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Fleet Disruption ROI Model
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-nexus-on-surface tracking-tight mt-1">
            Calculate Disruption Recovery for Your Fleet
          </h3>
          <p className="text-xs text-nexus-on-surface-variant font-mono-data mt-1">
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
            <div className="flex justify-between text-xs font-mono-data font-semibold text-nexus-on-surface mb-2">
              <span>Active Commercial Fleet Scale</span>
              <span className="text-nexus-primary font-bold">{fleetSize} Trucks</span>
            </div>
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={fleetSize}
              onChange={(e) => setFleetSize(parseInt(e.target.value))}
              className="w-full h-2 bg-nexus-surface-container rounded-lg appearance-none cursor-pointer accent-nexus-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono-data font-semibold text-nexus-on-surface mb-2">
              <span>Weather & Traffic Delays (Per Week)</span>
              <span className="text-nexus-primary font-bold">{delaysPerWeek} Incidents</span>
            </div>
            <input
              type="range"
              min={2}
              max={50}
              step={1}
              value={delaysPerWeek}
              onChange={(e) => setDelaysPerWeek(parseInt(e.target.value))}
              className="w-full h-2 bg-nexus-surface-container rounded-lg appearance-none cursor-pointer accent-nexus-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono-data font-semibold text-nexus-on-surface mb-2">
              <span>Average Disruption Duration</span>
              <span className="text-nexus-primary font-bold">{avgDelayMins} Minutes</span>
            </div>
            <input
              type="range"
              min={30}
              max={240}
              step={15}
              value={avgDelayMins}
              onChange={(e) => setAvgDelayMins(parseInt(e.target.value))}
              className="w-full h-2 bg-nexus-surface-container rounded-lg appearance-none cursor-pointer accent-nexus-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono-data font-semibold text-nexus-on-surface mb-2">
              <span>Operating Cost (Fuel + Driver/hr)</span>
              <span className="text-nexus-primary font-bold">${hourlyTruckCost} / hr</span>
            </div>
            <input
              type="range"
              min={60}
              max={200}
              step={5}
              value={hourlyTruckCost}
              onChange={(e) => setHourlyTruckCost(parseInt(e.target.value))}
              className="w-full h-2 bg-nexus-surface-container rounded-lg appearance-none cursor-pointer accent-nexus-primary"
            />
          </div>
        </div>

        {/* Calculated Results Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-nexus-surface-container/60 to-purple-500/5 rounded-2xl p-6 border border-nexus-outline-variant/40 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-mono-data uppercase text-nexus-on-surface-variant">
                Projected Annual Net Savings
              </p>
              <p className="text-3xl sm:text-4xl font-black font-mono-data text-emerald-600 dark:text-emerald-400 mt-1">
                ${annualSavings.toLocaleString()}
              </p>
              <p className="text-xs text-nexus-on-surface-variant font-mono-data mt-0.5">
                From {recoveredHoursWithNexus.toLocaleString()} driver hours recovered annually.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-nexus-outline-variant/30 text-left">
              <div>
                <p className="text-[10px] font-mono text-nexus-on-surface-variant uppercase">SLA Boost</p>
                <p className="text-base font-bold font-mono text-nexus-on-surface mt-0.5">+4.8% SLA</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-nexus-on-surface-variant uppercase">CO₂ Offset</p>
                <p className="text-base font-bold font-mono text-nexus-on-surface mt-0.5">{co2OffsetTons} Tons/yr</p>
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
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-nexus-outline-variant/40 bg-nexus-surface/85 backdrop-blur-md px-6 sm:px-12 h-16 flex items-center justify-between">
        <Logo href="/" size={32} />

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold font-mono-data text-nexus-on-surface-variant">
          <Link href="#aim" className="hover:text-nexus-on-surface transition-colors">Our Mission</Link>
          <Link href="#reveal" className="hover:text-nexus-on-surface transition-colors">3D Keynote</Link>
          <Link href="#features" className="hover:text-nexus-on-surface transition-colors">Features</Link>
          <Link href="#roles" className="hover:text-nexus-on-surface transition-colors">Company Roles</Link>
          <Link href="#calculator" className="hover:text-nexus-on-surface transition-colors">ROI Calculator</Link>
          <Link href="#architecture" className="hover:text-nexus-on-surface transition-colors">Architecture</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-mono text-xs font-semibold">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm" className="font-mono text-xs font-semibold shadow-tactile">
              Provision Workspace
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Announcement & Aim Section */}
      <section id="aim" className="relative px-6 sm:px-12 pt-20 pb-16 max-w-7xl mx-auto text-center space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-nexus-on-surface text-xs font-mono font-bold shadow-sm">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />
            <span>NEXUS 2.1 · Autonomous Operational Logistics Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-nexus-on-surface tracking-tight max-w-5xl mx-auto leading-[1.06]">
            Eliminate Logistics Disruption. <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-nexus-primary to-cyan-500">
              Autonomous Spatial Command.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-nexus-on-surface-variant max-w-3xl mx-auto font-mono-data leading-relaxed">
            Nexus empowers enterprise logistics organizations with sub-second IoT telemetry ingestion, deterministic physics What-If detour simulations, and dual-provider Groq &amp; Gemini AI synthesis. Designed for the Solo Company Admin and 3 supervisory operational tiers.
          </p>
        </motion.div>

        {/* Hero Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/signup">
            <Button variant="primary" size="lg" className="font-mono text-sm font-semibold gap-2 shadow-tactile-lg px-8">
              Provision Company Workspace <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg" className="font-mono text-sm font-semibold gap-2 px-6">
              Sign In to Portal →
            </Button>
          </Link>
        </div>

        {/* 3D Spatial Canvas Visualizer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 rounded-3xl border border-nexus-outline-variant/60 bg-nexus-surface-lowest p-3 sm:p-4 shadow-tactile-lg overflow-hidden text-left"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-nexus-outline-variant/30 mb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs font-mono-data font-bold text-nexus-on-surface">
                nexus · 3D spatial node topology &amp; corridor simulation mesh
              </span>
            </div>
            <Badge variant="healthy" size="sm">
              WebGL 3D Engine Ready
            </Badge>
          </div>

          <div className="h-[420px] sm:h-[500px] rounded-2xl overflow-hidden relative bg-black/5 dark:bg-black/40">
            <NexusHero3D currentStep={0} interactive={true} />
          </div>
        </motion.div>
      </section>

      {/* 3D Keynote Reveal Chapter Story Section */}
      <section id="reveal" className="px-6 sm:px-12 py-24 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="healthy" size="sm">The 7 Stages of Intelligence</Badge>
          <h2 className="text-3xl sm:text-5xl font-black text-nexus-on-surface tracking-tight">
            How Autonomous Logistics Truly Works
          </h2>
          <p className="text-xs sm:text-sm text-nexus-on-surface-variant font-mono-data">
            From raw sensor telemetry to transactional ACID live execution, explore our complete end-to-end architecture.
          </p>
        </div>

        {/* ScrollStory3D Interactive Three.js Component */}
        <ScrollStory3D />
      </section>

      {/* Core Architectural Capabilities Bento Grid */}
      <section id="features" className="px-6 sm:px-12 py-20 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="healthy" size="sm">Core Architecture</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-nexus-on-surface tracking-tight">
            Engineered for High-Consequence Freight
          </h2>
          <p className="text-xs sm:text-sm text-nexus-on-surface-variant font-mono-data">
            From atmospheric winter storms to maritime dock strikes, Nexus provides instant operational clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} {...fade} transition={{ duration: 0.4, delay: i * 0.08 }}>
              <div className="h-full p-6 rounded-2xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile flex flex-col justify-between space-y-4 hover:border-nexus-primary/50 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-nexus-surface-container text-nexus-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-nexus-surface-container text-nexus-on-surface-variant">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-nexus-on-surface">{f.title}</h3>
                  <p className="text-xs text-nexus-on-surface-variant font-mono-data leading-relaxed">{f.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4-Tier Company Roles & Hierarchy Section */}
      <section id="roles" className="px-6 sm:px-12 py-24 bg-nexus-surface-container-lowest border-y border-nexus-outline-variant/30">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="simulation" size="sm">Organizational Architecture</Badge>
            <h2 className="text-3xl sm:text-5xl font-black text-nexus-on-surface tracking-tight">
              Built for the Solo Admin &amp; 3 Supervisory Tiers
            </h2>
            <p className="text-xs sm:text-sm text-nexus-on-surface-variant font-mono-data">
              Every persona in your organization operates in a dedicated, isolated workspace tailored to their exact scope of command.
            </p>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES_OVERVIEW.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className="p-6 rounded-3xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile flex flex-col justify-between space-y-6 hover:border-nexus-primary/50 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-2xl bg-nexus-surface-container text-nexus-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant={r.badgeVariant} size="sm">
                        {r.level}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-nexus-on-surface">{r.title}</h3>
                      <p className="text-[11px] font-mono-data text-nexus-secondary font-semibold mt-0.5">
                        {r.roleTag}
                      </p>
                    </div>

                    <p className="text-xs text-nexus-on-surface-variant font-mono-data leading-relaxed">
                      {r.desc}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-nexus-outline-variant/20">
                      {r.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2 text-[11px] font-mono-data text-nexus-on-surface">
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

      {/* Interactive ROI Calculator Section */}
      <section id="calculator" className="px-6 sm:px-12 py-20 max-w-7xl mx-auto">
        <motion.div {...fade}>
          <InteractiveRoiCalculator />
        </motion.div>
      </section>

      {/* Cloud Stack & Multi-Tenant Infrastructure */}
      <section id="architecture" className="px-6 sm:px-12 py-20 bg-nexus-surface-container-lowest border-y border-nexus-outline-variant/30">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="simulation" size="sm">Cloud Infrastructure</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-nexus-on-surface tracking-tight">
              Enterprise Cloud &amp; AI Stack
            </h2>
            <p className="text-xs sm:text-sm text-nexus-on-surface-variant font-mono-data">
              Powered by Microsoft Azure, Neon Serverless PostgreSQL, Groq LLaMA 3.3, Google Gemini 2.5, and Vercel Edge compute.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STACK.map((s) => (
              <div key={s.name} className="p-4 rounded-2xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-nexus-surface-container text-nexus-on-surface shrink-0 mt-0.5">
                  <s.icon className="h-4 w-4 text-nexus-secondary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-nexus-on-surface">{s.name}</p>
                  <p className="text-[11px] text-nexus-on-surface-variant font-mono-data mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="px-6 sm:px-12 py-24 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
          <ShieldCheck className="h-3.5 w-3.5" /> Multi-Tenant Enterprise Security
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-nexus-on-surface tracking-tight">
          Ready to Modernize Your Fleet Operations?
        </h2>
        <p className="text-xs sm:text-sm text-nexus-on-surface-variant font-mono-data max-w-xl mx-auto">
          Provision your company partition to start tracking real-time fleet telematics, automated rerouting, and compliance governance.
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

      {/* Bottom Footer */}
      <footer className="border-t border-nexus-outline-variant/30 py-8 px-6 sm:px-12 text-center text-xs text-nexus-on-surface-variant font-mono-data">
        <p>© 2026 Nexus Operational Intelligence Platform. Multi-tenant ACID logistics gateway.</p>
      </footer>
    </div>
  );
}
