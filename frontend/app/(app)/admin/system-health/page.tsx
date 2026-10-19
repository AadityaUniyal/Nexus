'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, RefreshCw, Server } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { FadeIn } from '@/components/motion';
import { Button } from '@/components/ui/button';

interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  subsystems: {
    api?: { name: string; status: string };
    database?: { name: string; status: string; latencyMs?: number | null };
  };
}

export default function AdminSystemHealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [requestDuration, setRequestDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startedAt = performance.now();
    try {
      const response = await fetch('/api/v1/admin/health', { cache: 'no-store' });
      setRequestDuration(Math.round(performance.now() - startedAt));
      if (!response.ok) throw new Error(response.status === 403 ? 'You do not have permission to view system diagnostics.' : `Health check failed (${response.status}).`);
      setData(await response.json() as HealthResponse);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : 'System diagnostics could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchHealth(); }, [fetchHealth]);

  const checks = [
    { label: 'API process', icon: Server, status: data?.subsystems.api?.status ?? 'Not measured', detail: requestDuration == null ? 'Response time unavailable' : `${requestDuration} ms browser-observed response time` },
    { label: 'PostgreSQL database', icon: Database, status: data?.subsystems.database?.status ?? 'Not measured', detail: data?.subsystems.database?.latencyMs == null ? 'Database latency not reported' : `${data.subsystems.database.latencyMs} ms measured by the server` },
  ];

  return (
    <AppShell>
      <FadeIn className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500"><Link href="/admin" className="hover:underline">Admin</Link><span aria-hidden="true">/</span><span>System health</span></div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">System health</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-400">A live check of the API process and its PostgreSQL connection. This page does not report historical uptime or optional integration health.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchHealth()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Check again</Button>
        </header>

        {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Current service checks">
          {checks.map(({ label, icon: Icon, status, detail }) => <article key={label} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-sm font-semibold text-stone-900 dark:text-white">{label}</h2><p className="mt-1 text-xs text-stone-500">{status}</p></div></div>
            <p className="mt-4 text-xs text-stone-500">{detail}</p>
          </article>)}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm leading-6 text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
          <h2 className="font-semibold text-stone-900 dark:text-white">About this check</h2>
          <p className="mt-2">The API performs a database connectivity query when this page is refreshed. The response time shown for the API is measured in your browser; database latency is shown only when the server returns it. These point-in-time checks are not an uptime commitment.</p>
          <p className="mt-2 text-xs">{data ? `Version ${data.version} · Checked ${new Date(data.timestamp).toLocaleString()}` : loading ? 'Checking current status…' : 'No successful check is available.'}</p>
        </section>
      </FadeIn>
    </AppShell>
  );
}
