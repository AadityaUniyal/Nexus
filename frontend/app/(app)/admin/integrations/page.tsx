'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Cloud, Database, KeyRound, MapPin, Radio, RefreshCw, Server, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { FadeIn } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { authFetch } from '@/lib/api/auth-fetch';

interface Integration {
  id: string;
  name: string;
  provider: string;
  configured: boolean;
  status: string;
}

const providerIcons: Record<string, typeof Cloud> = {
  geoapify: MapPin,
  groq: Sparkles,
  gemini: Sparkles,
  azure_iot: Radio,
  azure_blob: Database,
  azure_key_vault: KeyRound,
  fabric: Cloud,
};

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await authFetch<Integration[]>('/api/v1/admin/integrations');
      setIntegrations(rows);
      setCheckedAt(new Date().toLocaleString());
    } catch (cause) {
      setIntegrations([]);
      setError(cause instanceof Error ? cause.message : 'Integration settings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadIntegrations(); }, [loadIntegrations]);

  return (
    <AppShell>
      <FadeIn className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500"><Link href="/admin" className="hover:underline">Admin</Link><span aria-hidden="true">/</span><span>Integrations</span></div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">Integrations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-400">Most entries report configuration only. Geoapify also returns a provider health check. Neither proves that operational data is flowing into your workspace.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadIntegrations()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh settings</Button>
        </header>

        {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
        {!error && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {integrations.map((integration) => {
            const Icon = providerIcons[integration.provider] ?? Server;
            return <article key={integration.id} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${integration.configured ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}>
                  {integration.configured ? 'Configured' : 'Not configured'}
                </span>
              </div>
              <h2 className="mt-4 text-sm font-semibold text-stone-900 dark:text-white">{integration.name}</h2>
              <p className="mt-1 text-xs leading-5 text-stone-500">{integration.configured ? integration.provider === 'geoapify' ? `Provider health check: ${integration.status}. This does not verify workspace data flow.` : `Configuration status: ${integration.status}. Provider connectivity is not checked here.` : 'No provider configuration was detected by the server.'}</p>
            </article>;
          })}
        </div>}
        {!loading && !error && integrations.length === 0 && <div className="rounded-xl border border-dashed border-stone-300 p-6 text-sm text-stone-500 dark:border-stone-700">The server returned no integration settings.</div>}
        {checkedAt && <p className="flex items-center gap-2 text-xs text-stone-500"><Activity className="h-3.5 w-3.5" aria-hidden="true" />Settings retrieved {checkedAt}</p>}
      </FadeIn>
    </AppShell>
  );
}
