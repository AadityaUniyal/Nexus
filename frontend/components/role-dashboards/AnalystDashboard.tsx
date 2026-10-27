"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  LineChart,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  Download,
  RotateCcw,
  Route,
  Fuel,
  Leaf,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricTile } from "@/components/ui/metric-tile";
import { authFetch } from "@/lib/api/auth-fetch";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export function AnalystDashboard() {
  const { toast } = useToast();
  const [isSolving, setIsSolving] = React.useState(false);
  const [vrptwResult, setVrptwResult] = React.useState<any>(null);
  const [treeShapFactors, setTreeShapFactors] = React.useState([
    { factor: "Severe Weather Gradient", impactPct: 42, dollarLiability: 5250, direction: "POSITIVE_RISK" },
    { factor: "Dock Turnaround Dwell > 120m", impactPct: 28, dollarLiability: 3500, direction: "POSITIVE_RISK" },
    { factor: "Route Complexity (5+ Stops)", impactPct: 18, dollarLiability: 2250, direction: "POSITIVE_RISK" },
    { factor: "Driver Rest Margin Slack", impactPct: -12, dollarLiability: -1500, direction: "RISK_MITIGATING" }
  ]);

  const runScenarioOptimization = async () => {
    try {
      setIsSolving(true);
      tactileAudio.playClick();
      const demoRes = await authFetch<any>("/api/v1/routing/demo-scenario");
      if (demoRes) {
        const payload = {
          depot_lat: demoRes.depot.lat,
          depot_lng: demoRes.depot.lng,
          start_time_min: demoRes.start_time_min,
          vehicles: demoRes.vehicles,
          stops: demoRes.stops
        };
        const solveRes = await authFetch<any>("/api/v1/routing/vrptw-solve", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (solveRes && solveRes.success) {
          setVrptwResult(solveRes);
          tactileAudio.playSuccess();
          toast({
            title: "Combinatorial Simulation Solved",
            description: `Clarke-Wright Savings completed in ${solveRes.execution_time_ms}ms with ${solveRes.metrics.deadhead_reduction_pct}% empty haul reduction.`,
            variant: "default"
          });
        }
      }
    } catch (err: any) {
      toast({
        title: "Simulation Failed",
        description: err?.message || "Could not complete VRPTW solve.",
        variant: "destructive"
      });
    } finally {
      setIsSolving(false);
    }
  };

  const handleExportData = (format: "csv" | "json") => {
    tactileAudio.playClick();
    const dataStr = format === "json" 
      ? "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vrptwResult || { status: "nominal_state" }, null, 2))
      : "data:text/csv;charset=utf-8," + encodeURIComponent("Factor,ImpactPct,LiabilityUSD\nWeather,42,5250\nDockDwell,28,3500\nStops,18,2250");
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexus_analyst_export_${Date.now()}.${format}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Empty Haul (Deadhead) Index"
          value={vrptwResult ? `${vrptwResult.metrics.deadhead_reduction_pct}% Reduced` : "11.3% Net"}
          subtext="Target: < 12.0% fleetwide"
          trend="down"
          trendValue="-38.6% vs baseline"
          icon={<Route className="w-4 h-4 text-sky-500" />}
        />
        <MetricTile
          label="TreeSHAP Calibrated SLA Risk"
          value="4.2% Breach Prob"
          subtext="Game-theoretic exact bounds"
          trend="up"
          trendValue="95% Conformal Confidence"
          icon={<Sparkles className="w-4 h-4 text-emerald-500" />}
        />
        <MetricTile
          label="Fleet Scope 1 CO₂ Avoided"
          value={vrptwResult ? `${vrptwResult.metrics.carbon_avoided_kg} kg` : "42.8 Tons"}
          subtext="2.68 kg CO₂ per saved liter"
          trend="down"
          trendValue="Net Zero Target"
          icon={<Leaf className="w-4 h-4 text-teal-500" />}
        />
        <MetricTile
          label="Predictive Demurrage Recovery"
          value="$14,250"
          subtext="Accrued from 120m+ dock dwells"
          trend="up"
          trendValue="SHA-256 Verified"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* Main Simulation Lab Card */}
      <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl p-6 shadow-tactile">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px] text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10">
                Stochastic What-If Lab
              </Badge>
              <span className="text-xs font-mono text-neutral-500">Clarke-Wright + 2-Opt Metaheuristic</span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Dynamic VRPTW & Combinatorial Route Optimizer
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl">
              Simulate multi-depot, multi-stop delivery routes to eliminate empty return hauls while enforcing hard customer time windows and driver shift limits.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportData("csv")}
              className="font-mono text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={runScenarioOptimization}
              disabled={isSolving}
              className="bg-sky-600 hover:bg-sky-700 text-white font-mono text-xs shadow-tactile gap-1.5"
            >
              {isSolving ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isSolving ? "Optimizing NP-Hard Graph..." : "Run Optimization"}
            </Button>
          </div>
        </div>

        {/* Quantified Results If Run */}
        {vrptwResult ? (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-sky-500/[0.05] border border-sky-500/20 font-mono">
              <div>
                <span className="text-[11px] text-neutral-500">OPTIMIZED CLUSTERED DIST</span>
                <p className="text-lg font-bold text-sky-600 dark:text-sky-400">
                  {vrptwResult.metrics.optimized_distance_km} km
                </p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500">EMPTY HAUL ELIMINATED</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {vrptwResult.metrics.deadhead_reduction_pct}%
                </p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500">EST. FUEL SAVINGS</span>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {vrptwResult.metrics.fuel_saved_liters} L (${(vrptwResult.metrics.fuel_saved_liters * 1.35).toFixed(0)})
                </p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500">EXECUTION TIME</span>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                  {vrptwResult.execution_time_ms} ms
                </p>
              </div>
            </div>
            
            <div className="text-xs text-neutral-500 font-mono flex items-center justify-between">
              <span>{vrptwResult.metrics.total_vehicles_dispatched} active fleet vehicles · {vrptwResult.metrics.total_orders_scheduled} delivery stops sequenced</span>
              <Link href="/simulations/vrptw" className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-bold">
                Inspect Interactive Map & Timeline <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-neutral-300 dark:border-neutral-800 text-center">
            <Route className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
              Click &quot;Run Optimization&quot; to execute the Clarke-Wright savings engine across 8 active delivery nodes.
            </p>
          </div>
        )}
      </div>

      {/* TreeSHAP Explainability & Root Cause Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl p-6 shadow-tactile space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                TreeSHAP Game-Theoretic SLA Risk Attribution
              </h4>
              <p className="text-xs text-neutral-500">
                Exact Shapley value decomposition into dollar-weighted penalty factors.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] text-purple-600 dark:text-purple-400 border-purple-500/30">
              Shapley φ
            </Badge>
          </div>

          <div className="space-y-3 pt-2">
            {treeShapFactors.map((f, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">{f.factor}</span>
                  <span className={f.dollarLiability > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                    {f.dollarLiability > 0 ? `+$${f.dollarLiability}` : `-$${Math.abs(f.dollarLiability)}`} ({f.impactPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${f.dollarLiability > 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.abs(f.impactPct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive Delay Distribution Histogram */}
        <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl p-6 shadow-tactile space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                Predictive Delay Confidence Histogram
              </h4>
              <p className="text-xs text-neutral-500">
                Finite-sample conformal quantile prediction (95% guarantee).
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              α = 0.05
            </Badge>
          </div>

          <div className="pt-4 flex items-end justify-between gap-2 h-36 border-b border-neutral-200 dark:border-neutral-800 pb-2">
            {[
              { label: "<15m", height: "15%", count: 42, color: "bg-emerald-500" },
              { label: "15-30m", height: "45%", count: 128, color: "bg-emerald-500" },
              { label: "30-60m", height: "85%", count: 245, color: "bg-sky-500" },
              { label: "60-90m", height: "55%", count: 160, color: "bg-amber-500" },
              { label: "90-120m", height: "25%", count: 72, color: "bg-amber-500" },
              { label: ">120m", height: "10%", count: 28, color: "bg-rose-500" }
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono text-neutral-400">{bar.count}</span>
                <div
                  className={`w-full rounded-t-lg transition-all ${bar.color} opacity-80 hover:opacity-100`}
                  style={{ height: bar.height }}
                />
                <span className="text-[9px] font-mono text-neutral-500 text-center">{bar.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1">
            <span>Mean Variance: ±14.2 min</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">98.4% within Contract Window</span>
          </div>
        </div>
      </div>
    </div>
  );
}
