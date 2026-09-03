'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Radio, ShieldAlert, ArrowRight, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { FadeIn, SpringCard } from '@/components/motion';

export default function NotificationsFeaturePage() {
  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col">
      <header className="h-20 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/overview" className="inline-flex items-center gap-2 text-sm text-nexus-on-surface-variant hover:text-nexus-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </Link>
          <div className="h-4 w-px bg-nexus-outline-variant/40" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-nexus-primary-container text-white flex items-center justify-center font-bold text-xs">
              NX
            </div>
            <span className="font-bold tracking-tight">Notification Center</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications">
            <Button variant="primary" size="sm">Open Notifications</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-8 py-16 w-full space-y-16">
        <FadeIn className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="healthy" className="font-mono text-xs uppercase tracking-wider">
              Real-time Alert Dispatch
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-display text-nexus-on-surface">
              Deterministic Event-Driven Alerts with Deep-Linked Triage
            </h1>
            <p className="text-lg text-nexus-on-surface-variant leading-relaxed">
              Every critical event across your operations streams directly into the notification center via Server-Sent Events. Click any notification to navigate immediately to the affected vehicle, route, or simulation.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link href="/notifications">
                <Button variant="primary" size="lg" className="gap-2">
                  View All Notifications <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="p-8 rounded-3xl bg-nexus-surface-container/60 border border-nexus-surface-container-high shadow-tactile flex flex-col items-center">
              <Avatar3D mood="WARNING" size="hero" />
              <div className="mt-4 text-center">
                <span className="text-xs font-mono font-medium text-amber-600">DISPATCH NOTIFICATIONS</span>
                <p className="text-sm text-nexus-on-surface-variant">Live SSE channel active</p>
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SpringCard className="p-8 space-y-4">
            <Radio className="h-8 w-8 text-nexus-secondary" />
            <h3 className="text-xl font-bold">Sub-Second SSE Stream</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Low-overhead streaming connections with automatic backoff reconnection and offline queue buffering.
            </p>
          </SpringCard>
          <SpringCard className="p-8 space-y-4">
            <ShieldAlert className="h-8 w-8 text-nexus-critical" />
            <h3 className="text-xl font-bold">Severity Routing</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Filter between Critical, Attention, Resolved, and Informational alerts with custom notification rules.
            </p>
          </SpringCard>
          <SpringCard className="p-8 space-y-4">
            <CheckCheck className="h-8 w-8 text-nexus-secondary" />
            <h3 className="text-xl font-bold">Deep Linking</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Every notification directly opens the exact incident timeline, route map, or simulation comparison.
            </p>
          </SpringCard>
        </div>
      </main>
    </div>
  );
}
