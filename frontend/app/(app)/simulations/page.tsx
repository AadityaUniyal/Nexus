"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sparkles, Plus, ArrowRight, CheckCircle2, TrendingUp, Layers, RefreshCw } from "lucide-react";
import { INITIAL_SIMULATIONS, SimulationItem } from "@/lib/mock-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function SimulationsPage() {
  const [simulations, setSimulations] = React.useState<SimulationItem[]>(INITIAL_SIMULATIONS);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchSimulations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/simulations");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          setSimulations(
            json.map((s: any) => ({
              id: s.id,
              code: s.code || `SIM-${s.id.slice(-4)}`,
              title: s.title || "Deterministic Reroute Scenario",
              description: s.description || "Physics simulation evaluation",
              incidentId: s.incident_id || s.incidentId,
              status: s.status || "COMPLETED",
              variables: s.variables || {
                vehicleId: "v-104",
                alternateRouteType: "I-70_SOUTH_DETOUR",
                speedDeltaPct: 10,
                fuelCostPerKm: 0.42,
                priorityReordering: true,
              },
              baselineMetrics: s.baseline_metrics || s.baselineMetrics || {
                totalDistanceKm: 1620.0,
                projectedDelayMins: 180,
                slaBreachRiskPct: 88.0,
                totalCostUsd: 1450.0,
              },
              simulatedMetrics: {
                totalDistanceKm: s.simulated_metrics?.totalDistanceKm || 1705.0,
                projectedDelayMins: s.simulated_metrics?.projectedDelayMins || 45,
                slaBreachRiskPct: s.simulated_metrics?.slaBreachRiskPct || 12.0,
                totalCostUsd: s.simulated_metrics?.totalCostUsd || 1530.0,
                netTimeSavedMins: s.simulated_metrics?.netTimeSavedMins || s.net_time_saved_mins || 135,
                costDeltaUsd: s.simulated_metrics?.costDeltaUsd || s.cost_delta_usd || 80,
                recommendationScore: s.simulated_metrics?.recommendationScore || s.recommendation_score || 94,
                verdict: s.simulated_metrics?.verdict || s.verdict || "RECOMMENDED",
                insights: s.simulated_metrics?.insights || ["Reroute avoids I-80 summit road icing."],
              },
              createdAt: s.created_at || s.createdAt || new Date().toISOString(),
            }))
          );
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSimulations();
  }, [fetchSimulations]);

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span>Decision Simulation Engine</span>
              <span>·</span>
              <span>Pure Deterministic Branching</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Simulation Lab
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchSimulations}
              isLoading={isLoading}
              className="font-mono-data text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
            <Link href="/simulations/new">
              <Button variant="simulation" size="sm" className="font-mono-data text-xs shadow-tactile">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Scenario Run
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Explainer Banner */}
        <div className="p-6 rounded-2xl simulation-layer border border-purple-500/30 bg-purple-500/[0.02] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <Badge variant="simulation" size="sm">
              Safe Hypothesis Layer
            </Badge>
            <h3 className="text-base font-bold text-nexus-on-surface">
              Test Operational Variables Without Live Dispatch Impact
            </h3>
            <p className="text-xs text-nexus-on-surface-variant max-w-2xl leading-relaxed">
              Every simulation executes in isolation on a deterministic mathematical model. Once a scenario
              is evaluated and approved, apply the decision with ACID transactional integrity.
            </p>
          </div>

          <Link href="/simulations/new">
            <Button variant="simulation" size="sm" className="font-mono-data text-xs shrink-0">
              Build Scenario <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Simulations List */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scenario ID</TableHead>
              <TableHead>Title & Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time Recovery</TableHead>
              <TableHead>Cost Delta</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Verdict</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {simulations.map((sim) => (
              <TableRow key={sim.id}>
                <TableCell className="font-mono-data font-bold text-purple-700">{sim.code}</TableCell>
                <TableCell className="text-xs max-w-sm">
                  <p className="font-semibold text-nexus-on-surface">{sim.title}</p>
                  <p className="text-nexus-on-surface-variant text-[11px] line-clamp-1 mt-0.5">{sim.description}</p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={sim.status === "APPLIED" ? "healthy" : "simulation"}
                    size="sm"
                  >
                    {sim.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono-data text-xs font-bold text-emerald-700">
                  +{sim.simulatedMetrics.netTimeSavedMins} mins
                </TableCell>
                <TableCell className="font-mono-data text-xs font-semibold">
                  +${sim.simulatedMetrics.costDeltaUsd}
                </TableCell>
                <TableCell className="font-mono-data text-xs font-bold">
                  {sim.simulatedMetrics.recommendationScore ?? 94}%
                </TableCell>
                <TableCell>
                  <Badge variant="simulation" size="sm">
                    {sim.simulatedMetrics.verdict ?? "RECOMMENDED"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/simulations/${sim.id}`}>
                    <Button variant="secondary" size="sm" className="font-mono-data text-xs">
                      Compare & Apply <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
