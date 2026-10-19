"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, RefreshCw } from "lucide-react";
import { SimulationItem } from "@/lib/mock-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { dataProvider } from "@/lib/data-provider";

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 border-b border-nexus-outline-variant/30 py-3 text-sm"><span className="text-nexus-on-surface-variant">{label}</span><span className="text-right font-medium text-nexus-on-surface">{value}</span></div>;
}

export default function SimulationDetailPage() {
  const params = useParams();
  const simId = params?.id as string;
  const [simulation, setSimulation] = React.useState<SimulationItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    if (!simId) return;
    setLoading(true);
    setError("");
    try {
      const found = await dataProvider.getSimulation(simId);
      setSimulation(found);
      if (!found) setError("This estimate was not found in your workspace.");
    } catch (cause) {
      setSimulation(null);
      setError(cause instanceof Error ? cause.message : "Estimate service is unavailable.");
    } finally { setLoading(false); }
  }, [simId]);

  React.useEffect(() => { void load(); }, [load]);

  if (loading) return <AppShell><p className="mx-auto max-w-4xl py-16 text-sm text-nexus-on-surface-variant">Loading estimate…</p></AppShell>;
  if (!simulation) return <AppShell><div className="mx-auto max-w-xl space-y-4 py-16 text-center"><AlertTriangle className="mx-auto h-10 w-10 text-amber-600"/><h1 className="text-xl font-semibold">Estimate unavailable</h1><p role="alert" className="text-sm text-nexus-on-surface-variant">{error}</p><div className="flex justify-center gap-3"><Button variant="secondary" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4"/>Retry</Button><Link href="/simulations"><Button variant="primary">Back to planning</Button></Link></div></div></AppShell>;

  const baseline = simulation.baselineMetrics;
  const estimate = simulation.simulatedMetrics;
  const money = (value?: number) => value == null ? "Unavailable" : formatCurrency(value);
  const number = (value?: number, unit = "") => value == null ? "Unavailable" : `${value}${unit}`;

  return <AppShell><main className="mx-auto max-w-4xl space-y-6 py-2">
    <Link href="/simulations" className="inline-flex items-center gap-2 text-sm text-nexus-on-surface-variant hover:text-nexus-on-surface"><ArrowLeft className="h-4 w-4"/>Planning estimates</Link>
    <header className="space-y-2"><div className="flex flex-wrap items-center gap-3"><Badge variant="neutral">{simulation.code}</Badge><Badge variant="simulation">{simulation.status}</Badge><span className="text-xs text-nexus-on-surface-variant">Saved {simulation.createdAt ? formatDateTime(simulation.createdAt) : "time unavailable"}</span></div><h1 className="text-2xl font-semibold tracking-tight">{simulation.title}</h1><p className="text-sm text-nexus-on-surface-variant">{simulation.description || "No description provided."}</p></header>
    <Card><CardHeader><CardTitle className="text-base">Route estimate</CardTitle><CardDescription>Arithmetic estimate based on saved workspace route data and the assumptions recorded below. It does not predict traffic, weather, or service level risk.</CardDescription></CardHeader><CardContent className="grid gap-8 md:grid-cols-2">
      <section aria-labelledby="baseline-heading"><h2 id="baseline-heading" className="mb-2 text-sm font-semibold">Saved baseline</h2><Metric label="Route distance" value={number(baseline.totalDistanceKm, " km")}/><Metric label="Current delay" value={number(baseline.projectedDelayMins, " min")}/><Metric label="Baseline route cost" value={money(baseline.totalCostUsd)}/><Metric label="SLA risk" value="Not calculated"/></section>
      <section aria-labelledby="estimate-heading"><h2 id="estimate-heading" className="mb-2 text-sm font-semibold">Adjusted estimate</h2><Metric label="Route distance" value={number(estimate.totalDistanceKm, " km")}/><Metric label="Estimated duration change" value={number(estimate.netTimeSavedMins, " min")}/><Metric label="Estimated route cost" value={money(estimate.totalCostUsd)}/><Metric label="Cost change" value={money(estimate.costDeltaUsd)}/><Metric label="SLA risk / recommendation" value="Not calculated"/></section>
    </CardContent></Card>
    <p className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-950">This is a planning estimate only. Applying a plan to live dispatch is unavailable until a dispatch integration is configured.</p>
    {simulation.variables && <Card><CardHeader><CardTitle className="text-base">Recorded assumptions</CardTitle><CardDescription>Inputs stored with this estimate.</CardDescription></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-2"><Metric label="Vehicle" value={simulation.variables.vehicleId || "Unavailable"}/><Metric label="Speed adjustment" value={simulation.variables.speedDeltaPct == null ? "Unavailable" : `${simulation.variables.speedDeltaPct}%`}/><Metric label="Cost per km" value={simulation.variables.fuelCostPerKm == null ? "Unavailable" : money(simulation.variables.fuelCostPerKm)}/></CardContent></Card>}
  </main></AppShell>;
}
