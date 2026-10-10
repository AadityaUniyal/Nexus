"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Compass,
  Smartphone,
  Navigation,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  TrendingUp,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-blue-500/20 selection:text-blue-300 font-sans">
      {/* Navigation Bar */}
      <header className="h-16 border-b border-zinc-800/80 px-6 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-bold text-base tracking-tight">
          <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
          <span className="font-mono text-zinc-100">NEXUS</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Real-Data Delivery Risk Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-100 max-w-3xl leading-[1.15]">
          Know which jobs <span className="text-blue-500">will miss</span> their time window before they do.
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal leading-relaxed">
          NEXUS connects real driver smartphone GPS directly to live Azure Maps traffic engines.
          Predict delays, approve suggested reroutes in one tap, and measure empirical prediction accuracy.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/sign-up">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold h-11 px-6 gap-2 shadow-lg shadow-blue-600/20">
              <span>Open Dispatcher Cockpit</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button
              variant="outline"
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-sm font-semibold h-11 px-6"
            >
              Existing Fleet Sign In
            </Button>
          </Link>
        </div>

        {/* The Closed Decision Loop */}
        <div className="w-full pt-16 space-y-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500">
            The Closed Decision Loop
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <Card className="p-4 bg-zinc-900/80 border-zinc-800 space-y-2">
              <span className="text-xs font-bold font-mono text-blue-400">01. STREAM</span>
              <h3 className="text-sm font-semibold text-zinc-200">Real Driver GPS</h3>
              <p className="text-xs text-zinc-400">
                Drivers tap a link in their phone browser. Zero hardware or app install.
              </p>
            </Card>

            <Card className="p-4 bg-zinc-900/80 border-zinc-800 space-y-2">
              <span className="text-xs font-bold font-mono text-amber-400">02. PREDICT</span>
              <h3 className="text-sm font-semibold text-zinc-200">Live Traffic ETA</h3>
              <p className="text-xs text-zinc-400">
                Continuous Azure Maps routing flags at-risk stops before the customer notices.
              </p>
            </Card>

            <Card className="p-4 bg-zinc-900/80 border-zinc-800 space-y-2">
              <span className="text-xs font-bold font-mono text-emerald-400">03. FIX</span>
              <h3 className="text-sm font-semibold text-zinc-200">One-Tap Approval</h3>
              <p className="text-xs text-zinc-400">
                Matrix-evaluated reassignments or stop reordering applied with a single click.
              </p>
            </Card>

            <Card className="p-4 bg-zinc-900/80 border-zinc-800 space-y-2">
              <span className="text-xs font-bold font-mono text-purple-400">04. MEASURE</span>
              <h3 className="text-sm font-semibold text-zinc-200">Verified Outcomes</h3>
              <p className="text-xs text-zinc-400">
                Arrival timestamps recorded to calculate real accuracy and tamper-evident audit logs.
              </p>
            </Card>
          </div>
        </div>

        {/* Two Surfaces */}
        <div className="w-full pt-12 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">Dispatcher Cockpit</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Desktop-first operations center with MapLibre GL rendering Azure Maps tiles, real-time SSE vehicle streams, route previews, and automated risk suggestions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">Driver Phone PWA</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instant mobile browser access with Screen Wake Lock, IndexedDB offline ping resilience, and one-tap En Route, Arrived, and Delivered buttons.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 px-6 text-center text-xs text-zinc-500 font-mono">
        <p>NEXUS · Real-Data Fleet Operations Platform · Powered by Azure Maps Gen2</p>
      </footer>
    </div>
  );
}
