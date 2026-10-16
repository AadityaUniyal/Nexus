"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  Zap,
  Radio,
  Lock,
  Globe2,
  Gauge,
  CheckCircle2,
  Truck,
  Building2,
  ExternalLink,
  MapPin,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeafletWorldMap, MapVehicle, MapWarehouse } from "@/components/map/LeafletWorldMap";
import { tactileAudio } from "@/lib/sound-effects";

const SAMPLE_HERO_VEHICLES: MapVehicle[] = [
  {
    id: "v-hero-101",
    code: "NX-TRK-101",
    name: "Volvo VNR Electric",
    lat: 28.6139,
    lng: 77.2090,
    speedKmh: 68.5,
    heading: 45,
    status: "IN_TRANSIT",
    driverName: "Vikram Rawat",
    batteryPct: 92,
  },
  {
    id: "v-hero-102",
    code: "NX-TRK-104",
    name: "Freightliner eCascadia",
    lat: 30.3165,
    lng: 78.0322,
    speedKmh: 72.0,
    heading: 90,
    status: "IN_TRANSIT",
    driverName: "Elena Rostova",
    batteryPct: 84,
  },
  {
    id: "v-hero-103",
    code: "NX-TRK-208",
    name: "Kenworth T680E",
    lat: 19.0760,
    lng: 72.8777,
    speedKmh: 64.0,
    heading: 180,
    status: "IN_TRANSIT",
    driverName: "Marcus Vance",
    batteryPct: 79,
  },
];

const SAMPLE_HERO_WAREHOUSES: MapWarehouse[] = [
  {
    id: "wh-hero-ded",
    code: "WH-DED-01",
    name: "Dehradun Intermodal Terminal",
    city: "Dehradun",
    lat: 30.3165,
    lng: 78.0322,
    capacityUnits: 75000,
    currentUnits: 48000,
  },
  {
    id: "wh-hero-del",
    code: "WH-DEL-02",
    name: "Delhi NCR Distribution Superhub",
    city: "Delhi",
    lat: 28.6139,
    lng: 77.2090,
    capacityUnits: 120000,
    currentUnits: 94000,
  },
  {
    id: "wh-hero-bom",
    code: "WH-BOM-03",
    name: "Mumbai Port Intermodal Hub",
    city: "Mumbai",
    lat: 19.0760,
    lng: 72.8777,
    capacityUnits: 90000,
    currentUnits: 62000,
  },
];

export function NexusScrollytellingStage() {
  return (
    <div className="relative w-full bg-[#0c0c0e] text-white overflow-hidden border-b border-stone-800">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#22c55e15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
      <div className="absolute -top-40 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Navigation Header */}
      <header className="relative z-20 w-full px-6 py-5 flex items-center justify-between max-w-7xl mx-auto border-b border-stone-800/80">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black tracking-tighter text-sm shadow-lg shadow-emerald-950">
            NX
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight block leading-none text-white">NEXUS</span>
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
              Autonomous Logistics OS
            </span>
          </div>
        </div>

        {/* Live SLA & Status Badge */}
        <Link
          href="/status"
          className="hidden sm:flex items-center gap-2 bg-stone-900/90 hover:bg-stone-800 border border-stone-800 px-3.5 py-1.5 rounded-full text-xs font-mono text-stone-300 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SLA: 99.98% Operational</span>
          <ExternalLink className="w-3 h-3 text-stone-500 ml-0.5" />
        </Link>

        {/* Navigation CTAs */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link href="/driver-pass">
            <Button variant="ghost" size="sm" className="text-xs text-stone-300 hover:text-white font-mono gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Driver PWA</span>
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs text-stone-300 hover:text-white font-mono">
              Sign In
            </Button>
          </Link>
          <Link href="/overview">
            <Button
              variant="primary"
              size="sm"
              onClick={() => tactileAudio.playClick()}
              className="text-xs font-mono gap-1.5 shadow-lg shadow-emerald-950 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              <span>Launch Cockpit</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero Split View */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Value Proposition & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 space-y-6 text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Real-Time Spatial Digital Twin & AI Preemption</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
            Autonomous Freight. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Zero Second Guessing.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
            NEXUS replaces clunky, reactive fleet software with a predictive decision engine. Continuously simulate
            weather hazards, battery degradation, and depot chokepoints with 1-click automated detour dispatch.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/overview">
              <Button
                variant="primary"
                size="lg"
                onClick={() => tactileAudio.playSuccess()}
                className="font-mono text-sm font-bold gap-2 px-6 py-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950"
              >
                <Truck className="w-4 h-4" />
                <span>Open Operations Cockpit</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/driver-pass">
              <Button
                variant="outline"
                size="lg"
                onClick={() => tactileAudio.playClick()}
                className="font-mono text-sm font-semibold gap-2 px-5 py-6 rounded-xl border-stone-700 hover:border-emerald-500 text-stone-200 hover:text-white bg-stone-900/60"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Zero-Install Driver Pass</span>
              </Button>
            </Link>
          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-800 text-left">
            <div>
              <p className="text-[10px] font-mono text-stone-400 uppercase">SLA Target</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-0.5">99.98%</p>
              <p className="text-[10px] text-stone-500 font-mono">Live verified</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-stone-400 uppercase">Stream Latency</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-sky-400 mt-0.5">&lt;18ms</p>
              <p className="text-[10px] text-stone-500 font-mono">Sub-second telemetry</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-stone-400 uppercase">Role Cockpits</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-purple-400 mt-0.5">5 Personas</p>
              <p className="text-[10px] text-stone-500 font-mono">Cognitive load scoped</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Interactive Leaflet World Map Preview HUD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="lg:col-span-6"
        >
          <div className="rounded-3xl border border-stone-800 bg-stone-950/80 backdrop-blur-xl shadow-2xl overflow-hidden p-2 relative group">
            {/* Top Window Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-stone-800/80 text-xs font-mono text-stone-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-semibold text-stone-300">Live GIS Fleet Telemetry Map</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
            </div>

            {/* Embedded Leaflet World Map Component */}
            <div className="h-[380px] sm:h-[440px] w-full rounded-2xl overflow-hidden relative">
              <LeafletWorldMap
                vehicles={SAMPLE_HERO_VEHICLES}
                warehouses={SAMPLE_HERO_WAREHOUSES}
                centerLocation={{
                  id: "loc-india-delhi",
                  display_name: "Northern India Industrial Corridor",
                  latitude: 28.6139,
                  longitude: 77.2090,
                  type: "corridor",
                  confidence: 1.0,
                  provider: "nexus-gps",
                }}
                className="h-full w-full"
              />
            </div>

            {/* Bottom Telemetry Ticker Overlay */}
            <div className="px-3 py-2.5 bg-stone-900/90 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-400">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Active Commercial Beacons: 3 Vehicles · 3 Distribution Hubs</span>
              </div>
              <Link href="/live-world" className="text-emerald-400 hover:underline flex items-center gap-1">
                <span>Expand GIS Viewport</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
