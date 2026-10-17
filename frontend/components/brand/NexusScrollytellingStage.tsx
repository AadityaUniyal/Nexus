"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
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
  Box,
  Eye,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeafletWorldMap, MapVehicle, MapWarehouse } from "@/components/map/LeafletWorldMap";
import { tactileAudio } from "@/lib/sound-effects";
import type { VehicleLivery, VehicleClass } from "./Nexus3DFleetTwin";

// Dynamic import with ssr: false for high-performance 3D WebGL Canvas
const Dynamic3DFleetTwin = dynamic(
  () => import("./Nexus3DFleetTwin").then((mod) => mod.Nexus3DFleetTwin),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] sm:h-[450px] bg-gradient-to-b from-[#131317] to-[#040405] flex flex-col items-center justify-center gap-3 rounded-2xl border border-stone-800">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-stone-400 tracking-wider">
          INITIALIZING KINETIC 3D TWIN...
        </span>
      </div>
    ),
  }
);

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

const LIVERY_OPTIONS: { id: VehicleLivery; name: string; colorHex: string; accentHex: string }[] = [
  { id: "amber", name: "Amber Flame", colorHex: "#ea580c", accentHex: "#fb923c" },
  { id: "obsidian", name: "Stealth Obsidian", colorHex: "#18181b", accentHex: "#38bdf8" },
  { id: "emerald", name: "Apex Emerald", colorHex: "#059669", accentHex: "#34d399" },
  { id: "cyan", name: "Arctic Cyan", colorHex: "#0891b2", accentHex: "#22d3ee" },
];

const CLASS_OPTIONS: { id: VehicleClass; label: string; payload: string; range: string; spec: string }[] = [
  { id: "CLASS_8_EV", label: "Class 8 EV", payload: "42,000 kg", range: "820 km", spec: "Aerodynamic Long-Haul Semi" },
  { id: "INTERMODAL", label: "Intermodal", payload: "30,500 kg", range: "1,200 km", spec: "ISO Cold-Chain Container" },
  { id: "URBAN_POD", label: "Urban Pod", payload: "3,800 kg", range: "450 km", spec: "L4 Autonomous Micro-Freight" },
];

