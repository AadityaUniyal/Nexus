"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { SimulationItem } from "@/lib/mock-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

import { dataProvider } from "@/lib/data-provider";
import { useAvatarStore } from "@/lib/avatar-store";
import { tactileAudio } from "@/lib/sound-effects";

export default function SimulationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const simId = params?.id as string;

  const [simulation, setSimulation] = React.useState<SimulationItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isApplying, setIsApplying] = React.useState(false);

  React.useEffect(() => {
    async function loadSim() {
      try {
        const found = await dataProvider.getSimulation(simId);
        if (found) setSimulation(found);
      } catch {}
    }
    if (simId) loadSim();
  }, [simId]);

  const handleApplyDecision = async () => {
    if (!simulation) return;
    setIsApplying(true);
    useAvatarStore.getState().triggerEvent("SIMULATION_RUNNING");

    try {
      const applied = await dataProvider.applyDecision(simulation.id, "Sarah Chen");
      setSimulation(applied);
      useAvatarStore.getState().triggerEvent("DECISION_APPLIED");
      tactileAudio.playSuccessChord();

      toast({
        title: "Decision Applied Transactionally",
        message: `Scenario ${applied.code} committed to live PostgreSQL dispatch. Vehicle NX-104 rerouted.`,
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Application Error",
        message: err?.message || "Failed to apply decision transactionally.",
        type: "critical",
      });
    } finally {
      setIsApplying(false);
    }
  };

  if (!simulation) return null;

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          href="/simulations"
          className="inline-flex items-center gap-1.5 text-xs font-mono-data text-nexus-on-surface-variant hover:text-nexus-on-surface transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Simulation Lab</span>
        </Link>

        {/* Header Summary */}
        <div className="p-6 rounded-2xl simulation-layer border border-purple-500/40 bg-purple-500/[0.02] shadow-tactile space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-data font-bold text-purple-700 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
                  {simulation.code}
                </span>
                <Badge
                  variant={simulation.status === "APPLIED" ? "healthy" : "simulation"}
                  size="sm"
                >
                  {simulation.status}
                </Badge>
                <span className="text-xs text-nexus-on-surface-variant font-mono-data">
                  Evaluated {formatDateTime(simulation.createdAt)}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-nexus-on-surface tracking-tight">
                {simulation.title}
              </h1>
            </div>

            {simulation.status !== "APPLIED" ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyDecision}
                isLoading={isApplying}
                className="font-mono-data text-xs shadow-tactile-lg bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                Apply Decision to Live Dispatch
              </Button>
            ) : (
              <Badge variant="healthy" size="md">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Applied by {simulation.appliedBy || "Sarah Chen"}
              </Badge>
            )}
          </div>

          <p className="text-sm text-nexus-on-surface leading-relaxed">{simulation.description}</p>
        </div>

        {/* Comparative Decision Matrix: Baseline vs Simulation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Comparative Decision Matrix</CardTitle>
            <CardDescription>Mathematical side-by-side trade-off analysis</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Baseline Scenario (Status Quo) */}
              <div className="p-5 rounded-xl bg-nexus-surface-container/40 border border-nexus-outline-variant/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-data font-bold text-nexus-on-surface-variant uppercase">
                    Baseline: Holding Pattern
                  </span>
                  <Badge variant="critical" size="sm">
                    Status Quo
                  </Badge>
                </div>

                <div className="space-y-3 font-mono-data text-xs">
                  <div className="flex justify-between py-1 border-b border-nexus-outline-variant/20">
                    <span className="text-nexus-on-surface-variant">Projected Delay:</span>
                    <span className="font-bold text-red-700">+{simulation.baselineMetrics.projectedDelayMins} mins</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-nexus-outline-variant/20">
                    <span className="text-nexus-on-surface-variant">Total Route Distance:</span>
                    <span className="font-semibold text-nexus-on-surface">{simulation.baselineMetrics.totalDistanceKm} km</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-nexus-outline-variant/20">
                    <span className="text-nexus-on-surface-variant">SLA Breach Risk:</span>
                    <span className="font-bold text-red-700">{simulation.baselineMetrics.slaBreachRiskPct}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-nexus-on-surface-variant">Operational Cost:</span>
                    <span className="font-semibold text-nexus-on-surface">{formatCurrency(simulation.baselineMetrics.totalCostUsd)}</span>
                  </div>
                </div>
              </div>

              {/* Simulated Scenario (Recommended Reroute) */}
              <div className="p-5 rounded-xl simulation-layer border border-purple-500/40 bg-purple-500/[0.03] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-data font-bold text-purple-700 uppercase">
                    Simulated: I-70 South Bypass
                  </span>
                  <Badge variant="simulation" size="sm">
                    Pareto Optimal
                  </Badge>
                </div>

                <div className="space-y-3 font-mono-data text-xs">
                  <div className="flex justify-between py-1 border-b border-purple-500/20">
                    <span className="text-nexus-on-surface-variant">Net Time Saved:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      +{simulation.simulatedMetrics.netTimeSavedMins} mins recovered
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-purple-500/20">
                    <span className="text-nexus-on-surface-variant">Total Route Distance:</span>
                    <span className="font-semibold text-nexus-on-surface">{simulation.simulatedMetrics.totalDistanceKm} km (+85km)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-purple-500/20">
                    <span className="text-nexus-on-surface-variant">SLA Breach Risk:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{simulation.simulatedMetrics.slaBreachRiskPct}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-nexus-on-surface-variant">Cost Surcharge:</span>
                    <span className="font-semibold text-nexus-on-surface">
                      +${simulation.simulatedMetrics.costDeltaUsd} ({formatCurrency(simulation.simulatedMetrics.totalCostUsd)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          {/* AI Executive Briefing */}
          <CardFooter className="pt-4 flex-col items-start gap-2 bg-nexus-surface-container/30 border-t border-nexus-outline-variant/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-700" />
              <span className="text-xs font-bold text-nexus-on-surface font-mono-data uppercase">
                Groq AI Executive Commentary
              </span>
            </div>
            <p className="text-xs text-nexus-on-surface leading-relaxed font-sans">
              {simulation.aiBriefing ||
                "Rerouting NX-TRK-104 via the I-70 South corridor recovers 135 minutes with minimal $80 operational fuel surcharge. Highly recommended to preserve AeroTech SLA compliance."}
            </p>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}
