'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe2, Layers, Navigation, ShieldCheck, Zap, ArrowRight, Eye, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { FadeIn, SpringCard } from '@/components/motion';

export default function LiveWorldFeaturePage() {
  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-nexus-on-surface-variant hover:text-nexus-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </Link>
          <div className="h-4 w-px bg-nexus-outline-variant/40" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-nexus-primary-container text-white flex items-center justify-center font-bold text-xs">
              NX
            </div>
            <span className="font-bold tracking-tight">Live World</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/live-world">
            <Button variant="primary" size="sm">Launch Live World</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-7xl mx-auto px-8 py-16 w-full space-y-16">
        <FadeIn className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="healthy" className="font-mono text-xs uppercase tracking-wider">
              Spatial Telemetry Engine
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-display text-nexus-on-surface">
              Interactive 3D Digital Twin for Real-time Fleet Logistics
            </h1>
            <p className="text-lg text-nexus-on-surface-variant leading-relaxed">
              Experience your entire physical operational footprint rendered as a living, breathing spatial environment. Monitor GPS trajectories, cargo temperature tolerances, dock bottlenecks, and telemetry alerts in real time.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link href="/live-world">
                <Button variant="primary" size="lg" className="gap-2">
                  Explore Live World <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/simulations">
                <Button variant="secondary" size="lg">
                  View Simulation Lab
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative p-8 rounded-3xl bg-nexus-surface-container/60 border border-nexus-surface-container-high shadow-tactile flex flex-col items-center">
              <Avatar3D mood="WELCOME" size="hero" />
              <div className="mt-4 text-center">
                <span className="text-xs font-mono font-medium text-nexus-secondary">NEXUS COMPANION</span>
                <p className="text-sm text-nexus-on-surface-variant">Live telemetry observer active</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SpringCard className="p-8 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-nexus-secondary-container/30 text-nexus-secondary flex items-center justify-center">
              <Globe2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-nexus-on-surface">Geospatial Splines</h3>
            <p className="text-sm text-nexus-on-surface-variant leading-relaxed">
              High-frequency GPS updates interpolated along route splines to eliminate latency jitter and deliver sub-second position accuracy.
            </p>
          </SpringCard>

          <SpringCard className="p-8 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-nexus-secondary-container/30 text-nexus-secondary flex items-center justify-center">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-nexus-on-surface">Warehouse Digital Twins</h3>
            <p className="text-sm text-nexus-on-surface-variant leading-relaxed">
              Monitor bay occupancy, pallet throughput, and dock congestion with automated queue time forecasting and cross-docking synchronization.
            </p>
          </SpringCard>

          <SpringCard className="p-8 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-nexus-secondary-container/30 text-nexus-secondary flex items-center justify-center">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-nexus-on-surface">Hypothetical Overlays</h3>
            <p className="text-sm text-nexus-on-surface-variant leading-relaxed">
              Seamlessly toggle between live operations (sage green) and active what-if simulations (lavender purple) directly in the 3D viewport.
            </p>
          </SpringCard>
        </div>
      </main>
    </div>
  );
}
