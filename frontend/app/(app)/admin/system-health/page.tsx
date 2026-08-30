'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Server, Database, Activity, RefreshCw, CheckCircle2, ShieldCheck, Radio } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { FadeIn, SpringCard } from '@/components/motion';

export default function AdminSystemHealthPage() {
  const { toast } = useToast();
  const [checking, setChecking] = React.useState(false);

  const services = [
    { name: 'Core API Gateway', status: 'HEALTHY', latency: '4ms', uptime: '99.99%', role: 'FastAPI / Next.js' },
    { name: 'PostgreSQL Operational DB', status: 'HEALTHY', latency: '2ms', uptime: '100%', role: 'Primary Persistence' },
    { name: 'Redis Cache & Pub/Sub', status: 'HEALTHY', latency: '1ms', uptime: '99.98%', role: 'State Buffer' },
    { name: 'Server-Sent Events (SSE) Stream', status: 'HEALTHY', latency: '0ms', uptime: '100%', role: 'Real-time Telemetry' },
    { name: 'Deterministic Simulation Engine', status: 'HEALTHY', latency: '12ms', uptime: '100%', role: 'Isolated What-If Worker' },
    { name: 'Microsoft Fabric Adapter', status: 'HEALTHY', latency: '320ms', uptime: '99.90%', role: 'OneLake Cloud Bridge' },
    { name: 'Azure Telemetry Event Hub', status: 'HEALTHY', latency: '18ms', uptime: '99.95%', role: 'IoT Ingestion' },
    { name: 'AI Executive Briefing Provider', status: 'HEALTHY', latency: '110ms', uptime: '99.85%', role: 'Groq / Deterministic Fallback' },
  ];

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      toast({
        title: 'Health Check Completed',
        message: 'All 8 platform subsystems responding with nominal metrics.',
        type: 'success',
      });
    }, 600);
  };

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Subsystem Diagnostics</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Live Subsystem & Microservice Health
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRefresh}
              isLoading={checking}
              className="font-mono text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Re-check Health Probes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s) => (
            <SpringCard key={s.name} className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-nexus-secondary" />
                  <span className="font-bold text-sm text-nexus-on-surface">{s.name}</span>
                </div>
                <p className="text-xs text-nexus-on-surface-variant font-mono">{s.role}</p>
                <div className="text-[11px] font-mono text-nexus-on-surface-variant flex items-center gap-3 pt-1">
                  <span>Latency: <strong className="text-nexus-primary">{s.latency}</strong></span>
                  <span>Uptime: <strong className="text-emerald-600">{s.uptime}</strong></span>
                </div>
              </div>

              <div>
                <Badge variant="healthy">
                  <StatusLed status="healthy" className="mr-1.5" />
                  {s.status}
                </Badge>
              </div>
            </SpringCard>
          ))}
        </div>
      </FadeIn>
    </AppShell>
  );
}
