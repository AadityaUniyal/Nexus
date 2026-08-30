"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Layers,
  Maximize2,
  Minimize2,
  Navigation,
  Plus,
  Minus,
  RotateCcw,
  ShieldAlert,
  Truck,
  Building2,
  CloudRain,
  Radio,
  Eye,
  Crosshair,
  Compass,
} from "lucide-react";
import { WarehouseItem, VehicleItem, RouteItem, IncidentItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PulseLED } from "@/components/ui/motion-animations";

export interface InteractiveWorldMapProps {
  warehouses: WarehouseItem[];
  vehicles: VehicleItem[];
  routes: RouteItem[];
  incidents: IncidentItem[];
  selectedEntity?: { type: "VEHICLE" | "WAREHOUSE" | "ROUTE" | "INCIDENT"; id: string } | null;
  onSelectEntity?: (entity: { type: "VEHICLE" | "WAREHOUSE" | "ROUTE" | "INCIDENT"; id: string }) => void;
  className?: string;
}

type MapTheme = "voyager" | "positron" | "dark" | "osm";

interface MapViewState {
  lat: number;
  lng: number;
  zoom: number;
}

export function InteractiveWorldMap({
  warehouses,
  vehicles,
  routes,
  incidents,
  selectedEntity,
  onSelectEntity,
  className,
}: InteractiveWorldMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = React.useState<MapViewState>({
    lat: 39.5,
    lng: -98.35,
    zoom: 4, // Continental US view
  });

  const [mapTheme, setMapTheme] = React.useState<MapTheme>("voyager");
  const [layers, setLayers] = React.useState({
    vehicles: true,
    warehouses: true,
    routes: true,
    weather: true,
    telemetry: true,
  });

  const [activeInspector, setActiveInspector] = React.useState<any | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState<{ x: number; y: number } | null>(null);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  // Convert GPS (lat, lng) to pixel offsets relative to current view center and zoom
  const projectCoords = React.useCallback(
    (lat: number, lng: number, width: number, height: number): { x: number; y: number } => {
      // Standard Web Mercator projection scaling
      const scale = Math.pow(2, viewState.zoom) * 38;
      const x = width / 2 + (lng - viewState.lng) * scale;
      const latRad = (lat * Math.PI) / 180;
      const viewLatRad = (viewState.lat * Math.PI) / 180;
      const y = height / 2 - (latRad - viewLatRad) * scale * 58;
      return { x, y };
    },
    [viewState]
  );

  // Handle Pan Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest(".prevent-drag")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const scaleFactor = 38 * Math.pow(2, viewState.zoom);

    setViewState((prev) => ({
      ...prev,
      lng: prev.lng - dx / scaleFactor,
      lat: prev.lat + dy / (scaleFactor * 1.5),
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.2 : -0.2;
    setViewState((prev) => ({
      ...prev,
      zoom: Math.min(8, Math.max(2.5, prev.zoom + zoomDelta)),
    }));
  };

  // Quick preset jump
  const jumpTo = (lat: number, lng: number, zoom = 5) => {
    setViewState({ lat, lng, zoom });
  };

  // Dimensions
  const [dimensions, setDimensions] = React.useState({ width: 900, height: 550 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={cn(
        "relative w-full h-[580px] bg-[#FAF8F5] dark:bg-[#121214] rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden select-none cursor-grab active:cursor-grabbing font-sans",
        isFullScreen && "fixed inset-0 z-50 h-screen rounded-none border-none",
        className
      )}
    >
      {/* 1. Map Canvas Visual Background Grid / Warm Topology */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <defs>
          <pattern id="warm-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-stone-300 dark:text-stone-800" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#warm-map-grid)" />
      </svg>

      {/* 2. Polyline Routes Overlay */}
      {layers.routes && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {routes.map((route) => {
            const originWh = warehouses.find((w) => w.id === route.originWarehouseId);
            const destWh = warehouses.find((w) => w.id === route.destWarehouseId);
            if (!originWh || !destWh) return null;

            const p1 = projectCoords(originWh.lat, originWh.lng, dimensions.width, dimensions.height);
            const p2 = projectCoords(destWh.lat, destWh.lng, dimensions.width, dimensions.height);

            const isAlert = route.riskScore > 50;
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 - 25; // slight curve

            const pathD = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;

            return (
              <g key={route.id} className="transition-all duration-300">
                {/* Glow route underlay */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isAlert ? "#ef4444" : "#10b981"}
                  strokeWidth="6"
                  strokeOpacity={isAlert ? "0.2" : "0.15"}
                  strokeLinecap="round"
                />
                {/* Main route track */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isAlert ? "#dc2626" : "#059669"}
                  strokeWidth="2.5"
                  strokeDasharray={isAlert ? "6, 4" : "none"}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* 3. Weather Hazard Radial Zones */}
      {layers.weather &&
        incidents
          .filter((inc) => inc.status !== "RESOLVED")
          .map((inc) => {
            // Target coordinates (e.g. Wyoming Pass on I-80: 41.14, -104.82)
            const p = projectCoords(41.14, -104.82, dimensions.width, dimensions.height);
            return (
              <div
                key={inc.id}
                style={{ left: `${p.x}px`, top: `${p.y}px` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
              >
                <div className="w-36 h-36 rounded-full bg-rose-500/10 border border-rose-500/30 animate-pulse flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center">
                    <CloudRain className="w-6 h-6 text-rose-600 dark:text-rose-400 opacity-80" />
                  </div>
                </div>
              </div>
            );
          })}

      {/* 4. Warehouse Hub Nodes */}
      {layers.warehouses &&
        warehouses.map((wh) => {
          const p = projectCoords(wh.lat, wh.lng, dimensions.width, dimensions.height);
          const isInspected = activeInspector?.id === wh.id;

          return (
            <div
              key={wh.id}
              style={{ left: `${p.x}px`, top: `${p.y}px` }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveInspector({ type: "WAREHOUSE", ...wh });
                onSelectEntity?.({ type: "WAREHOUSE", id: wh.id });
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            >
              <div className="relative flex flex-col items-center">
                {/* Node Ring */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-800 shadow-md flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg",
                    isInspected && "ring-4 ring-emerald-500/40 border-emerald-600 scale-110"
                  )}
                >
                  <Building2 className="w-4 h-4 text-stone-800 dark:text-stone-200" />
                </div>
                {/* Label */}
                <div className="mt-1 px-2 py-0.5 rounded-md bg-stone-900/90 backdrop-blur-sm text-stone-100 text-[10px] font-mono tracking-tight shadow-sm whitespace-nowrap">
                  {wh.code}
                </div>
              </div>
            </div>
          );
        })}

      {/* 5. Live Fleet Vehicle Markers */}
      {layers.vehicles &&
        vehicles.map((v) => {
          const p = projectCoords(v.lat, v.lng, dimensions.width, dimensions.height);
          const isInspected = activeInspector?.id === v.id;
          const isMoving = v.status === "IN_TRANSIT";

          return (
            <div
              key={v.id}
              style={{ left: `${p.x}px`, top: `${p.y}px` }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveInspector({ type: "VEHICLE", ...v });
                onSelectEntity?.({ type: "VEHICLE", id: v.id });
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                {isMoving && (
                  <span className="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-ping" />
                )}
                <div
                  className={cn(
                    "w-7 h-7 rounded-full bg-emerald-600 text-white shadow-md flex items-center justify-center border-2 border-white dark:border-stone-900 transition-transform duration-200 group-hover:scale-125",
                    isInspected && "ring-4 ring-emerald-400 scale-125 bg-emerald-700"
                  )}
                >
                  <Truck className="w-3.5 h-3.5" />
                </div>
                {/* Vehicle Speed Badge */}
                <div className="absolute left-full ml-1.5 px-1.5 py-0.5 rounded bg-stone-900/85 text-white font-mono text-[9px] whitespace-nowrap shadow-sm">
                  {v.code} • {v.speedKmh} km/h
                </div>
              </div>
            </div>
          );
        })}

      {/* 6. Map Controls Top Bar */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <PulseLED color="emerald" size="sm" />
          <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            NEXUS Continental GIS
          </span>
          <Badge variant="outline" className="text-[10px] font-mono ml-1">
            4.2k eps
          </Badge>
        </div>

        {/* Preset Locations */}
        <div className="hidden sm:flex items-center gap-1 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-1 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm text-xs font-medium">
          <button
            onClick={() => jumpTo(39.5, -98.35, 4)}
            className="px-2.5 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            Continental US
          </button>
          <button
            onClick={() => jumpTo(41.87, -87.62, 6)}
            className="px-2.5 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            Chicago Hub
          </button>
          <button
            onClick={() => jumpTo(32.77, -96.79, 6)}
            className="px-2.5 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            Dallas Superhub
          </button>
        </div>
      </div>

      {/* 7. Zoom & Navigation Controls */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-1.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <Button
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-lg"
          onClick={() => setViewState((prev) => ({ ...prev, zoom: Math.min(8, prev.zoom + 0.5) }))}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-lg"
          onClick={() => setViewState((prev) => ({ ...prev, zoom: Math.max(2.5, prev.zoom - 0.5) }))}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <div className="h-px bg-stone-200 dark:bg-stone-800 my-0.5" />
        <Button
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-lg"
          onClick={() => jumpTo(39.5, -98.35, 4)}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-lg"
          onClick={() => setIsFullScreen(!isFullScreen)}
        >
          {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* 8. Layer Toggles */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-1 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <button
          onClick={() => setLayers((l) => ({ ...l, vehicles: !l.vehicles }))}
          className={cn(
            "px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors font-medium",
            layers.vehicles
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          )}
        >
          <Truck className="w-3.5 h-3.5" />
          Fleet ({vehicles.length})
        </button>
        <button
          onClick={() => setLayers((l) => ({ ...l, warehouses: !l.warehouses }))}
          className={cn(
            "px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors font-medium",
            layers.warehouses
              ? "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
              : "text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          )}
        >
          <Building2 className="w-3.5 h-3.5" />
          Hubs ({warehouses.length})
        </button>
        <button
          onClick={() => setLayers((l) => ({ ...l, weather: !l.weather }))}
          className={cn(
            "px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors font-medium",
            layers.weather
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              : "text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          )}
        >
          <CloudRain className="w-3.5 h-3.5" />
          Hazards
        </button>
      </div>

      {/* 9. Inspector Drawer Bottom Popover */}
      <AnimatePresence>
        {activeInspector && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-4 left-4 z-40 w-96 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
                  {activeInspector.type} INSPECTOR
                </span>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {activeInspector.name || activeInspector.code}
                </h4>
              </div>
              <button
                onClick={() => setActiveInspector(null)}
                className="text-stone-400 hover:text-stone-700 text-xs px-2 py-1 rounded-lg hover:bg-stone-100"
              >
                Close
              </button>
            </div>

            {activeInspector.type === "VEHICLE" && (
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">STATUS</span>
                  <span className="font-semibold text-emerald-600">{activeInspector.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">BATTERY</span>
                  <span className="font-semibold font-mono">{activeInspector.batteryPct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">SPEED</span>
                  <span className="font-semibold font-mono">{activeInspector.speedKmh} km/h</span>
                </div>
              </div>
            )}

            {activeInspector.type === "WAREHOUSE" && (
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">CAPACITY</span>
                  <span className="font-semibold font-mono">
                    {Math.round((activeInspector.currentUnits / activeInspector.capacityUnits) * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">ACTIVE DOCKS</span>
                  <span className="font-semibold font-mono">
                    {activeInspector.activeDocks} / {activeInspector.dockCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">EFFICIENCY</span>
                  <span className="font-semibold font-mono text-emerald-600">
                    {activeInspector.efficiencyPct}%
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
