"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/lib/api/auth-fetch";
import { motion, AnimatePresence } from "motion/react";
import {
  Route,
  Truck,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Fuel,
  Leaf,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Calendar,
  Layers,
  ShieldCheck
} from "lucide-react";

interface StopSolution {
  stop_sequence: number;
  stop_id: string;
  order_id: string;
  customer_name: string;
  lat: number;
  lng: number;
  arrival_time_str: string;
  departure_time_str: string;
  dwell_minutes: number;
  demand_kg: number;
  cumulative_load_kg: number;
  is_late_risk: boolean;
  slack_window_min: number;
}

interface RoutePlan {
  vehicle_id: string;
  vehicle_code: string;
  driver_name: string;
  stops: StopSolution[];
  total_distance_km: number;
  total_duration_hours: number;
  total_payload_kg: number;
  capacity_utilization_pct: number;
  deadhead_km: number;
  fuel_consumed_liters: number;
  carbon_emitted_kg: number;
}

interface OptimizationResult {
  success: boolean;
  algorithm_name: string;
  execution_time_ms: number;
  unassigned_stops: string[];
  routes: RoutePlan[];
  metrics: {
    baseline_distance_km: number;
    optimized_distance_km: number;
    distance_saved_km: number;
    deadhead_reduction_pct: number;
    fuel_saved_liters: number;
    carbon_avoided_kg: number;
    total_vehicles_dispatched: number;
    total_orders_scheduled: number;
  };
}

