"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Layers,
  Zap,
  Database,
  Upload,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusLed } from "@/components/ui/status-led";

export default function WelcomePage() {
  const router = useRouter();
  const [useSampleData, setUseSampleData] = React.useState(true);

  const handleGetStarted = () => {
    // Store preference
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_use_sample_data", useSampleData ? "true" : "false");
      localStorage.setItem("nexus_onboarding_completed", "false");
    }

    if (useSampleData) {
      // Go to quick tour with sample data
      router.push("/onboarding/quick-tour");
    } else {
      // Go to data import flow
      router.push("/onboarding/import-data");
    }
  };

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col items-center justify-center px-6 py-12">
      {/* Background glow effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nexus-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile mb-6">
            <StatusLed status="HEALTHY" size="sm" />
            <span className="text-xs font-mono-data text-nexus-on-surface font-semibold tracking-wide">
              NEXUS OPERATIONAL INTELLIGENCE
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-nexus-on-surface tracking-tight mb-4">
            Welcome to NEXUS
          </h1>
          <p className="text-lg text-nexus-on-surface-variant max-w-2xl mx-auto">
            Your operational intelligence and decision-simulation platform for managing
            complex logistics networks.
          </p>
        </motion.div>

        {/* Video Preview (Placeholder) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-nexus-surface-container border border-nexus-outline-variant/40 shadow-tactile-lg">
            {/* Placeholder for video */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="p-6 rounded-full bg-nexus-primary-container/80 backdrop-blur-sm">
                <Play className="h-12 w-12 text-white" />
              </div>
              <p className="text-sm font-mono-data text-nexus-on-surface-variant">
                30-Second Product Tour (Coming Soon)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Data Choice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-xl font-bold text-nexus-on-surface mb-4 text-center">
            How would you like to get started?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sample Data Option */}
            <button
              onClick={() => setUseSampleData(true)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                useSampleData
                  ? "border-nexus-secondary bg-nexus-secondary/5 shadow-tactile-md"
                  : "border-nexus-outline-variant hover:border-nexus-outline bg-nexus-surface-container-lowest"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 rounded-lg bg-nexus-secondary/10">
                  <Sparkles className="h-6 w-6 text-nexus-secondary" />
                </div>
                {useSampleData && (
                  <CheckCircle2 className="h-5 w-5 text-nexus-secondary" />
                )}
              </div>
              <h3 className="font-bold text-nexus-on-surface mb-2">
                Explore with Sample Data
              </h3>
              <p className="text-sm text-nexus-on-surface-variant leading-relaxed mb-3">
                Try NEXUS with a pre-configured scenario: 30 vehicles facing an I-80
                blizzard emergency. Perfect for testing features.
              </p>
              <Badge variant="neutral" size="sm">
                Recommended for first-time users
              </Badge>
            </button>

            {/* Import Data Option */}
            <button
              onClick={() => setUseSampleData(false)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                !useSampleData
                  ? "border-nexus-secondary bg-nexus-secondary/5 shadow-tactile-md"
                  : "border-nexus-outline-variant hover:border-nexus-outline bg-nexus-surface-container-lowest"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Upload className="h-6 w-6 text-purple-700 dark:text-purple-400" />
                </div>
                {!useSampleData && (
                  <CheckCircle2 className="h-5 w-5 text-nexus-secondary" />
                )}
              </div>
              <h3 className="font-bold text-nexus-on-surface mb-2">
                Import Your Fleet Data
              </h3>
              <p className="text-sm text-nexus-on-surface-variant leading-relaxed mb-3">
                Connect your real fleet, routes, and warehouse data via CSV import or API
                integration.
              </p>
              <Badge variant="outline" size="sm">
                For production use
              </Badge>
            </button>
          </div>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Globe2, label: "3D Live World" },
              { icon: Layers, label: "Simulations" },
              { icon: Zap, label: "Real-time Alerts" },
              { icon: Database, label: "Analytics" },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 text-center"
              >
                <feature.icon className="h-6 w-6 mx-auto mb-2 text-nexus-on-surface-variant" />
                <p className="text-xs font-medium text-nexus-on-surface">
                  {feature.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center"
        >
          <Button
            size="lg"
            variant="primary"
            onClick={handleGetStarted}
            className="shadow-tactile-lg font-mono-data"
          >
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-xs text-nexus-on-surface-variant mt-8"
        >
          Takes less than 2 minutes · No credit card required
        </motion.p>
      </div>
    </div>
  );
}
