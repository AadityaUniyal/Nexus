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
  Search,
  MapPin,
  Activity,
  Globe,
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

// Global Cities Geo Dictionary for instantaneous high-precision search & fly-to navigation
const GLOBAL_CITY_COORDINATES: Record<string, { lat: number; lng: number; label: string; country: string }> = {
  dehradun: { lat: 30.3165, lng: 78.0322, label: "Dehradun Hub", country: "India" },
  haridwar: { lat: 29.9457, lng: 78.1642, label: "Haridwar Gateway", country: "India" },
  rishikesh: { lat: 30.0869, lng: 78.2676, label: "Rishikesh Logistics Depot", country: "India" },
  delhi: { lat: 28.6139, lng: 77.2090, label: "Delhi NCR Superhub", country: "India" },
  mumbai: { lat: 19.0760, lng: 72.8777, label: "Mumbai Maritime Terminal", country: "India" },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: "Bengaluru Tech Corridor", country: "India" },
  bangalore: { lat: 12.9716, lng: 77.5946, label: "Bengaluru Tech Corridor", country: "India" },
  hyderabad: { lat: 17.3850, lng: 78.4867, label: "Hyderabad Aerospace Hub", country: "India" },
  chennai: { lat: 13.0827, lng: 80.2707, label: "Chennai Container Port", country: "India" },
  kolkata: { lat: 22.5726, lng: 88.3639, label: "Kolkata Eastern Port", country: "India" },
  pune: { lat: 18.5204, lng: 73.8567, label: "Pune Industrial Depot", country: "India" },
  ahmedabad: { lat: 23.0225, lng: 72.5714, label: "Ahmedabad Inland Terminal", country: "India" },
  chandigarh: { lat: 30.7333, lng: 76.7794, label: "Chandigarh Freight Center", country: "India" },
  london: { lat: 51.5074, lng: -0.1278, label: "London Gateway Hub", country: "UK" },
  tokyo: { lat: 35.6762, lng: 139.6503, label: "Tokyo Port Terminal", country: "Japan" },
  singapore: { lat: 1.3521, lng: 103.8198, label: "Singapore Global Intermodal", country: "Singapore" },
  dubai: { lat: 25.2048, lng: 55.2708, label: "Dubai Logistics City", country: "UAE" },
  frankfurt: { lat: 50.1109, lng: 8.6821, label: "Frankfurt CargoCity", country: "Germany" },
  paris: { lat: 48.8566, lng: 2.3522, label: "Paris Nord Terminal", country: "France" },
  berlin: { lat: 52.5200, lng: 13.4050, label: "Berlin Brandenburg Hub", country: "Germany" },
  amsterdam: { lat: 52.3676, lng: 4.9041, label: "Amsterdam Schiphol Gateway", country: "Netherlands" },
  newyork: { lat: 40.7128, lng: -74.0060, label: "New York Metro Port", country: "USA" },
  "new york": { lat: 40.7128, lng: -74.0060, label: "New York Metro Port", country: "USA" },
  chicago: { lat: 41.8781, lng: -87.6298, label: "Chicago Rail Superhub", country: "USA" },
  losangeles: { lat: 34.0522, lng: -118.2437, label: "Los Angeles Long Beach Port", country: "USA" },
  "los angeles": { lat: 34.0522, lng: -118.2437, label: "Los Angeles Long Beach Port", country: "USA" },
  sanfrancisco: { lat: 37.7749, lng: -122.4194, label: "San Francisco Bay Terminal", country: "USA" },
  "san francisco": { lat: 37.7749, lng: -122.4194, label: "San Francisco Bay Terminal", country: "USA" },
  seattle: { lat: 47.6062, lng: -122.3321, label: "Seattle Northwest Hub", country: "USA" },
  toronto: { lat: 43.6532, lng: -79.3832, label: "Toronto Inland Intermodal", country: "Canada" },
  sydney: { lat: -33.8688, lng: 151.2093, label: "Sydney Botany Port", country: "Australia" },
};

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

  // Compute dynamic centroid based on loaded warehouses / vehicles or default workspace
  const getInitialCentroid = React.useCallback((): MapViewState => {
    if (typeof window !== "undefined") {
      try {
        const savedLoc = localStorage.getItem("nexus_workspace_location");
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed.lat && parsed.lng) {
            return { lat: parsed.lat, lng: parsed.lng, zoom: 6 };
          }
          if (parsed.latitude && parsed.longitude) {
            return { lat: parsed.latitude, lng: parsed.longitude, zoom: 6 };
          }
        }
      } catch {}
    }

    if (warehouses.length > 0) {
      const avgLat = warehouses.reduce((sum, w) => sum + w.lat, 0) / warehouses.length;
      const avgLng = warehouses.reduce((sum, w) => sum + w.lng, 0) / warehouses.length;
      return { lat: avgLat, lng: avgLng, zoom: 5.5 };
    }

    if (vehicles.length > 0) {
      const avgLat = vehicles.reduce((sum, v) => sum + v.lat, 0) / vehicles.length;
      const avgLng = vehicles.reduce((sum, v) => sum + v.lng, 0) / vehicles.length;
      return { lat: avgLat, lng: avgLng, zoom: 5.5 };
    }

    return { lat: 30.3165, lng: 78.0322, zoom: 5 }; // Centered on Dehradun / Northern India by default
  }, [warehouses, vehicles]);

  const [viewState, setViewState] = React.useState<MapViewState>(getInitialCentroid);

  // Auto-recenter whenever warehouses change if not manually panned
  const initialMountRef = React.useRef(true);
  React.useEffect(() => {
    if (initialMountRef.current && (warehouses.length > 0 || vehicles.length > 0)) {
      initialMountRef.current = false;
      setViewState(getInitialCentroid());
    }
  }, [warehouses, vehicles, getInitialCentroid]);

  const [mapTheme, setMapTheme] = React.useState<MapTheme>("voyager");
  const [layers, setLayers] = React.useState({
    vehicles: true,
    warehouses: true,
    routes: true,
    weather: true,
    traffic: true,
    telemetry: true,
  });

  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeInspector, setActiveInspector] = React.useState<any | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState<{ x: number; y: number } | null>(null);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  // Convert GPS (lat, lng) to pixel offsets relative to current view center and zoom
  const projectCoords = React.useCallback(
    (lat: number, lng: number, width: number, height: number): { x: number; y: number } => {
      const scale = Math.pow(2, viewState.zoom) * 38;
      const x = width / 2 + (lng - viewState.lng) * scale;
      const latRad = (lat * Math.PI) / 180;
      const viewLatRad = (viewState.lat * Math.PI) / 180;
      const y = height / 2 - (latRad - viewLatRad) * scale * 58;
      return { x, y };
    },
    [viewState]
  );

  // Universal Smart Search (Vehicles, Hubs, Global Cities, GPS Coordinates)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // 1. Direct Lat, Lng coordinate matching (e.g. "30.3165, 78.0322")
    const coordMatch = query.match(/^([-+]?[0-9]*\.?[0-9]+)[,\s]+([-+]?[0-9]*\.?[0-9]+)$/);
    if (coordMatch) {
      const parsedLat = parseFloat(coordMatch[1]);
      const parsedLng = parseFloat(coordMatch[2]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setViewState({ lat: parsedLat, lng: parsedLng, zoom: 6.5 });
        return;
      }
    }

    // 2. Search vehicles
    const matchedVehicle = vehicles.find(
      (v) => v.code.toLowerCase().includes(query) || v.name.toLowerCase().includes(query)
    );
    if (matchedVehicle) {
      setViewState({ lat: matchedVehicle.lat, lng: matchedVehicle.lng, zoom: 6.5 });
      setActiveInspector({ type: "VEHICLE", ...matchedVehicle });
      return;
    }

    // 3. Search user warehouses / hubs
    const matchedHub = warehouses.find(
      (w) =>
        w.code.toLowerCase().includes(query) ||
        w.name.toLowerCase().includes(query) ||
        w.city.toLowerCase().includes(query)
    );
    if (matchedHub) {
      setViewState({ lat: matchedHub.lat, lng: matchedHub.lng, zoom: 6.5 });
      setActiveInspector({ type: "WAREHOUSE", ...matchedHub });
      return;
    }

    // 4. Search Global City Dictionary (Dehradun, Delhi, London, Tokyo, Singapore, etc.)
    for (const [cityName, cityData] of Object.entries(GLOBAL_CITY_COORDINATES)) {
      if (cityName.includes(query) || cityData.label.toLowerCase().includes(query) || cityData.country.toLowerCase().includes(query)) {
        setViewState({ lat: cityData.lat, lng: cityData.lng, zoom: 6.5 });
        return;
      }
    }
  };

  // Handle Pan Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("input") ||
      (e.target as HTMLElement).closest(".prevent-drag")
    )
      return;
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

  // Preset jumps
  const jumpTo = (lat: number, lng: number, zoom = 5.5) => {
    setViewState({ lat, lng, zoom });
  };

  const fitAllFleet = () => {
    setViewState(getInitialCentroid());
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
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
              className="text-stone-300 dark:text-stone-800"
            />
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
            // Dynamically anchor to affected vehicle or first warehouse
            const targetVehicle = vehicles.find((v) => v.id === inc.affectedEntityId);
            const targetLat = targetVehicle?.lat || (warehouses[0]?.lat ? warehouses[0].lat + 0.4 : 30.4);
            const targetLng = targetVehicle?.lng || (warehouses[0]?.lng ? warehouses[0].lng - 0.3 : 78.1);
            const p = projectCoords(targetLat, targetLng, dimensions.width, dimensions.height);

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
                  {wh.code || wh.name}
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

      {/* 6. Google Maps Style Floating Search & Nav Bar (Top-Left) */}
      <div className="absolute top-3 left-3 z-40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl w-full sm:w-auto">
        <form
          onSubmit={handleSearch}
          className="flex items-center bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-xl border border-stone-200 dark:border-stone-800 shadow-md px-2.5 py-1.5 w-full sm:w-80"
        >
          <Search className="h-4 w-4 text-stone-400 shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Search any city (Dehradun, Tokyo...) or fleet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-stone-400 hover:text-stone-600 text-xs px-1"
            >
              ✕
            </button>
          )}
        </form>

        {/* Global Preset Geographic Corridors */}
        <div className="hidden lg:flex items-center gap-1 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-1 rounded-xl border border-stone-200 dark:border-stone-800 shadow-md text-xs font-medium">
          <button
            onClick={fitAllFleet}
            className="px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-emerald-700 dark:text-emerald-400 font-semibold transition-colors flex items-center gap-1"
          >
            <Crosshair className="w-3 h-3" /> Auto-Fit Fleet
          </button>
          <button
            onClick={() => jumpTo(30.3165, 78.0322, 6.5)}
            className="px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            Dehradun Hub
          </button>
          <button
            onClick={() => jumpTo(28.6139, 77.2090, 6)}
            className="px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            Delhi NCR
          </button>
          <button
            onClick={() => jumpTo(51.5074, -0.1278, 5.5)}
            className="px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            Europe
          </button>
          <button
            onClick={() => jumpTo(35.6762, 139.6503, 5.5)}
            className="px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            Asia Pacific
          </button>
        </div>
      </div>

      {/* 7. Google Maps Style Basemap Mode & Layer Controls (Top-Right) */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-md">
        {/* Basemap Switcher */}
        <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg text-xs font-medium mr-1">
          <button
            onClick={() => setMapTheme("voyager")}
            className={cn(
              "px-2 py-0.5 rounded-md transition-all",
              mapTheme === "voyager"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            Map
          </button>
          <button
            onClick={() => setMapTheme("positron")}
            className={cn(
              "px-2 py-0.5 rounded-md transition-all",
              mapTheme === "positron"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            Light
          </button>
          <button
            onClick={() => setMapTheme("dark")}
            className={cn(
              "px-2 py-0.5 rounded-md transition-all",
              mapTheme === "dark"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            Satellite / Dark
          </button>
        </div>

        {/* Layer Toggles */}
        <button
          onClick={() => setLayers((l) => ({ ...l, vehicles: !l.vehicles }))}
          className={cn(
            "px-2 py-1 text-xs rounded-lg flex items-center gap-1 transition-colors font-medium",
            layers.vehicles
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold"
              : "text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          )}
        >
          <Truck className="w-3.5 h-3.5" />
          Fleet ({vehicles.length})
        </button>

        <button
          onClick={() => setLayers((l) => ({ ...l, weather: !l.weather }))}
          className={cn(
            "px-2 py-1 text-xs rounded-lg flex items-center gap-1 transition-colors font-medium",
            layers.weather
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold"
              : "text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          )}
        >
          <CloudRain className="w-3.5 h-3.5" />
          Radar
        </button>
      </div>

      {/* 8. Google Maps Zoom & Compass Controls (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-1.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-lg">
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
          title="Center on Active Fleet"
          onClick={fitAllFleet}
        >
          <Crosshair className="w-4 h-4 text-emerald-600" />
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
                {activeInspector.city && (
                  <p className="text-xs text-stone-500 mt-0.5">{activeInspector.city}, {activeInspector.state || ""}</p>
                )}
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
                    {Math.round((activeInspector.currentUnits / (activeInspector.capacityUnits || 1)) * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">ACTIVE DOCKS</span>
                  <span className="font-semibold font-mono">
                    {activeInspector.activeDocks || 4} / {activeInspector.dockCount || 8}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">EFFICIENCY</span>
                  <span className="font-semibold font-mono text-emerald-600">
                    {activeInspector.efficiencyPct || 95}%
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
