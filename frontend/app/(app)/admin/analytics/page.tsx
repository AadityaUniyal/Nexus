"use client";

import * as React from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Activity, Users, MousePointerClick, Timer, AlertCircle, Cpu, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { apiJson } from "@/lib/api/http";

type Range = "24h" | "7d" | "30d" | "90d";

interface Summary {
  totals: { events: number; sessions: number; users: number; pageViews: number; pagesPerSession: number };
  topPages: { path: string; views: number }[];
  events: { name: string; count: number }[];
  devices: { device: string; sessions: number }[];
  daily: { date: string; events: number; sessions: number }[];
}

interface Platform {
  api: {
    requests: number;
    errorRatePct: number;
    clientErrorRatePct: number;
    uptimeSeconds: number;
    latencyMs: { p50: number; p95: number; p99: number };
    topRoutes: { route: string; count: number }[];
    hourly: { hour: string; requests: number }[];
  };
  ai: {
    enabled: boolean;
    chain: string[];
    usage: Record<string, { calls: number; failures: number; avgLatencyMs: number }>;
  };
}

const axis = { stroke: "var(--outline)", fontSize: 11, tickLine: false, axisLine: false } as const;
const tooltipStyle = {
  contentStyle: {
    background: "var(--surface-container-lowest)",
    border: "1px solid var(--outline-variant)",
    borderRadius: 8,
    fontSize: 12,
  },
};

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: React.ElementType }) {
  return (
    <div className="tactile-card p-5">
      <div className="flex items-center justify-between text-sm text-nexus-on-surface-variant">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-brand-600" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-semibold font-mono-data tracking-tight text-nexus-on-surface">{value}</p>
      {hint && <p className="mt-1 text-xs text-nexus-on-surface-variant">{hint}</p>}
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="tactile-card p-5">
      <h2 className="text-sm font-semibold text-nexus-on-surface">{title}</h2>
      {description && <p className="text-xs text-nexus-on-surface-variant mt-0.5">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-nexus-on-surface-variant">{text}</p>;
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = React.useState<Range>("7d");
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [platform, setPlatform] = React.useState<Platform | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([
        apiJson<Summary>(`/api/v1/events/summary?range=${range}`),
        apiJson<Platform>("/api/v1/events/platform"),
      ]);
      setSummary(s);
      setPlatform(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [range]);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const t = summary?.totals;
  const api = platform?.api;
  const fmt = (n?: number) => (n ?? 0).toLocaleString();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-nexus-on-surface-variant">
              <Link href="/admin" className="hover:underline">Admin</Link>
              <span aria-hidden> / </span>
              <span>Usage analytics</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-nexus-on-surface mt-1">
              Usage & platform analytics
            </h1>
            <p className="text-sm text-nexus-on-surface-variant mt-1">
              First-party product events from Neon, live API health from this instance. Full history is in Azure Application Insights.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Date range" className="inline-flex rounded-lg border border-nexus-outline-variant bg-nexus-surface-lowest p-0.5">
              {(["24h", "7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  aria-pressed={range === r}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    range === r ? "bg-brand-700 text-white" : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-nexus-outline-variant bg-nexus-surface-lowest hover:bg-nexus-surface-container"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-nexus-error/30 bg-nexus-error-container px-4 py-3 text-sm text-nexus-on-error-container">
            Could not load analytics ({error}).
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Unique visitors" value={fmt(t?.users)} hint={`${range} window`} icon={Users} />
          <Stat label="Sessions" value={fmt(t?.sessions)} hint={`${t?.pagesPerSession ?? 0} pages / session`} icon={Activity} />
          <Stat label="Page views" value={fmt(t?.pageViews)} icon={MousePointerClick} />
          <Stat label="Tracked events" value={fmt(t?.events)} icon={Cpu} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Panel title="Daily activity" description="Events and sessions per day">
              <div className="h-64">
                {summary?.daily.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
                      <XAxis dataKey="date" {...axis} />
                      <YAxis {...axis} allowDecimals={false} />
                      <Tooltip {...tooltipStyle} />
                      <Area type="monotone" dataKey="events" name="Events" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="sessions" name="Sessions" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty text={loading ? "Loading…" : "No events recorded in this range yet."} />
                )}
              </div>
            </Panel>
          </div>
          <Panel title="Top pages">
            {summary?.topPages.length ? (
              <ol className="space-y-2.5">
                {summary.topPages.map((p) => {
                  const max = summary.topPages[0].views || 1;
                  return (
                    <li key={p.path} className="text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="truncate text-nexus-on-surface">{p.path}</span>
                        <span className="font-mono-data text-nexus-on-surface-variant">{p.views}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-nexus-surface-container">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(p.views / max) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <Empty text="No page views yet." />
            )}
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Panel title="Events by type">
            {summary?.events.length ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.events} layout="vertical" margin={{ left: 20, right: 10 }}>
                    <XAxis type="number" {...axis} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" {...axis} width={100} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" name="Events" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty text="No events yet." />
            )}
          </Panel>
          <Panel title="Devices" description="Sessions by device class">
            {summary?.devices.length ? (
              <ul className="space-y-3">
                {summary.devices.map((d) => {
                  const total = summary.devices.reduce((a, b) => a + b.sessions, 0) || 1;
                  const pct = Math.round((d.sessions / total) * 100);
                  return (
                    <li key={d.device} className="text-sm">
                      <div className="flex justify-between">
                        <span className="capitalize">{d.device}</span>
                        <span className="font-mono-data text-nexus-on-surface-variant">{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-nexus-surface-container">
                        <div className="h-full rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty text="No sessions yet." />
            )}
          </Panel>
          <Panel title="AI providers" description={platform?.ai.chain.join(" → ")}>
            <ul className="space-y-3 text-sm">
              {["groq", "gemini"].map((p) => {
                const u = platform?.ai.usage[p];
                const configured = platform?.ai.chain.includes(p);
                return (
                  <li key={p} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 capitalize">
                      <span aria-hidden className={`h-2 w-2 rounded-full ${configured ? "bg-emerald-500" : "bg-nexus-outline-variant"}`} />
                      {p}
                      <span className="sr-only">{configured ? "configured" : "not configured"}</span>
                    </span>
                    <span className="font-mono-data text-nexus-on-surface-variant">
                      {u ? `${u.calls} calls · ${u.avgLatencyMs} ms` : configured ? "ready" : "no key"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <h2 className="pt-2 text-lg font-semibold text-nexus-on-surface">API health (last 24h, this instance)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Requests" value={fmt(api?.requests)} icon={Activity} />
          <Stat label="p50 latency" value={`${api?.latencyMs.p50 ?? 0} ms`} hint={`p95 ${api?.latencyMs.p95 ?? 0} ms`} icon={Timer} />
          <Stat label="p99 latency" value={`${api?.latencyMs.p99 ?? 0} ms`} icon={Timer} />
          <Stat label="Server error rate" value={`${api?.errorRatePct ?? 0}%`} hint={`4xx ${api?.clientErrorRatePct ?? 0}%`} icon={AlertCircle} />
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Panel title="Requests per hour">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={api?.hourly || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
                    <XAxis dataKey="hour" {...axis} interval={3} />
                    <YAxis {...axis} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="requests" name="Requests" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <Panel title="Busiest routes">
            {api?.topRoutes.length ? (
              <ol className="space-y-2 text-sm">
                {api.topRoutes.map((r) => (
                  <li key={r.route} className="flex justify-between gap-3">
                    <code className="truncate text-xs text-nexus-on-surface">{r.route}</code>
                    <span className="font-mono-data text-nexus-on-surface-variant">{r.count}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty text="No traffic recorded yet." />
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
