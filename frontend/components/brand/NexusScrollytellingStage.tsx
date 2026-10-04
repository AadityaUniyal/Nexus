"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  Zap,
  Radio,
  Lock,
  ChevronDown,
  Globe2,
  Gauge,
  Sliders,
  ScanSearch,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NexusExplodedCore3D } from "./NexusExplodedCore3D";
import { tactileAudio } from "@/lib/sound-effects";

export function NexusScrollytellingStage() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [currentStageIndex, setCurrentStageIndex] = React.useState(0);

  // Scroll listener computing normalized progress across the 450vh container
  React.useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!containerRef.current) return;
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const totalScrollable = rect.height - window.innerHeight;
          if (totalScrollable > 0) {
            const currentScrolled = -rect.top;
            const progress = Math.max(0, Math.min(1, currentScrolled / totalScrollable));
            setScrollProgress(progress);

            // Determine stage index
            let stage = 0;
            if (progress >= 0.75) stage = 3;
            else if (progress >= 0.48) stage = 2;
            else if (progress >= 0.22) stage = 1;
            else stage = 0;

            if (stage !== currentStageIndex) {
              setCurrentStageIndex(stage);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentStageIndex]);

  return (
    <div ref={containerRef} className="relative w-full h-[420vh] bg-[#09090b] text-white select-none">
      {/* Sticky Viewport (Pinned at top: 0, 100vh) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* Background 3D Exploded View Canvas */}
        <div className="absolute inset-0 z-0">
          <NexusExplodedCore3D scrollProgress={scrollProgress} />
        </div>

        {/* Ambient Top & Bottom Vignette Gradients */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/80 via-transparent to-black/90 z-10" />

        {/* Top Floating HUD Status Bar */}
        <header className="relative z-20 w-full px-6 pt-6 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black tracking-tighter text-sm">
              NX
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight block leading-none">NEXUS</span>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                Autonomous Sovereign Core
              </span>
            </div>
          </div>

          {/* Scrub Timeline Indicator */}
          <div className="hidden md:flex items-center gap-2 bg-stone-900/80 backdrop-blur-md border border-stone-800 px-3.5 py-1.5 rounded-full text-xs font-mono">
            <span className="text-stone-500">STAGE 0{currentStageIndex + 1}</span>
            <div className="w-24 h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-100 ease-out"
                style={{ width: `${Math.round(scrollProgress * 100)}%` }}
              />
            </div>
            <span className="text-emerald-400 font-bold">{Math.round(scrollProgress * 100)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs text-stone-300 hover:text-white font-mono">
                Operator Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm" className="text-xs font-mono gap-1.5 shadow-tactile">
                Launch Workspace <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Central Dynamic Scrollytelling Stage Content */}
        <main className="relative z-20 max-w-7xl mx-auto w-full px-6 flex-1 flex items-center justify-between">
          {/* Stage 0 (0% - 22%): Pure Unibody Hero Intro */}
          {currentStageIndex === 0 && (
            <motion.div
              key="stage-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-2xl space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Next-Gen Autonomous Logistics OS</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-white">
                Supply Chains Don&apos;t Wait.{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Neither Does Nexus.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-300 leading-relaxed font-normal max-w-xl">
                The world&apos;s first deterministic intelligence engine for enterprise logistics. Sub-second IoT
                telematics, kinetic reroute physics, and autonomous state execution with zero vendor lock-in.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/signup">
                  <Button variant="primary" size="lg" className="font-mono text-xs gap-2 shadow-tactile">
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/overview">
                  <Button variant="outline" size="lg" className="font-mono text-xs text-stone-200 border-stone-700 hover:bg-stone-800">
                    Live Operational Demo
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4 text-xs font-mono text-stone-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sub-Second Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Deterministic Physics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ACID State Ledger</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stage 1 (22% - 48%): Exploded View - Hardware & Intelligence Deconstruction */}
          {currentStageIndex === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-xl space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
                <Cpu className="w-3.5 h-3.5" />
                <span>Exploded Core Architecture</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Deconstructed for <br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Uncompromised Speed.
                </span>
              </h2>

              <p className="text-sm text-stone-300 leading-relaxed">
                Scroll to explore the layered hardware and neural inference stack powering autonomous fleet rerouting and
                spatial digital twin synchronization.
              </p>

              {/* Exploded Tech Callouts */}
              <div className="space-y-2.5 pt-2">
                <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-stone-100">
                      01. Optical Lidar & GPS Sensory Array
                    </h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Continuously captures vehicle velocity, heading, elevation grades, and weather radar anomalies.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-purple-300">
                      02. Nexus Neural Engine™ Core Crystal
                    </h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Sub-second situation synthesis evaluating supply bottlenecks, corridor closures, and multi-variable trade-offs.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-sky-300">
                      03. Sovereign StreamGrid™ Telemetry Bus
                    </h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      High-throughput optical interconnect processing 1.2M+ live state updates per second with &lt;18ms latency.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stage 2 (48% - 75%): Kinetic Physics & Recovery Matrix */}
          {currentStageIndex === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="ml-auto max-w-xl space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">
                <Zap className="w-3.5 h-3.5" />
                <span>Deterministic Physics Engine</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Kinetic Reroute Matrix™ <br />
                <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
                  Zero Second Guessing.
                </span>
              </h2>

              <p className="text-sm text-stone-300 leading-relaxed">
                When blizzards strike mountain passes or highway bottlenecks halt transit, Nexus tests thousands of
                alternative paths against rolling resistance, aerodynamic drag, and customer penalty models before dispatching.
              </p>

              {/* Real Physics Metrics HUD */}
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
                  <span className="text-[10px] text-stone-400 block uppercase">Time Recovered</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">+135 Mins</span>
                  <span className="text-[10px] text-stone-500">I-70 South Detour vs. I-80 Standstill</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
                  <span className="text-[10px] text-stone-400 block uppercase">SLA Breach Probability</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">12.0%</span>
                  <span className="text-[10px] text-stone-500">Reduced from 88.0% baseline hold</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
                  <span className="text-[10px] text-stone-400 block uppercase">Energy Offset</span>
                  <span className="text-xl font-black text-purple-400 mt-1 block">-18.4 kWh</span>
                  <span className="text-[10px] text-stone-500">Regenerative downhill braking</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
                  <span className="text-[10px] text-stone-400 block uppercase">Decision Score</span>
                  <span className="text-xl font-black text-purple-300 mt-1 block">94 / 100</span>
                  <span className="text-[10px] text-stone-500">Pareto Optimal Verdict</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stage 3 (75% - 100%): Aegis Cryptographic Governance & Curtain Peel */}
          {currentStageIndex === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-2xl mx-auto text-center space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mx-auto">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Aegis Verifiable State Protocol™</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Cryptographically Signed. <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Executed in Milliseconds.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
                Every reroute mutation is verified against optimistic concurrency locks, company policy guardrails, and
                immutable cryptographic state logs.
              </p>

              <div className="pt-3 flex items-center justify-center gap-3">
                <Link href="/signup">
                  <Button variant="primary" size="lg" className="font-mono text-xs gap-2 shadow-tactile">
                    Deploy Nexus in Your Fleet <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/features">
                  <Button variant="outline" size="lg" className="font-mono text-xs text-stone-300 border-stone-700 hover:bg-stone-800">
                    Explore Platform Features
                  </Button>
                </Link>
              </div>

              <div className="pt-6 text-stone-500 text-xs font-mono flex items-center justify-center gap-1.5 animate-bounce">
                <span>Scroll down to enter the Operational Loop</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </motion.div>
          )}
        </main>

        {/* Bottom Interactive HUD Timeline Scrub Bar */}
        <footer className="relative z-20 w-full px-6 pb-6 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>WebGL 3D Accelerated Engine</span>
          </div>

          <div className="flex items-center gap-2">
            {["Core Identity", "Exploded Architecture", "Kinetic Physics", "State Governance"].map((title, idx) => (
              <div
                key={idx}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono transition-all ${
                  currentStageIndex === idx
                    ? "bg-stone-800 text-white font-bold border border-stone-700"
                    : "text-stone-500 hover:text-stone-400"
                }`}
              >
                0{idx + 1}. {title}
              </div>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