export function NexusScrollytellingStage() {
  const [activeTab, setActiveTab] = React.useState<"3d" | "map">("3d");
  const [selectedLivery, setSelectedLivery] = React.useState<VehicleLivery>("amber");
  const [selectedClass, setSelectedClass] = React.useState<VehicleClass>("CLASS_8_EV");

  const currentClassData = CLASS_OPTIONS.find((c) => c.id === selectedClass) || CLASS_OPTIONS[0];

  return (
    <div className="relative w-full bg-[#070709] text-white overflow-hidden border-b border-stone-800">
      {/* Background Subtle Gradient Grid with Ambient Studio Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(249,115,22,0.08)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none opacity-40" />
      <div className="absolute -top-40 right-10 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-10 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Floating Glass Navigation Header */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto border-b border-stone-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/30 border border-orange-500/40 flex items-center justify-center text-amber-400 font-black tracking-tighter text-sm shadow-lg shadow-orange-950/40">
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
          className="hidden sm:flex items-center gap-2 bg-stone-900/90 hover:bg-stone-800/90 border border-stone-800 px-3.5 py-1.5 rounded-full text-xs font-mono text-stone-300 transition-colors shadow-inner"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SLA: 99.98% Operational</span>
          <ExternalLink className="w-3 h-3 text-stone-500 ml-0.5" />
        </Link>

        {/* Navigation CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/driver-pass">
            <Button variant="ghost" size="sm" className="text-xs text-stone-300 hover:text-white font-mono gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Driver PWA</span>
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
              className="text-xs font-mono gap-1.5 shadow-lg shadow-orange-950/50 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold"
            >
              <span>Launch Cockpit</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero Split View */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Value Proposition & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6 text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            <span>Interactive 3D Digital Twin & Leaflet GIS Tracking</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white">
            Precision Freight. <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Zero Fleet Downtime.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
            NEXUS replaces clunky, fragmented fleet software with a real-time spatial operating system.
            Inspect 3D heavy vehicle telemetry, simulate kinetic reroutes, and execute detours with sub-18ms StreamGrid™ latency.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href="/overview">
              <Button
                variant="primary"
                size="lg"
                onClick={() => tactileAudio.playSuccess()}
                className="font-mono text-sm font-bold gap-2 px-6 py-6 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-xl shadow-orange-950/60"
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
                className="font-mono text-sm font-semibold gap-2 px-5 py-6 rounded-xl border-stone-800 hover:border-orange-500 text-stone-200 hover:text-white bg-stone-900/70"
              >
                <QrCode className="w-4 h-4 text-orange-400" />
                <span>Driver Mobile Pass</span>
              </Button>
            </Link>
          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-stone-800/80 text-left">
            <div>
              <p className="text-[10px] font-mono text-stone-400 uppercase">SLA Target</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-0.5">99.98%</p>
              <p className="text-[10px] text-stone-500 font-mono">Live verified</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-stone-400 uppercase">Stream Latency</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-sky-400 mt-0.5">&lt;18ms</p>
              <p className="text-[10px] text-stone-500 font-mono">StreamGrid™ sync</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-stone-400 uppercase">Role Cockpits</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-0.5">5 Personas</p>
              <p className="text-[10px] text-stone-500 font-mono">RBAC partitioned</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Interactive 3D Showcase & Leaflet HUD (Reel-inspired) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="lg:col-span-7"
        >
          <div className="rounded-3xl border border-stone-800/90 bg-stone-950/90 backdrop-blur-2xl shadow-2xl overflow-hidden p-3 relative group">
            {/* Top Window Control Bar with Dual View Tabs */}
            <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-stone-800/80 gap-2 text-xs font-mono text-stone-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-semibold text-stone-200">
                  {activeTab === "3d" ? "Kinetic 3D Digital Twin Viewer" : "Live GIS Fleet Telemetry Map"}
                </span>
              </div>

              {/* View Switcher Pill (Inspired by the reel) */}
              <div className="flex items-center bg-stone-900 border border-stone-800 p-0.5 rounded-full text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    tactileAudio.playClick();
                    setActiveTab("3d");
                  }}
                  className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 font-medium ${
                    activeTab === "3d"
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md font-bold"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <Box className="w-3 h-3" />
                  <span>3D Twin</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tactileAudio.playClick();
                    setActiveTab("map");
                  }}
                  className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 font-medium ${
                    activeTab === "map"
                      ? "bg-emerald-600 text-white shadow-md font-bold"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <Globe2 className="w-3 h-3" />
                  <span>GIS Map</span>
                </button>
              </div>
            </div>

            {/* Viewport Content */}
            <div className="relative mt-2 rounded-2xl overflow-hidden border border-stone-800/80">
              {activeTab === "3d" ? (
                <div className="relative w-full">
                  <Dynamic3DFleetTwin livery={selectedLivery} vehicleClass={selectedClass} />

                  {/* Floating Luxury Telemetry Badge (Inspired by the $149 price card in the reel) */}
                  <div className="absolute top-4 right-4 bg-stone-950/85 backdrop-blur-xl border border-stone-800/90 rounded-2xl p-3.5 text-left shadow-2xl pointer-events-auto max-w-[210px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Payload Cap</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">{currentClassData.payload}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Est. Range</span>
                      <span className="text-xs font-bold font-mono text-amber-400">{currentClassData.range}</span>
                    </div>
                    <div className="pt-1 border-t border-stone-800/80">
                      <span className="text-[9px] font-mono text-stone-500 uppercase block">Configuration</span>
                      <span className="text-[11px] font-medium text-stone-300 truncate block">{currentClassData.spec}</span>
                    </div>
                  </div>

                  {/* Floating Lower Philosophy Pill (Inspired by "Confidence, wrapped in warmth" in the reel) */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-950/80 backdrop-blur-md border border-stone-800/80 px-4 py-1.5 rounded-full text-[11px] font-mono text-stone-300 pointer-events-none flex items-center gap-2 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Autonomy engineered for zero fleet downtime</span>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] sm:h-[450px] w-full relative">
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
              )}
            </div>

            {/* Bottom Controls Bar: Livery Swatches & Class Selector (Exact parallel to the reel's jacket controls) */}
            {activeTab === "3d" ? (
              <div className="mt-2 px-3 py-2.5 bg-stone-900/90 rounded-2xl border border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                {/* Livery Color Switcher */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider">Livery:</span>
                  <div className="flex items-center gap-1.5">
                    {LIVERY_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          tactileAudio.playClick();
                          setSelectedLivery(opt.id);
                        }}
                        title={opt.name}
                        className={`w-5 h-5 rounded-full transition-transform border ${
                          selectedLivery === opt.id
                            ? "scale-125 border-white ring-2 ring-orange-500/50"
                            : "border-stone-700 opacity-60 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: opt.colorHex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Vehicle Class Selector (Parallel to size selector 36, 38, 40) */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider">Class:</span>
                  {CLASS_OPTIONS.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        tactileAudio.playClick();
                        setSelectedClass(cls.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                        selectedClass === cls.id
                          ? "bg-stone-800 text-white border border-stone-700 shadow-sm"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      {cls.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-2 px-3 py-2.5 bg-stone-900/90 rounded-2xl border border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-400">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Active Commercial Beacons: 3 Vehicles · 3 Distribution Hubs</span>
                </div>
                <Link href="/live-world" className="text-emerald-400 hover:underline flex items-center gap-1">
                  <span>Expand GIS Viewport</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
