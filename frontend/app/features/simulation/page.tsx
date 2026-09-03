'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Cpu, ArrowRight, Layers, Sliders, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { FadeIn, SpringCard } from '@/components/motion';

export default function SimulationFeaturePage() {
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
            <span className="font-bold tracking-tight">Simulation Lab</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/simulations">
            <Button variant="primary" size="sm">Open Simulation Lab</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-8 py-16 w-full space-y-16">
        <FadeIn className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="simulation" className="font-mono text-xs uppercase tracking-wider">
              Deterministic What-If Engine
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-display text-nexus-on-surface">
              Sandboxed Multi-Scenario Modeling & Decision Optimization
            </h1>
            <p className="text-lg text-nexus-on-surface-variant leading-relaxed">
              Test bold operational adjustments without touching live dispatch systems. Modify fleet availability, simulate regional hub outages, adjust order fulfillment priorities, and evaluate mathematical Pareto trade-offs in real time.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link href="/simulations/new">
                <Button variant="primary" size="lg" className="gap-2">
                  Launch New Scenario <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="p-8 rounded-3xl bg-nexus-lavender/10 border-2 border-dashed border-nexus-lavender/40 shadow-tactile flex flex-col items-center">
              <Avatar3D mood="SIMULATION" size="hero" />
              <div className="mt-4 text-center">
                <span className="text-xs font-mono font-medium text-nexus-lavender-dark">HYPOTHETICAL MODE</span>
                <p className="text-sm text-nexus-on-surface-variant">Isolated from live operational database</p>
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SpringCard borderVariant="simulation" className="p-8 space-y-4">
            <Sliders className="h-8 w-8 text-nexus-lavender-dark" />
            <h3 className="text-xl font-bold">Dynamic Variable Tuning</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Adjust vehicle breakdowns, road weather hazards, driver duty hour caps, and warehouse loading bay bottlenecks.
            </p>
          </SpringCard>
          <SpringCard borderVariant="simulation" className="p-8 space-y-4">
            <Layers className="h-8 w-8 text-nexus-lavender-dark" />
            <h3 className="text-xl font-bold">Side-by-Side Comparison</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Compare baseline vs. hypothetical scenarios across delay delta, operational cost, SLA adherence, and fuel efficiency.
            </p>
          </SpringCard>
          <SpringCard borderVariant="simulation" className="p-8 space-y-4">
            <CheckCircle2 className="h-8 w-8 text-nexus-lavender-dark" />
            <h3 className="text-xl font-bold">Transactional Apply</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Once approved by authorized managers, decisions are committed transactionally to live operations with full audit trails.
            </p>
          </SpringCard>
        </div>
      </main>
    </div>
  );
}
