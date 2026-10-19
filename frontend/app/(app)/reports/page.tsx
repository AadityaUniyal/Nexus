"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, RefreshCw, Truck, Clock3 } from "lucide-react";

type SavedReport = { id: string; title: string; type: string; generatedAt: string; author: string; summary: string };
type TripRecord = { id: string; tracking_code: string; origin?: string | null; destination?: string | null; distance_km?: number | null; status: string; completed_at?: string | null; on_time_sla_met?: boolean | null; cryptographic_proof?: string | null };

export default function ReportsPage() {
  const [tab, setTab] = React.useState<"reports" | "trips">("reports");
  const [reports, setReports] = React.useState<SavedReport[]>([]);
  const [trips, setTrips] = React.useState<TripRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [days, setDays] = React.useState(30);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = tab === "reports" ? "/api/v1/reports" : `/api/v1/history/services?days=${days}`;
      const response = await fetch(endpoint, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Workspace records could not be loaded.");
      const data = await response.json();
      if (tab === "reports") {
        if (!Array.isArray(data)) throw new Error("Report service returned an invalid response.");
        setReports(data.map((row) => ({
          id: row.id, title: row.title, type: row.type,
          generatedAt: row.generatedAt ?? row.generated_at ?? "",
          author: row.author ?? "Not recorded", summary: row.summary ?? "No summary was recorded.",
        })));
      } else {
        if (!Array.isArray(data.services)) throw new Error("Trip history service returned an invalid response.");
        setTrips(data.services);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workspace records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [tab, days]);

  React.useEffect(() => { void load(); }, [load]);

  const createReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/reports", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Workspace operations snapshot · ${new Date().toLocaleDateString()}`, type: "OPERATIONS_SNAPSHOT" }),
      });
      if (!response.ok) throw new Error("The report could not be saved.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The report could not be saved.");
      setLoading(false);
    }
  };

  const exportReport = (report: SavedReport) => {
    const content = `# ${report.title}\n\nCreated: ${report.generatedAt || "Not recorded"}\nCreated by: ${report.author}\nType: ${report.type}\n\n${report.summary}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.id}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm text-nexus-on-surface-variant">Workspace records</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-nexus-on-surface">Reports & trip history</h1><p className="mt-2 text-sm text-nexus-on-surface-variant">Review saved operational snapshots and completed trips recorded by dispatch.</p></div>
          <div className="flex gap-2">
            {tab === "reports" && <Button onClick={() => void createReport()} disabled={loading}><FileText className="mr-2 h-4 w-4" /> Create snapshot</Button>}
            <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
          </div>
        </header>

        <div className="inline-flex rounded-xl border border-nexus-outline-variant/50 p-1">
          <button onClick={() => setTab("reports")} className={`rounded-lg px-4 py-2 text-sm ${tab === "reports" ? "bg-nexus-surface-container font-medium" : "text-nexus-on-surface-variant"}`}>Saved reports</button>
          <button onClick={() => setTab("trips")} className={`rounded-lg px-4 py-2 text-sm ${tab === "trips" ? "bg-nexus-surface-container font-medium" : "text-nexus-on-surface-variant"}`}>Completed trips</button>
        </div>

        {tab === "trips" && <label className="ml-3 text-sm text-nexus-on-surface-variant">Look back <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="ml-2 rounded-lg border border-nexus-outline-variant/50 bg-transparent px-2 py-1 text-nexus-on-surface"><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={180}>180 days</option></select></label>}
        {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div>}

        {tab === "reports" && <section className="space-y-3" aria-label="Saved reports">
          {!loading && !error && reports.length === 0 && <Card><CardContent className="p-10 text-center"><FileText className="mx-auto h-8 w-8 text-nexus-on-surface-variant" /><h2 className="mt-3 font-medium text-nexus-on-surface">No saved snapshots</h2><p className="mt-1 text-sm text-nexus-on-surface-variant">Create a snapshot to save a timestamped view of current workspace activity.</p></CardContent></Card>}
          {reports.map((report) => <Card key={report.id}><CardContent className="flex flex-wrap items-start justify-between gap-4 p-5"><div className="flex gap-3"><FileText className="mt-1 h-5 w-5 text-nexus-primary" /><div><p className="font-medium text-nexus-on-surface">{report.title}</p><p className="mt-1 text-xs text-nexus-on-surface-variant">{report.type} · {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "Time not recorded"} · {report.author}</p><p className="mt-3 text-sm text-nexus-on-surface-variant">{report.summary}</p></div></div><Button variant="outline" size="sm" onClick={() => exportReport(report)}><Download className="mr-2 h-4 w-4" /> Export</Button></CardContent></Card>)}
        </section>}

        {tab === "trips" && <section className="space-y-3" aria-label="Completed trips">
          {!loading && !error && trips.length === 0 && <Card><CardContent className="p-10 text-center"><Truck className="mx-auto h-8 w-8 text-nexus-on-surface-variant" /><h2 className="mt-3 font-medium text-nexus-on-surface">No completed trips recorded</h2><p className="mt-1 text-sm text-nexus-on-surface-variant">Completed trips will appear here when dispatch records them.</p></CardContent></Card>}
          {trips.map((trip) => <Card key={trip.id}><CardContent className="grid gap-4 p-5 sm:grid-cols-5 sm:items-center"><div className="sm:col-span-2"><p className="font-medium text-nexus-on-surface">{trip.tracking_code}</p><p className="mt-1 text-sm text-nexus-on-surface-variant">{trip.origin || "Origin not recorded"} → {trip.destination || "Destination not recorded"}</p></div><div className="text-sm text-nexus-on-surface">{trip.distance_km == null ? "Distance not recorded" : `${trip.distance_km} km`}</div><div className="flex items-center gap-2 text-sm text-nexus-on-surface-variant"><Clock3 className="h-4 w-4" />{trip.completed_at ? new Date(trip.completed_at).toLocaleString() : "Completion time unavailable"}</div><div className="text-sm text-nexus-on-surface">{trip.on_time_sla_met == null ? "SLA not recorded" : trip.on_time_sla_met ? "On time" : "Delayed"}</div></CardContent></Card>)}
        </section>}
      </main>
    </AppShell>
  );
}
