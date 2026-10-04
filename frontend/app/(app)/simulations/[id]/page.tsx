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
      setLoading(true);
      try {
        const found = await dataProvider.getSimulation(simId);
        if (found) setSimulation(found);
      } catch (e) {
        console.error("Failed to load simulation:", e);
      } finally {
        setLoading(false);
      }
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

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-36 bg-nexus-surface-variant/40 rounded"></div>
          <div className="h-44 bg-nexus-surface-variant/30 rounded-2xl border border-nexus-outline-variant/30"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-72 bg-nexus-surface-variant/20 rounded-2xl"></div>
            <div className="h-72 bg-nexus-surface-variant/20 rounded-2xl"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!simulation) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto my-16 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-nexus-on-surface">Simulation Scenario Not Found</h2>
          <p className="text-sm text-nexus-on-surface-variant">The scenario {simId} could not be located in your active workspace.</p>
          <Link href="/simulations">
            <Button variant="primary" className="mt-4">
              Return to Simulation Lab
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

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
            {/* Environmental & Physics Telematics Row */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-nexus-outline-variant/30">
              <div className="p-3.5 rounded-xl bg-nexus-surface-container/30 border border-nexus-outline-variant/30 font-mono-data text-xs space-y-1">
                <span className="text-nexus-on-surface-variant text-[11px] uppercase">Terrain & Mountain Grade</span>
                <p className="text-base font-bold text-nexus-on-surface">Max 5.8% (I-70 Vail)</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Avoids 8.2% I-80 Cheyenne Icing</p>
              </div>

              <div className="p-3.5 rounded-xl bg-nexus-surface-container/30 border border-nexus-outline-variant/30 font-mono-data text-xs space-y-1">
                <span className="text-nexus-on-surface-variant text-[11px] uppercase">Fleet Carbon Footprint</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">-42.5 kg CO₂</p>
                <p className="text-[10px] text-nexus-on-surface-variant">Prevented 180 min idle engine burn</p>
              </div>

              <div className="p-3.5 rounded-xl bg-nexus-surface-container/30 border border-nexus-outline-variant/30 font-mono-data text-xs space-y-1">
                <span className="text-nexus-on-surface-variant text-[11px] uppercase">Thermal Brake Safety</span>
                <p className="text-base font-bold text-nexus-on-surface">98.4% Nominal</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Dynamic regenerative retarding active</p>
              </div>
            </div>

            {/* Turn-by-Turn Waypoint Recovery Timeline */}
            <div className="mt-6 pt-4 border-t border-nexus-outline-variant/30 space-y-3">
              <h4 className="text-xs font-mono-data font-bold uppercase text-nexus-on-surface">
                Turn-By-Turn Waypoint Recovery Execution
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono-data text-left">
                  <thead>
                    <tr className="text-nexus-on-surface-variant border-b border-nexus-outline-variant/20">
                      <th className="pb-2">Segment Waypoint</th>
                      <th className="pb-2">Corridor Condition</th>
                      <th className="pb-2">Baseline Delay</th>
                      <th className="pb-2">Simulated ETA</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-outline-variant/10 text-nexus-on-surface">
                    <tr>
                      <td className="py-2.5 font-bold">WP-1: North Platte Junction</td>
                      <td className="py-2.5 text-emerald-600">Clear Dry Asphalt (0°C)</td>
                      <td className="py-2.5">+0 min</td>
                      <td className="py-2.5">On Schedule (14:30)</td>
                      <td className="py-2.5 text-right"><Badge variant="healthy" size="sm">Passed</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold">WP-2: I-80 / I-70 Divergence (Sterling)</td>
                      <td className="py-2.5 text-purple-600 font-semibold">⚡ Detour Execution Point</td>
                      <td className="py-2.5 text-red-600">+180 min (I-80 Blizzard)</td>
                      <td className="py-2.5 text-emerald-600 font-bold">+0 min (I-70 South)</td>
                      <td className="py-2.5 text-right"><Badge variant="simulation" size="sm">Detour Branch</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold">WP-3: Denver Metro Bypass</td>
                      <td className="py-2.5 text-nexus-on-surface-variant">Light Traffic (55 km/h)</td>
                      <td className="py-2.5 text-red-600">Blocked</td>
                      <td className="py-2.5">Recovered (17:15)</td>
                      <td className="py-2.5 text-right"><Badge variant="attention" size="sm">Monitored</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold">WP-4: Salt Lake City Superhub</td>
                      <td className="py-2.5 text-emerald-600">Terminal Receiving Ready</td>
                      <td className="py-2.5 text-red-600">SLA Breach (+180m)</td>
                      <td className="py-2.5 text-emerald-600 font-bold">SLA Preserved (22:45)</td>
                      <td className="py-2.5 text-right"><Badge variant="healthy" size="sm">Destination</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cryptographic Execution State Receipt */}
            {simulation.status === "APPLIED" && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-mono-data font-bold text-emerald-700 dark:text-emerald-400">
                      ACID Cryptographic Transaction Committed
                    </span>
                  </div>
                  <Badge variant="healthy" size="sm">PostgreSQL Verified</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono-data text-nexus-on-surface-variant">
                  <p>State Root Hash: <span className="text-nexus-on-surface font-semibold">0x7f4a...9b12c8e3</span></p>
                  <p>Applied By: <span className="text-nexus-on-surface font-semibold">{simulation.appliedBy || "Sarah Chen"}</span></p>
                  <p>Execution Engine: <span className="text-nexus-on-surface font-semibold">Dual Groq-Gemini Consensus</span></p>
                  <p>Telematics Dispatched: <span className="text-nexus-on-surface font-semibold">NX-TRK-104 Live CAN-Bus</span></p>
                </div>
              </div>
            )}
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
