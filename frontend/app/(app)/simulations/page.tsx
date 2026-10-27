"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sparkles, Plus, ArrowRight, CheckCircle2, TrendingUp, Layers, RefreshCw, Box } from "lucide-react";
import { SimulationItem } from "@/lib/mock-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppleCard, AppleCardContent } from "@/components/ui/AppleCard";
import { dataProvider } from "@/lib/data-provider";

export default function SimulationsPage() {
  const [simulations, setSimulations] = React.useState<SimulationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");

  const fetchSimulations = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      setSimulations(await dataProvider.getSimulations());
    } catch (error) {
      setSimulations([]);
      setLoadError(error instanceof Error ? error.message : "Could not load estimates.");
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
        <PageHeader
          eyebrow="Scenario Planning & Comparison"
          title="Planning Lab"
          description="Compare route alternatives, evaluate schedule trade-offs, and inspect assumptions before updating active dispatch."
          actions={
            <div className="flex items-center gap-2">
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
              <Link href="/simulations/vrptw">
                <Button variant="outline" size="sm" className="font-mono-data text-xs border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Dynamic VRPTW Solver
                </Button>
              </Link>
              <Link href="/simulations/new">
                <Button variant="simulation" size="sm" className="font-mono-data text-xs shadow-tactile">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  New Scenario Run
                </Button>
              </Link>
            </div>
          }
        />

        {/* Feature Explainer Banner with AppleCard */}
        <AppleCard glass interactive={false} className="border-stone-200/60 dark:border-white/10 bg-stone-50/50 dark:bg-stone-900/50">
          <AppleCardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <Badge variant="neutral" size="sm">
                Scenario Modeling
              </Badge>
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                Compare Operational Variables Without Live Dispatch Impact
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl leading-relaxed">
                Scenarios run as isolated comparisons. Running a scenario calculates potential time and cost deltas against your baseline plan. Applying a plan requires deliberate operator confirmation.
              </p>
            </div>

            <Link href="/simulations/new">
              <Button variant="simulation" size="sm" className="font-mono-data text-xs shrink-0">
                Build Scenario <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </AppleCardContent>
        </AppleCard>

        {/* Simulations List with Loading State */}
        {loadError && !isLoading ? (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            Estimates could not be loaded: {loadError}. <button className="ml-2 underline" onClick={() => void fetchSimulations()}>Retry</button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-stone-500" />
              <span>Loading saved scenario models...</span>
            </div>
            <SkeletonTable rows={4} />
          </div>
        ) : simulations.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No planning estimates yet"
            description="Estimates are based on a vehicle’s saved route and assumptions entered by your team."
            action={
              <Link href="/simulations/new">
                <Button variant="simulation" size="sm" className="font-mono text-xs gap-1.5 shadow-tactile">
                  <Plus className="h-3.5 w-3.5" /> Run First Simulation
                </Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario ID</TableHead>
                <TableHead>Title & Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time Recovery</TableHead>
                <TableHead>Cost Delta</TableHead>
            <TableHead>Estimate</TableHead>
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
                    {sim.simulatedMetrics.netTimeSavedMins == null ? "Unavailable" : `${sim.simulatedMetrics.netTimeSavedMins} mins`}
                  </TableCell>
                  <TableCell className="font-mono-data text-xs font-semibold">
                    {sim.simulatedMetrics.costDeltaUsd == null ? "Unavailable" : formatCurrency(sim.simulatedMetrics.costDeltaUsd)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="simulation" size="sm">
                      {sim.simulatedMetrics.verdict ?? "Estimate only"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/simulations/${sim.id}`}>
                      <Button variant="secondary" size="sm" className="font-mono-data text-xs">
                        View estimate <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AppShell>
  );
}
