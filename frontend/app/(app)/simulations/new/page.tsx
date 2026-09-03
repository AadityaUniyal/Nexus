"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { MatrixScenarioVisualizer, VehicleCandidate } from "@/components/simulation/MatrixScenarioVisualizer";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export interface SimulationVariables {
  vehicleId?: string;
  currentRouteId?: string;
  alternateRouteType?: string;
  speedDeltaPct?: number;
  fuelCostPerKm?: number;
  priorityReordering?: boolean;
}

export interface BaseMetricsSnapshot {
  totalDistanceKm: number;
  avgDurationMins: number;
  currentDelayMins: number;
  ordersCount: number;
  totalOrderValue: number;
  baseCostUsd: number;
}

export interface SimulationResultMetrics {
  totalDistanceKm: number;
  totalDurationMins: number;
  projectedDelayMins: number;
  netTimeSavedMins: number;
  totalCostUsd: number;
  costDeltaUsd: number;
  slaBreachRiskPct: number;
  ordersAtRisk: number;
  recommendationScore: number;
  verdict: string;
  insights: string[];
}

const DEFAULT_METRICS: SimulationResultMetrics = {
  totalDistanceKm: 1705.0,
  totalDurationMins: 985,
  projectedDelayMins: 45,
  netTimeSavedMins: 135,
  totalCostUsd: 1530.70,
  costDeltaUsd: 80.70,
  slaBreachRiskPct: 12.0,
  ordersAtRisk: 1,
  recommendationScore: 94,
  verdict: "HIGHLY_RECOMMENDED",
  insights: [
    "Corridor diversion via I-70 South Bypass restores +135 minutes of transit margin.",
    "Dynamic SLA Priority preserves on-time delivery for high-value consignments.",
  ],
};

const CANDIDATE_VEHICLES: VehicleCandidate[] = [
  {
    id: "v-101",
    code: "NX-101",
    name: "Freight Hauler Alpha",
    lat: 41.8781,
    lng: -87.6298,
    batteryPct: 88,
    driverName: "Marcus Vance",
    capacityKg: 18000,
  },
  {
    id: "v-102",
    code: "NX-102",
    name: "Interstate Courier Beta",
    lat: 41.5868,
    lng: -93.625,
    batteryPct: 74,
    driverName: "Elena Rostova",
    capacityKg: 14000,
  },
  {
    id: "v-104",
    code: "NX-104",
    name: "Highland Heavy Transporter",
    lat: 41.2565,
    lng: -95.9345,
    batteryPct: 92,
    driverName: "Jamal Ortiz",
    capacityKg: 24000,
  },
];

function SimulationBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const incidentIdParam = searchParams.get("incidentId") || undefined;
  const vehicleIdParam = searchParams.get("vehicleId") || "v-104";

  // Scenario parameters
  const [title, setTitle] = React.useState("I-70 South Highway Bypass Simulation");
  const [description, setDescription] = React.useState("Evaluate active detour around Interstate 80 Cheyenne blizzard closure.");
  const [alternateRouteType, setAlternateRouteType] = React.useState("I-70_SOUTH_DETOUR");
  const [speedDeltaPct, setSpeedDeltaPct] = React.useState<number>(10);
  const [fuelCostPerKm, setFuelCostPerKm] = React.useState<number>(0.42);
  const [priorityReordering, setPriorityReordering] = React.useState<boolean>(true);
  const [isExecuting, setIsExecuting] = React.useState<boolean>(false);
  const [computedResult, setComputedResult] = React.useState<SimulationResultMetrics>(DEFAULT_METRICS);

  // Baseline data snapshot
  const baseSnapshot: BaseMetricsSnapshot = React.useMemo(() => ({
    totalDistanceKm: 1620.0,
    avgDurationMins: 940,
    currentDelayMins: 180,
    ordersCount: 14,
    totalOrderValue: 45000,
    baseCostUsd: 1450.0,
  }), []);

  // Query authoritative backend physics engine on parameter change
  React.useEffect(() => {
    let active = true;
    const evaluateOnBackend = async () => {
      try {
        const res = await fetch("/api/v1/simulations/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseSnapshot,
            variables: {
              vehicleId: vehicleIdParam,
              alternateRouteType,
              speedDeltaPct,
              fuelCostPerKm,
              priorityReordering,
            },
          }),
        });
        if (res.ok && active) {
          const data = await res.json();
          setComputedResult({
            totalDistanceKm: data.totalDistanceKm ?? data.total_distance_km,
            totalDurationMins: data.totalDurationMins ?? data.total_duration_mins,
            projectedDelayMins: data.projectedDelayMins ?? data.projected_delay_mins,
            netTimeSavedMins: data.netTimeSavedMins ?? data.net_time_saved_mins,
            totalCostUsd: data.totalCostUsd ?? data.total_cost_usd,
            costDeltaUsd: data.costDeltaUsd ?? data.cost_delta_usd,
            slaBreachRiskPct: data.slaBreachRiskPct ?? data.sla_breach_risk_pct,
            ordersAtRisk: data.ordersAtRisk ?? data.orders_at_risk,
            recommendationScore: data.recommendationScore ?? data.recommendation_score,
            verdict: data.verdict,
            insights: data.insights || [],
          });
        }
      } catch {
        // Keep current evaluated state on transient network error
      }
    };
    evaluateOnBackend();
    return () => { active = false; };
  }, [baseSnapshot, vehicleIdParam, alternateRouteType, speedDeltaPct, fuelCostPerKm, priorityReordering]);

  const handleRunScenario = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch("/api/v1/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          incidentId: incidentIdParam,
          variables: {
            vehicleId: vehicleIdParam,
            alternateRouteType,
            speedDeltaPct,
            fuelCostPerKm,
            priorityReordering,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || err.detail || "Simulation execution failed on backend authority.");
      }

      const json = await res.json();
      const simData = json.data || json;
      toast({
        title: `Simulation ${simData.code || "Scenario"} Evaluated`,
        message: "Evaluated deterministic scenario model on backend authority.",
        type: "simulation",
      });
      router.push(`/simulations/${simData.id}`);
    } catch (err: any) {
      toast({
        title: "Simulation Execution Failed",
        message: err.message || "Backend simulation authority could not complete scenario evaluation.",
        type: "critical",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href="/simulations"
        className="inline-flex items-center gap-1.5 text-xs font-mono-data text-nexus-on-surface-variant hover:text-nexus-on-surface transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Simulation Lab</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
            <span>What-If Scenario Sandbox</span>
            <span>·</span>
            <span className="text-purple-700 font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Pure Deterministic Calculation & Road Matrix
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
            Interactive Scenario Builder
          </h1>
        </div>

        <Button
          variant="simulation"
          size="sm"
          onClick={handleRunScenario}
          isLoading={isExecuting}
          className="font-mono-data text-xs shadow-tactile"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Save & Run Simulation Run
        </Button>
      </div>

      {/* Builder Grid: Parameters on Left vs Real-Time Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input Variables Form */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle className="text-sm">Hypothetical Dispatch Variables</CardTitle>
            <CardDescription>Adjust routing and fleet parameters to test recovery</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              label="Scenario Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Scenario Name..."
            />

            <Select
              label="Corridor / Diversion Strategy"
              value={alternateRouteType}
              onChange={(e) => setAlternateRouteType(e.target.value)}
              options={[
                { label: "I-70 South Bypass (+85 km / Fast Freeway)", value: "I-70_SOUTH_DETOUR" },
                { label: "US-40 North Secondary Arterial (+140 km)", value: "US-40_NORTH_DETOUR" },
                { label: "Transfer High-Priority Cargo to Relay Vehicle", value: "TRANSFER_TO_RELAY" },
                { label: "Holding Pattern at Cheyenne Rest Depot", value: "WAIT_AND_HOLD" },
              ]}
            />

            {/* Speed Adjustment Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono-data">
                <label className="font-semibold text-nexus-on-surface uppercase">
                  Fleet Speed Target ({speedDeltaPct >= 0 ? `+${speedDeltaPct}%` : `${speedDeltaPct}%`})
                </label>
                <span className="text-nexus-secondary font-bold">
                  {Math.round(65 * (1 + speedDeltaPct / 100))} km/h avg
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="5"
                value={speedDeltaPct}
                onChange={(e) => setSpeedDeltaPct(Number(e.target.value))}
                className="w-full cursor-pointer accent-nexus-secondary"
              />
            </div>

            {/* Fuel Cost per KM Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono-data">
                <label className="font-semibold text-nexus-on-surface uppercase">
                  Fuel & Power Cost / KM (${fuelCostPerKm.toFixed(2)})
                </label>
                <span className="text-nexus-on-surface-variant font-mono-data">Class-8 Commercial</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.80"
                step="0.02"
                value={fuelCostPerKm}
                onChange={(e) => setFuelCostPerKm(Number(e.target.value))}
                className="w-full cursor-pointer accent-purple-600"
              />
            </div>

            {/* Priority Reordering Checkbox */}
            <div className="p-3.5 rounded-xl bg-nexus-surface-container/60 border border-nexus-outline-variant/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-nexus-on-surface">Dynamic SLA Priority Re-sequencing</p>
                <p className="text-[11px] text-nexus-on-surface-variant">
                  Prioritize critical consignments (AeroTech Avionics) at interchange hubs.
                </p>
              </div>
              <input
                type="checkbox"
                checked={priorityReordering}
                onChange={(e) => setPriorityReordering(e.target.checked)}
                className="h-4 w-4 rounded accent-nexus-secondary cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right: Live Simulated Output Matrix */}
        <div className="space-y-4">
          <Card className="simulation-layer border border-purple-500/40 bg-purple-500/[0.02]">
            <CardHeader>
              <div>
                <Badge variant="simulation" size="sm">
                  Calculated Live Output
                </Badge>
                <CardTitle className="text-sm mt-1">Mathematical Outcome Matrix</CardTitle>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono-data text-nexus-on-surface-variant">
                  CONFIDENCE
                </span>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-400 font-mono-data">
                  {computedResult.recommendationScore} / 100
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Metric Summary Grid */}
              <div className="grid grid-cols-2 gap-3 font-mono-data">
                <div className="p-3.5 rounded-xl bg-nexus-surface-lowest shadow-tactile border border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                    Net Delay Mitigation
                  </span>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                    +{computedResult.netTimeSavedMins} mins
                  </span>
                  <span className="text-[10px] text-nexus-on-surface-variant">
                    was +{baseSnapshot.currentDelayMins}m hold
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-nexus-surface-lowest shadow-tactile border border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                    Estimated Cost Delta
                  </span>
                  <span className="text-xl font-bold text-nexus-on-surface mt-1 block">
                    +${computedResult.costDeltaUsd}
                  </span>
                  <span className="text-[10px] text-nexus-on-surface-variant">
                    Total: {formatCurrency(computedResult.totalCostUsd)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-nexus-surface-lowest shadow-tactile border border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                    SLA Breach Risk
                  </span>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                    {computedResult.slaBreachRiskPct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-nexus-on-surface-variant">
                    was 88.0% baseline
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-nexus-surface-lowest shadow-tactile border border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                    Recommendation
                  </span>
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 mt-1 block truncate">
                    {computedResult.verdict}
                  </span>
                  <span className="text-[10px] text-nexus-on-surface-variant">
                    {computedResult.ordersAtRisk} orders at risk
                  </span>
                </div>
              </div>

              {/* Analytical Insights List */}
              <div className="space-y-2 pt-2 border-t border-purple-500/20">
                <span className="text-[11px] font-bold text-nexus-on-surface font-mono-data uppercase">
                  Deterministic Engine Notes:
                </span>
                {computedResult.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-nexus-on-surface">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="pt-3">
              <Button
                variant="simulation"
                size="md"
                onClick={handleRunScenario}
                isLoading={isExecuting}
                className="w-full font-mono-data text-xs shadow-tactile"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Save & Launch Decision Review
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Multi-Vehicle Route Matrix Dispatch Optimization */}
      <MatrixScenarioVisualizer
        candidates={CANDIDATE_VEHICLES}
        targetLocation={{
          id: "loc-target-denver",
          name: "Rocky Mountain Aerospace Terminal (Denver, CO)",
          lat: 39.7392,
          lng: -104.9903,
        }}
      />
    </div>
  );
}

export default function NewSimulationPage() {
  return (
    <AppShell>
      <div className="animate-in fade-in duration-500">
        <React.Suspense
          fallback={
            <div className="py-20 text-center text-xs font-mono-data text-nexus-on-surface-variant">
              Loading Simulation Variables...
            </div>
          }
        >
          <SimulationBuilderContent />
        </React.Suspense>
      </div>
    </AppShell>
  );
}