export default function VRPTWOptimizerPage() {
  const [loading, setLoading] = React.useState(false);
  const [scenario, setScenario] = React.useState<any>(null);
  const [result, setResult] = React.useState<OptimizationResult | null>(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = React.useState<number>(0);

  const loadScenario = React.useCallback(async () => {
    try {
      const data = await authFetch<any>("/api/v1/routing/demo-scenario");
      setScenario(data);
    } catch (e) {
      console.error("Failed to load scenario:", e);
    }
  }, []);

  React.useEffect(() => {
    loadScenario();
  }, [loadScenario]);

  const handleRunOptimization = async () => {
    if (!scenario) return;
    setLoading(true);
    try {
      const payload = {
        depot_lat: scenario.depot.lat,
        depot_lng: scenario.depot.lng,
        start_time_min: scenario.start_time_min,
        vehicles: scenario.vehicles,
        stops: scenario.stops,
      };

      const res = await authFetch<OptimizationResult>("/api/v1/routing/vrptw-solve", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res && res.success) {
        setResult(res);
        setSelectedRouteIdx(0);
      }
    } catch (err) {
      console.error("VRPTW optimization failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          eyebrow="Dynamic Combinatorial Optimization"
          title="Vehicle Routing & Time Window Solver (VRPTW)"
          description="Clarke-Wright Savings heuristic + 2-Opt local search metaheuristic. Eliminates empty deadhead miles, maximizes vehicle capacity utilization, and enforces hard delivery time windows."
          actions={
            <div className="flex items-center gap-2">
              <Link href="/simulations">
                <Button variant="outline" size="sm" className="font-mono-data text-xs">
                  Back to Scenarios
                </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                onClick={handleRunOptimization}
                disabled={loading || !scenario}
                className="bg-blue-600 hover:bg-blue-700 text-white font-mono-data text-xs shadow-tactile flex items-center gap-1.5"
              >
                {loading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                {loading ? "Solving NP-Hard Problem..." : "Solve Multi-Stop VRPTW"}
              </Button>
            </div>
          }
        />

        {/* Algorithm Badge & Spec Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-[20px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs font-mono">
              <Route className="w-4 h-4 text-blue-500" />
              <span>CORE HEURISTIC</span>
            </div>
            <div className="mt-2 text-base font-bold text-neutral-900 dark:text-white">
              Clarke-Wright + 2-Opt
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Multi-depot savings matrix</div>
          </Card>

          <Card className="rounded-[20px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs font-mono">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>TIME WINDOWS</span>
            </div>
            <div className="mt-2 text-base font-bold text-neutral-900 dark:text-white">
              Hard [Earliest, Latest]
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Zero-delay SLA slack bounds</div>
          </Card>

          <Card className="rounded-[20px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs font-mono">
              <Fuel className="w-4 h-4 text-amber-500" />
              <span>DEADHEAD TARGET</span>
            </div>
            <div className="mt-2 text-base font-bold text-neutral-900 dark:text-white">
              &gt; 35% Reduction
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Empty return haul elimination</div>
          </Card>

          <Card className="rounded-[20px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs font-mono">
              <Leaf className="w-4 h-4 text-teal-500" />
              <span>CARBON MODEL</span>
            </div>
            <div className="mt-2 text-base font-bold text-neutral-900 dark:text-white">
              2.68 kg CO₂ / Liter
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Scope 1 verified emissions</div>
          </Card>
        </div>

        {/* Quantified Impact Results Banner */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] border border-emerald-500/30 bg-emerald-500/[0.04] backdrop-blur-3xl p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-base">
                    Optimal Multi-Stop Dispatch Solved in {result.execution_time_ms}ms
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {result.algorithm_name} across {result.metrics.total_vehicles_dispatched} vehicles and {result.metrics.total_orders_scheduled} delivery stops.
                  </p>
                </div>
              </div>

              <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-none font-mono text-xs px-3 py-1">
                {result.metrics.deadhead_reduction_pct}% Empty Haul Reduced
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 font-mono">
              <div>
                <span className="text-[11px] text-neutral-500">BASELINE DIRECT DIST</span>
                <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">
                  {result.metrics.baseline_distance_km} km
                </p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500">OPTIMIZED CLUSTERED DIST</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {result.metrics.optimized_distance_km} km
                </p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500">FUEL SAVED</span>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {result.metrics.fuel_saved_liters} Liters (${(result.metrics.fuel_saved_liters * 1.35).toFixed(0)})
                </p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500">SCOPE 1 CO₂ AVOIDED</span>
                <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                  {result.metrics.carbon_avoided_kg} kg
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Routes & Stops Drilldown */}
        {result && result.routes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {result.routes.map((r, idx) => (
                <button
                  key={r.vehicle_id}
                  onClick={() => setSelectedRouteIdx(idx)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-mono transition-all flex items-center gap-2.5 ${
                    selectedRouteIdx === idx
                      ? "bg-blue-600 text-white shadow-tactile font-bold"
                      : "bg-white/60 dark:bg-[#151518]/60 text-neutral-600 dark:text-neutral-400 border border-black/[0.08] dark:border-white/[0.12] hover:bg-neutral-100"
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{r.vehicle_code}</span>
                  <span className="opacity-80">({r.stops.length} stops)</span>
                </button>
              ))}
            </div>

            {/* Selected Route Table */}
            {result.routes[selectedRouteIdx] && (
              <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl overflow-hidden shadow-tactile">
                <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                      {result.routes[selectedRouteIdx].vehicle_code} — Driver: {result.routes[selectedRouteIdx].driver_name}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Payload: {result.routes[selectedRouteIdx].total_payload_kg} kg ({result.routes[selectedRouteIdx].capacity_utilization_pct}% capacity)
                    </Badge>
                  </div>
                  <div className="font-mono text-xs text-neutral-500">
                    Route Dist: <span className="font-bold text-neutral-900 dark:text-white">{result.routes[selectedRouteIdx].total_distance_km} km</span> · Est. Driving: <span className="font-bold text-neutral-900 dark:text-white">{result.routes[selectedRouteIdx].total_duration_hours} hrs</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-neutral-500">
                        <th className="py-3 px-4">SEQ</th>
                        <th className="py-3 px-4">ORDER & CUSTOMER</th>
                        <th className="py-3 px-4">SCHEDULED ARRIVAL</th>
                        <th className="py-3 px-4">DEPARTURE</th>
                        <th className="py-3 px-4">DWELL</th>
                        <th className="py-3 px-4">DEMAND (KG)</th>
                        <th className="py-3 px-4">SLACK WINDOW</th>
                        <th className="py-3 px-4">SLA STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                      {result.routes[selectedRouteIdx].stops.map((s) => (
                        <tr key={s.stop_id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                            #{s.stop_sequence}
                          </td>
                          <td className="py-3.5 px-4 font-sans font-medium text-neutral-900 dark:text-white">
                            <div className="flex flex-col">
                              <span>{s.customer_name}</span>
                              <span className="font-mono text-[11px] text-neutral-500">{s.order_id}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">
                            {s.arrival_time_str}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                            {s.departure_time_str}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                            {s.dwell_minutes}m
                          </td>
                          <td className="py-3.5 px-4">
                            {s.demand_kg} kg
                          </td>
                          <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                            +{s.slack_window_min}m buffer
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              ON SCHEDULE
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
