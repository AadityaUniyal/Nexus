'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Clock3, Database, RefreshCw, Server } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { FadeIn } from '@/components/motion';
import { Button } from '@/components/ui/button';

interface SlaData {
  status: string;
  requestSuccessRatePct: number | null;
  requestCount24h: number;
  errorRatePct: number;
  latencyMs: { p50: number; p95: number; p99: number };
  history30Days: Array<{ day: string; uptimePct: number; status: string }>;
  subsystems: Array<{ name: string; status: string }>;
  timestamp: string;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-stone-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-stone-500">{detail}</p>
    </section>
  );
}

export default function SystemStatusPage() {
  const [data, setData] = useState<SlaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/sla', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Status request failed (${response.status}).`);
      setData(await response.json() as SlaData);
    } catch {
      setError('Service measurements could not be loaded. Try again in a moment.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const interval = window.setInterval(() => void fetchStatus(), 30_000);
    return () => window.clearInterval(interval);
  }, [fetchStatus]);

  const successRate = data?.requestSuccessRatePct;
  const latency = data?.requestCount24h ? data.latencyMs : null;

  return (
    <AppShell>
      <FadeIn className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Link href="/overview" className="hover:underline">Workspace</Link><span aria-hidden="true">/</span><span>Service status</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">Service status</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-400">Recent API request measurements and database connectivity. These are operational diagnostics, not a contractual availability report.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchStatus()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </header>

        {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Responses without 5xx errors" value={successRate == null ? '—' : `${successRate}%`} detail="Share of observed responses without a server error in this process’s rolling 24-hour sample." />
          <Metric label="Requests observed" value={data ? data.requestCount24h.toLocaleString() : '—'} detail="Requests recorded by this API process in the last 24 hours." />
          <Metric label="Server errors" value={data?.requestCount24h ? `${data.errorRatePct}%` : '—'} detail="Responses with a 5xx status in the same request sample." />
          <Metric label="Request latency" value={latency ? `${latency.p50} ms` : '—'} detail={latency ? `p50; p95 ${latency.p95} ms · p99 ${latency.p99} ms` : 'No latency sample is available.'} />
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-start gap-3">
            <Activity className="mt-0.5 h-5 w-5 text-stone-500" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-stone-900 dark:text-white">Measurement limits</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-400">Request metrics are held in memory by each API process and reset when that process restarts. They are not aggregated across instances. Historical availability, contractual SLA, recovery time, and external integration health are not available from this endpoint.</p>
              <p className="mt-2 text-xs text-stone-500">{data?.timestamp ? `Last measured ${new Date(data.timestamp).toLocaleString()}` : loading ? 'Loading current measurements…' : 'No measurements available.'}</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-white">Connected checks</h2>
            <p className="mt-1 text-sm text-stone-500">Only checks returned by the current service endpoint are shown.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(data?.subsystems ?? []).map((item) => {
              const database = item.name.toLowerCase().includes('database');
              const Icon = database ? Database : Server;
              return <div key={item.name} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <Icon className="h-4 w-4 text-stone-500" aria-hidden="true" />
                <span className="flex-1 text-sm font-medium text-stone-800 dark:text-stone-200">{item.name}</span>
                <span className="text-xs text-stone-500">{item.status}</span>
              </div>;
            })}
          </div>
          {!loading && data?.subsystems.length === 0 && <p className="rounded-xl border border-dashed border-stone-300 p-5 text-sm text-stone-500 dark:border-stone-700">No dependency checks were returned.</p>}
        </section>

        <p className="flex items-center gap-2 text-xs text-stone-500"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />Refreshes every 30 seconds while this page is open.</p>
      </FadeIn>
    </AppShell>
  );
}
