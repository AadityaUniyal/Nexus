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
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { dataProvider } from "@/lib/data-provider";
import { apiFetch } from "@/lib/api/http";

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
  slaBreachRiskPct: number | null;
  ordersAtRisk: number | null;
  recommendationScore: number | null;
  verdict: string;
  insights: string[];
}

function SimulationBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const incidentIdParam = searchParams.get("incidentId") || undefined;
  const requestedVehicleId = searchParams.get("vehicleId") || "";
  const [vehicleId, setVehicleId] = React.useState(requestedVehicleId);
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [routes, setRoutes] = React.useState<any[]>([]);
  const [incidents, setIncidents] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loadingInputs, setLoadingInputs] = React.useState(true);
  const [inputError, setInputError] = React.useState("");

  React.useEffect(() => {
    Promise.all([dataProvider.getVehicles(), dataProvider.getRoutes(), dataProvider.getIncidents(), dataProvider.getOrders()])
      .then(([vehicleRows, routeRows, incidentRows, orderRows]) => {
        setVehicles(vehicleRows);
        setRoutes(routeRows);
        setIncidents(incidentRows);
        setOrders(orderRows);
        if (!requestedVehicleId) setVehicleId(vehicleRows.find((v) => v.currentRouteId)?.id || "");
      })
      .catch((error) => setInputError(error instanceof Error ? error.message : "Could not load workspace data."))
      .finally(() => setLoadingInputs(false));
  }, []);

  // Scenario parameters
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [speedDeltaPct, setSpeedDeltaPct] = React.useState<number>(0);
  const [fuelCostPerKm, setFuelCostPerKm] = React.useState<number | null>(null);
  const [isExecuting, setIsExecuting] = React.useState<boolean>(false);
  const [computedResult, setComputedResult] = React.useState<SimulationResultMetrics | null>(null);
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [evaluationError, setEvaluationError] = React.useState("");

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const selectedRoute = routes.find((r) => r.id === selectedVehicle?.currentRouteId);
  const [selectedIncidentId, setSelectedIncidentId] = React.useState(incidentIdParam || "");
  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);
  const assignedOrders = orders.filter((o) => o.vehicleId === vehicleId);
  const baseSnapshot: BaseMetricsSnapshot | null = selectedRoute && fuelCostPerKm !== null ? {
    totalDistanceKm: selectedRoute.distanceKm,
    avgDurationMins: selectedRoute.avgDurationMins,
    currentDelayMins: selectedIncident?.delayMinutes ?? 0,
    ordersCount: assignedOrders.length,
    totalOrderValue: assignedOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0),
    baseCostUsd: selectedRoute.distanceKm * fuelCostPerKm,
  } : null;

  // Query authoritative backend physics engine on parameter change
  React.useEffect(() => {
    let active = true;
    const evaluateOnBackend = async () => {
      if (!baseSnapshot) {
        setComputedResult(null);
        return;
      }
      setIsEvaluating(true);
      setEvaluationError("");
      try {
        const res = await apiFetch("/api/v1/simulations/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseSnapshot,
            variables: {
              vehicleId,
              speedDeltaPct,
              fuelCostPerKm,
            },
          }),
        });
        if (!res.ok) throw new Error(`Estimate request failed (${res.status}).`);
        if (active) {
          const payload = await res.json();
          const data = payload.data ?? payload;
          setComputedResult({
            totalDistanceKm: data.totalDistanceKm ?? data.total_distance_km,
            totalDurationMins: data.totalDurationMins ?? data.total_duration_mins,
            projectedDelayMins: data.projectedDelayMins ?? data.projected_delay_mins,
            netTimeSavedMins: data.netTimeSavedMins ?? data.net_time_saved_mins,
            totalCostUsd: data.totalCostUsd ?? data.total_cost_usd,
            costDeltaUsd: data.costDeltaUsd ?? data.cost_delta_usd,
            slaBreachRiskPct: data.slaBreachRiskPct ?? data.sla_breach_risk_pct ?? null,
            ordersAtRisk: data.ordersAtRisk ?? data.orders_at_risk ?? null,
            recommendationScore: data.recommendationScore ?? data.recommendation_score ?? null,
            verdict: data.verdict,
            insights: data.insights || [],
          });
        }
      } catch (error) {
        if (active) {
          setComputedResult(null);
          setEvaluationError(error instanceof Error ? error.message : "Estimate service unavailable.");
        }
      } finally {
        if (active) setIsEvaluating(false);
      }
    };
    evaluateOnBackend();
    return () => { active = false; };
  }, [baseSnapshot?.totalDistanceKm, baseSnapshot?.avgDurationMins, baseSnapshot?.currentDelayMins, baseSnapshot?.baseCostUsd, baseSnapshot?.ordersCount, baseSnapshot?.totalOrderValue, vehicleId, speedDeltaPct, fuelCostPerKm]);

  const handleRunScenario = async () => {
    setIsExecuting(true);
    try {
      if (!baseSnapshot || !vehicleId || !title.trim() || fuelCostPerKm === null) {
        throw new Error("Select an assigned vehicle, enter a title and cost rate, then review the estimate.");
      }
      const res = await apiFetch("/api/v1/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          incidentId: incidentIdParam,
          variables: {
            vehicleId,
            speedDeltaPct,
            fuelCostPerKm,
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
          disabled={!computedResult || !title.trim() || isEvaluating}
          isLoading={isExecuting}
          className="font-mono-data text-xs shadow-tactile"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Save & Run Simulation Run
        </Button>
      </div>

      {inputError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">Workspace data could not be loaded: {inputError}</p>}
      {loadingInputs && <p className="text-sm text-nexus-on-surface-variant">Loading vehicles, routes, orders, and incidents from this workspace…</p>}
      {!loadingInputs && !inputError && vehicles.filter((v) => v.currentRouteId && routes.some((r) => r.id === v.currentRouteId)).length === 0 && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Add a vehicle and assign it to a workspace route before creating a planning estimate.</p>
      )}

      {/* Planning inputs use saved workspace records and operator-provided cost assumptions. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input Variables Form */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle className="text-sm">Planning inputs</CardTitle>
            <CardDescription>Uses the selected vehicle’s assigned route. This estimate does not predict traffic, weather, or SLA outcomes.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              label="Scenario Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Compare higher cruising speed"
            />
            <Select label="Vehicle and assigned route" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} options={vehicles.filter((v) => v.currentRouteId && routes.some((r) => r.id === v.currentRouteId)).map((v) => ({ label: `${v.code} · ${v.name} · ${routes.find((r) => r.id === v.currentRouteId)?.name}`, value: v.id }))} />
            <p className="text-xs text-nexus-on-surface-variant">Route baseline: {selectedRoute ? `${selectedRoute.name} · ${selectedRoute.distanceKm} km · ${selectedRoute.avgDurationMins} min` : "No assigned route"}</p>
            <Select label="Incident context (optional)" value={selectedIncidentId} onChange={(e) => setSelectedIncidentId(e.target.value)} options={[{ label: "No incident context", value: "" }, ...incidents.map((incident) => ({ label: `${incident.code} · ${incident.title}`, value: incident.id }))]} />

            {/* Speed Adjustment Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono-data">
                <label className="font-semibold text-nexus-on-surface uppercase">
                  Speed adjustment assumption ({speedDeltaPct >= 0 ? `+${speedDeltaPct}%` : `${speedDeltaPct}%`})
                </label>
                <span className="text-nexus-secondary font-bold">
                  Applied to the saved route duration
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-nexus-on-surface" htmlFor="fuel-cost">Your fuel or energy cost per km</label>
              <input id="fuel-cost" type="number" min="0" step="0.01" value={fuelCostPerKm ?? ""} onChange={(e) => setFuelCostPerKm(e.target.value === "" ? null : Number(e.target.value))} className="w-full rounded-xl border border-nexus-outline-variant bg-white px-3 py-2 text-sm" placeholder="Enter from your cost data" />
            </div>
          </CardContent>
        </Card>

        {/* Right: Live Simulated Output Matrix */}
        <div className="space-y-4">
          <Card className="simulation-layer border border-purple-500/40 bg-purple-500/[0.02]">
            <CardHeader>
              <div>
                <Badge variant="simulation" size="sm">
                  {isEvaluating ? "Calculating estimate…" : "Planning estimate"}
                </Badge>
                <CardTitle className="text-sm mt-1">Route duration and cost estimate</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {evaluationError && <p role="alert" className="text-sm text-red-700">Could not calculate: {evaluationError}</p>}
              {!computedResult && !evaluationError && <p className="text-sm text-nexus-on-surface-variant">Select a vehicle with an assigned route and enter your actual cost rate to calculate an estimate.</p>}
              {computedResult && <>
              {/* Metric Summary Grid */}
              <div className="grid grid-cols-2 gap-3 font-mono-data">
                <div className="p-3.5 rounded-xl bg-nexus-surface-lowest shadow-tactile border border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                    Modelled duration change
                  </span>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                    {computedResult.netTimeSavedMins > 0 ? "−" : "+"}{Math.abs(computedResult.netTimeSavedMins)} mins
                  </span>
                  <span className="text-[10px] text-nexus-on-surface-variant">
                    compared with the saved route duration
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-nexus-surface-lowest shadow-tactile border border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                    Estimated Cost Delta
                  </span>
                  <span className="text-xl font-bold text-nexus-on-surface mt-1 block">
                    {formatCurrency(computedResult.costDeltaUsd)}
                  </span>
                  <span className="text-[10px] text-nexus-on-surface-variant">
                    Total: {formatCurrency(computedResult.totalCostUsd)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-nexus-surface-lowest shadow-tactile border border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                    Incident delay baseline
                  </span>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                    {computedResult.projectedDelayMins} mins
                  </span>
                  <span className="text-[10px] text-nexus-on-surface-variant">
                    unchanged by this estimate
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-nexus-surface-lowest shadow-tactile border border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                    Estimate scope
                  </span>
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 mt-1 block truncate">
                    Arithmetic only
                  </span>
                  <span className="text-[10px] text-nexus-on-surface-variant">
                    {baseSnapshot?.ordersCount ?? 0} assigned orders in baseline
                  </span>
                </div>
              </div>

              {/* Analytical Insights List */}
              <div className="space-y-2 pt-2 border-t border-purple-500/20">
                <span className="text-[11px] font-bold text-nexus-on-surface font-mono-data uppercase">
                  What this estimate includes:
                </span>
                {computedResult.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-nexus-on-surface">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
              </>}
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
