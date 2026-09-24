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

            {/* Preview card (placeholder) */}
            <div className="p-8 rounded-2xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 shadow-tactile mb-10">
              <div className="aspect-video rounded-lg bg-nexus-surface-container flex items-center justify-center">
                <div className="text-center">
                  <Icon className="h-16 w-16 mx-auto mb-3 text-nexus-on-surface-variant opacity-40" />
                  <p className="text-sm font-mono-data text-nexus-on-surface-variant">
                    Interactive preview coming soon
                  </p>
                </div>
              </div>
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
