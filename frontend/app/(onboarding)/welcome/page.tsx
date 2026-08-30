"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar3D } from "@/components/avatar/Avatar3D";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Sliders, Shield, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/ui/motion-animations";
import { motion, AnimatePresence } from "motion/react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [workspaceName, setWorkspaceName] = React.useState("NEXUS Continental Fleet");
  const [region, setRegion] = React.useState("North America Central");
  const [simulationPref, setSimulationPref] = React.useState(true);

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col items-center justify-center p-6 select-none">
      <FadeIn className="w-full max-w-xl space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-mono-data text-nexus-on-surface-variant px-2">
          <span>SETUP WIZARD · STEP {step} OF 3</span>
          <span>{step === 1 ? "WELCOME" : step === 2 ? "ENVIRONMENT" : "SECURITY & SIMULATION"}</span>
        </div>

        <div className="flex justify-center -mb-2">
          <Avatar3D mood={step === 1 ? "WELCOME" : step === 2 ? "LOADING" : "SUCCESS"} size="lg" />
        </div>

        <Card className="shadow-tactile-lg">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CardHeader>
                  <div>
                    <CardTitle>Welcome to NEXUS</CardTitle>
                    <CardDescription>
                      Configure your high-density operational intelligence environment.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-nexus-on-surface leading-relaxed">
                    NEXUS combines live spatial digital twins with pure deterministic decision simulation.
                    Every vehicle, warehouse, route, and incident is unified into a single tactile command surface.
                  </p>
                  <div className="p-4 rounded-xl bg-nexus-surface-container/60 border border-nexus-outline-variant/30 space-y-2 text-xs font-mono-data">
                    <div className="flex items-center gap-2 text-nexus-on-surface">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Real-time spatial digital twin with WebGL & GIS engines</span>
                    </div>
                    <div className="flex items-center gap-2 text-nexus-on-surface">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Deterministic What-If scenario branching</span>
                    </div>
                    <div className="flex items-center gap-2 text-nexus-on-surface">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Groq LLaMA 3.3 executive command briefings</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setStep(2)} variant="primary" className="ml-auto font-mono-data text-xs">
                    Continue Setup
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardFooter>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CardHeader>
                  <div>
                    <CardTitle>Operational Environment</CardTitle>
                    <CardDescription>
                      Designate default hub coordinates and telemetry streaming parameters.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-nexus-on-surface font-mono-data uppercase">
                      Workspace Identifier
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="tactile-input w-full px-3.5 py-2 text-sm text-nexus-on-surface"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-nexus-on-surface font-mono-data uppercase">
                      Operational Region Hub
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="tactile-input w-full px-3.5 py-2 text-sm text-nexus-on-surface"
                    >
                      <option value="North America Central">North America Central (Chicago / Dallas)</option>
                      <option value="North America East">North America East (New York / Atlanta)</option>
                      <option value="North America West">North America West (Seattle / Denver)</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button onClick={() => setStep(1)} variant="secondary" className="font-mono-data text-xs">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} variant="primary" className="font-mono-data text-xs">
                    Next Step
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardFooter>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CardHeader>
                  <div>
                    <CardTitle>Simulation Engine & Readiness</CardTitle>
                    <CardDescription>
                      Verify your deterministic calculation engine and launch command center.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl simulation-layer border border-purple-500/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-700" />
                      <span className="text-xs font-bold text-nexus-on-surface font-mono-data uppercase">
                        Pure Deterministic Engine: Online
                      </span>
                    </div>
                    <p className="text-xs text-nexus-on-surface-variant leading-relaxed">
                      Auto-simulate detected incidents when severity exceeds HIGH. Re-routes will be calculated
                      hypothetically and presented in the Simulation Lab.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button onClick={() => setStep(2)} variant="secondary" className="font-mono-data text-xs">
                    Back
                  </Button>
                  <Button onClick={() => router.push("/overview")} variant="primary" className="font-mono-data text-xs">
                    Launch Command Center
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </FadeIn>
    </div>
  );
}
