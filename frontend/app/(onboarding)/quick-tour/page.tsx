"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe2,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TOUR_STEPS = [
  {
    id: "overview",
    title: "Command Center Overview",
    description:
      "Your main dashboard shows fleet status, active incidents, and key performance metrics in real-time.",
    icon: Globe2,
    highlight: "Live telemetry from your entire network at a glance",
  },
  {
    id: "incident",
    title: "Autonomous Incident Detection",
    description:
      "NEXUS automatically flags anomalies like weather delays, vehicle issues, and route disruptions.",
    icon: TrendingUp,
    highlight: "Get notified immediately when something needs attention",
  },
  {
    id: "simulation",
    title: "What-If Scenario Testing",
    description:
      "Test alternative routes, resource allocation, and timing changes in a safe simulation layer before applying to live operations.",
    icon: Sparkles,
    highlight: "Make confident decisions with mathematical scenario modeling",
  },
];

export default function QuickTourPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [direction, setDirection] = React.useState(1);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_onboarding_completed", "true");
    }
    router.push("/overview");
  };

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Background glow effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nexus-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 p-2 rounded-lg hover:bg-nexus-surface-container text-nexus-on-surface-variant hover:text-nexus-on-surface transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="max-w-2xl w-full">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {TOUR_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentStep ? 1 : -1);
                setCurrentStep(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-nexus-secondary"
                  : index < currentStep
                  ? "w-2 bg-nexus-secondary/50"
                  : "w-2 bg-nexus-outline-variant"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-center"
          >
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-nexus-secondary/10 rounded-full blur-xl" />
                <div className="relative p-6 rounded-2xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 shadow-tactile-lg">
                  <Icon className="h-12 w-12 text-nexus-secondary" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-extrabold text-nexus-on-surface tracking-tight mb-3">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-base text-nexus-on-surface-variant leading-relaxed max-w-xl mx-auto mb-6">
              {step.description}
            </p>

            {/* Highlight */}
            <div className="inline-flex items-start gap-2 p-4 rounded-xl bg-nexus-secondary/5 border border-nexus-secondary/20 mb-10">
              <CheckCircle2 className="h-5 w-5 text-nexus-secondary shrink-0 mt-0.5" />
              <p className="text-sm text-nexus-on-surface font-medium">
                {step.highlight}
              </p>
            </div>

            {/* Interactive Step Preview Console */}
            <div className="p-6 rounded-2xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 shadow-tactile mb-10 text-left">
              {step.id === "overview" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-nexus-outline-variant/30 pb-2">
                    <span className="text-xs font-mono font-bold text-nexus-secondary uppercase">
                      Fleet Operations Dashboard · Real-Time Snapshot
                    </span>
                    <span className="text-xs font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                      ALL SYSTEMS NOMINAL
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-nexus-surface-container">
                      <p className="text-[10px] text-nexus-on-surface-variant uppercase font-mono">Fleet Velocity</p>
                      <p className="text-lg font-bold font-mono text-nexus-on-surface">64.8 km/h</p>
                      <p className="text-[10px] text-emerald-600">+2.4% vs baseline</p>
                    </div>
                    <div className="p-3 rounded-lg bg-nexus-surface-container">
                      <p className="text-[10px] text-nexus-on-surface-variant uppercase font-mono">Active Vehicles</p>
                      <p className="text-lg font-bold font-mono text-nexus-on-surface">42 / 48</p>
                      <p className="text-[10px] text-nexus-on-surface-variant">87.5% utilization</p>
                    </div>
                    <div className="p-3 rounded-lg bg-nexus-surface-container">
                      <p className="text-[10px] text-nexus-on-surface-variant uppercase font-mono">SLA Adherence</p>
                      <p className="text-lg font-bold font-mono text-nexus-secondary">98.4%</p>
                      <p className="text-[10px] text-emerald-600">Above 95% target</p>
                    </div>
                    <div className="p-3 rounded-lg bg-nexus-surface-container">
                      <p className="text-[10px] text-nexus-on-surface-variant uppercase font-mono">Network Units</p>
                      <p className="text-lg font-bold font-mono text-nexus-on-surface">71,650</p>
                      <p className="text-[10px] text-nexus-on-surface-variant">6 superhubs</p>
                    </div>
                  </div>
                </div>
              )}

              {step.id === "incident" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-nexus-outline-variant/30 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-600">
                        CRITICAL SEVERITY
                      </span>
                      <span className="text-xs font-mono font-bold text-nexus-on-surface">
                        INC-8041 · Road Weather Hazard
                      </span>
                    </div>
                    <span className="text-xs font-mono text-nexus-on-surface-variant">Detected: 14 mins ago</span>
                  </div>
                  <div className="p-4 rounded-xl bg-nexus-surface-container border border-red-500/20 space-y-2">
                    <h4 className="text-sm font-bold text-nexus-on-surface">
                      I-80 Wyoming Cheyenne Pass Blizzard Closure
                    </h4>
                    <p className="text-xs text-nexus-on-surface-variant leading-relaxed">
                      Sustained 55 mph crosswinds and zero-visibility icing conditions. 14 high-priority cargo shipments
                      at risk of delivery SLA breach. Estimated delay: 180 minutes.
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs font-mono">
                      <span className="text-nexus-on-surface-variant">Affected Vehicle: <strong className="text-nexus-on-surface">NX-TRK-104 (Freightliner eCascadia)</strong></span>
                      <span className="text-red-600 font-bold">Penalty Exposure: $4,200</span>
                    </div>
                  </div>
                </div>
              )}

              {step.id === "simulation" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-nexus-outline-variant/30 pb-2">
                    <span className="text-xs font-mono font-bold text-nexus-secondary uppercase">
                      What-If Deterministic Physics Simulation · SIM-901
                    </span>
                    <span className="text-xs font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                      PARETO RECOMMENDATION: 88.4/100
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-nexus-surface-container border border-nexus-outline-variant/30">
                      <p className="text-xs font-bold text-nexus-on-surface mb-1">Baseline Option (Wait on I-80)</p>
                      <ul className="text-xs text-nexus-on-surface-variant space-y-1 font-mono">
                        <li>· Delay Impact: +180 minutes</li>
                        <li>· SLA Breach Risk: 88.0%</li>
                        <li>· Total Added Cost: $4,200 (SLA fine)</li>
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/30">
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Counterfactual Detour (I-70 South)</p>
                      <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1 font-mono">
                        <li>· Net Time Saved: 135 minutes</li>
                        <li>· SLA Breach Risk: 12.0% (Reduced by 76%)</li>
                        <li>· Fuel Delta: +$80.00</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="font-mono-data"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSkip} className="font-mono-data">
              Skip Tour
            </Button>
            <Button variant="primary" onClick={handleNext} className="font-mono-data">
              {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
