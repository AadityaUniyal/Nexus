'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, AlertTriangle, ArrowRight, Activity, Cpu, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { FadeIn, SpringCard } from '@/components/motion';

export default function IncidentIntelligencePage() {
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
            <span className="font-bold tracking-tight">Incident Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/incidents">
            <Button variant="primary" size="sm">Open Incident Center</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-8 py-16 w-full space-y-16">
        <FadeIn className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="critical" className="font-mono text-xs uppercase tracking-wider">
              Autonomous Risk Mitigation
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-display text-nexus-on-surface">
              Deterministic Incident Lifecycle & Root Cause Correlation
            </h1>
            <p className="text-lg text-nexus-on-surface-variant leading-relaxed">
              Detect bottlenecks, weather disruptions, route blockages, and refrigerated trailer excursions before they breach customer SLAs. Transition incidents cleanly through strict operational state machines.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link href="/incidents">
                <Button variant="primary" size="lg" className="gap-2">
                  View Live Incidents <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="p-8 rounded-3xl bg-nexus-surface-container/60 border border-nexus-surface-container-high shadow-tactile flex flex-col items-center">
              <Avatar3D mood="CRITICAL" size="hero" />
              <div className="mt-4 text-center">
                <span className="text-xs font-mono font-medium text-nexus-critical">CRITICAL TRIAGE</span>
                <p className="text-sm text-nexus-on-surface-variant">Real-time root cause monitor</p>
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SpringCard className="p-8 space-y-4">
            <ShieldAlert className="h-8 w-8 text-nexus-critical" />
            <h3 className="text-xl font-bold">Strict State Machine</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Guaranteed transitions: DETECTED → ACKNOWLEDGED → INVESTIGATING → SIMULATING → ACTION_PENDING → ACTION_APPLIED → MONITORING → RESOLVED.
            </p>
          </SpringCard>
          <SpringCard className="p-8 space-y-4">
            <Activity className="h-8 w-8 text-nexus-secondary" />
            <h3 className="text-xl font-bold">SLA Exposure Modeling</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Instantly quantify contract penalties and customer impact across delayed orders with automated priority elevation.
            </p>
          </SpringCard>
          <SpringCard className="p-8 space-y-4">
            <Cpu className="h-8 w-8 text-nexus-lavender-dark" />
            <h3 className="text-xl font-bold">1-Click Simulation</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Seamlessly fork any active incident into a sandboxed simulation scenario to evaluate reroutes and backup asset dispatches.
            </p>
          </SpringCard>
        </div>
      </main>
    </div>
  );
}
