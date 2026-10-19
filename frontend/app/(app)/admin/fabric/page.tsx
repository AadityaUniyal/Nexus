'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Cloud, Database, Radio, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { FadeIn } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { authFetch } from '@/lib/api/auth-fetch';

interface AzureTelemetry {
  services: {
    iotHub: { status: string; eventsReceived: number; lastEventAt: string | null };
    blobStorage: { status: string };
    applicationInsights: { status: string };
    fabric: { status: string };
  };
  timestamp: string;
}

function ServiceRow({ icon: Icon, name, status, detail }: { icon: typeof Cloud; name: string; status: string; detail: string }) {
  return <article className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-stone-900 dark:text-white">{name}</h2><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300">{status.replaceAll('_', ' ')}</span></div><p className="mt-1 text-xs leading-5 text-stone-500">{detail}</p></div>
  </article>;
}

export default function AdminFabricPage() {
  const [data, setData] = useState<AzureTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await authFetch<AzureTelemetry>('/api/v1/admin/azure/telemetry'));
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : 'Azure service settings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  const services = data?.services;

  return (
    <AppShell>
      <FadeIn className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500"><Link href="/admin" className="hover:underline">Admin</Link><span aria-hidden="true">/</span><span>Azure services</span></div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">Azure services</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-400">Configuration and counters reported by the backend. This page does not probe Azure network availability or claim a Fabric connection.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadStatus()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
        </header>

        {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
        {loading && !data && <p className="text-sm text-stone-500">Loading service settings…</p>}
        {services && <div className="space-y-3">
          <ServiceRow icon={Radio} name="Azure IoT Hub consumer" status={services.iotHub.status} detail={`${services.iotHub.eventsReceived.toLocaleString()} events received by this process${services.iotHub.lastEventAt ? ` · last event ${new Date(services.iotHub.lastEventAt).toLocaleString()}` : ' · no event timestamp reported'}.`} />
          <ServiceRow icon={Database} name="Azure Blob Storage client" status={services.blobStorage.status} detail="The backend reports whether its storage client is initialized; this is not a read/write availability probe." />
          <ServiceRow icon={Activity} name="Application Insights" status={services.applicationInsights.status} detail="Configuration status only; telemetry delivery is not verified here." />
          <ServiceRow icon={Cloud} name="Microsoft Fabric" status={services.fabric.status} detail="No Fabric sync, file count, model exchange or latency metric is returned by the current backend." />
        </div>}
        <p className="text-xs text-stone-500">{data ? `Backend status read ${new Date(data.timestamp).toLocaleString()}. IoT event counters are process-local.` : 'Service information is unavailable until the backend responds.'}</p>
      </FadeIn>
    </AppShell>
  );
}
