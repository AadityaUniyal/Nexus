'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { BarChart3, Activity, Cpu, TrendingUp, Users, Server } from 'lucide-react';
import { FadeIn, SpringCard, NumberTransition } from '@/components/motion';

export default function AdminAnalyticsPage() {
  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Platform Telemetry</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Platform Analytics & Infrastructure Utilization
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>API Gateway Requests</span>
              <Activity className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">
              <NumberTransition value={482091} suffix=" req/d" />
            </div>
            <p className="text-xs text-nexus-on-surface-variant">99.98% 2xx status code</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Avg Endpoint Latency</span>
              <Cpu className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">
              <NumberTransition value={14.2} decimals={1} suffix=" ms" />
            </div>
            <p className="text-xs text-nexus-on-surface-variant">p99 under 45ms</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Active SSE Streams</span>
              <Server className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">
              <NumberTransition value={84} suffix=" clients" />
            </div>
            <p className="text-xs text-nexus-on-surface-variant">0 drops in last 24h</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Simulation Jobs Run</span>
              <BarChart3 className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">
              <NumberTransition value={124} suffix=" runs" />
            </div>
            <p className="text-xs text-nexus-on-surface-variant">100% deterministic results</p>
          </SpringCard>
        </div>
      </FadeIn>
    </AppShell>
  );
}
