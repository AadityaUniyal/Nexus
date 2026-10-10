"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, { Map as MapLibreInstance, Marker, LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { api } from "@/lib/api/client";
import { Layers, Compass, Sun, Moon, Loader2 } from "lucide-react";

export interface DriverMarkerData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  heading?: number | null;
  status?: string;
  lastPingAt?: string | null;
}

export interface StopMarkerData {
  id: string;
  stopType: "pickup" | "dropoff";
  sequence: number;
  address: string;
  lat: number;
  lon: number;
  status: string;
  windowStart: string;
  windowEnd: string;
}

export interface RouteGeometry {
  coordinates: [number, number][]; // [lon, lat]
}

interface MapProps {
  initialCenter?: [number, number]; // [lon, lat]
  initialZoom?: number;
  drivers?: DriverMarkerData[];
  stops?: StopMarkerData[];
  routeGeometry?: RouteGeometry | null;
  selectedDriverId?: string | null;
  selectedJobId?: string | null;
  onMapClick?: (lat: number, lon: number) => void;
  onDriverSelect?: (driverId: string) => void;
  onStopSelect?: (stopId: string) => void;
  className?: string;
}

export const MapLibreMap: React.FC<MapProps> = ({
  initialCenter,
  initialZoom = 11,
  drivers = [],
  stops = [],
  routeGeometry = null,
  selectedDriverId,
  onMapClick,
  onDriverSelect,
  className = "w-full h-full",
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreInstance | null>(null);
  const driverMarkersRef = useRef<Map<string, Marker>>(new Map());
  const stopMarkersRef = useRef<Map<string, Marker>>(new Map());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [tokenData, setTokenData] = useState<{ token: string; clientId: string } | null>(null);

  // 1. Fetch Azure Maps Token
  useEffect(() => {
    let mounted = true;
    async function loadToken() {
      try {
        setLoading(true);
        const data = await api.getMapsToken();
        if (mounted) {
          setTokenData(data);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load Azure Maps credentials");
          setLoading(false);
        }
      }
    }
    loadToken();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Initialize Map once token is available
  useEffect(() => {
    if (!tokenData || !mapContainer.current || mapRef.current) return;

    const tileset = theme === "dark" ? "microsoft.base.darkgrey" : "microsoft.base.road";
    const tileUrl = `https://atlas.microsoft.com/map/tile?api-version=2024-04-01&tilesetId=${tileset}&zoom={z}&x={x}&y={y}`;

    const defaultCenter: [number, number] = initialCenter || [0, 20];
    const defaultZoom = initialCenter ? initialZoom : 2;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "azure-base": {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "azure-base-layer",
            type: "raster",
            source: "azure-base",
            paint: { "raster-opacity": 1 },
          },
        ],
      },
      center: defaultCenter,
      zoom: defaultZoom,
      attributionControl: false,
      transformRequest: (url: string) => {
        if (url.includes("atlas.microsoft.com")) {
          return {
            url,
            headers: {
              Authorization: `Bearer ${tokenData.token}`,
              "x-ms-client-id": tokenData.clientId,
            },
          };
        }
        return { url };
      },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      "bottom-right"
    );

    map.on("load", () => {
      setLoading(false);
      // Route line source
      map.addSource("route-line", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      });

      map.addLayer({
        id: "route-line-casing",
        type: "line",
        source: "route-line",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#1e3a8a",
          "line-width": 7,
          "line-opacity": 0.8,
        },
      });

      map.addLayer({
        id: "route-line-inner",
        type: "line",
        source: "route-line",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
        },
      });

      // Traffic flow source
      map.addSource("azure-traffic", {
        type: "raster",
        tiles: [
          "https://atlas.microsoft.com/map/tile?api-version=2024-04-01&tilesetId=microsoft.traffic.flow.relative.main&zoom={z}&x={x}&y={y}",
        ],
        tileSize: 256,
      });

      map.addLayer({
        id: "azure-traffic-layer",
        type: "raster",
        source: "azure-traffic",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 0.75 },
      });
    });

    map.on("click", (e) => {
      if (onMapClick) {
        onMapClick(e.lngLat.lat, e.lngLat.lng);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [tokenData, theme]);

  // 3. Toggle Traffic
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer("azure-traffic-layer")) return;
    map.setLayoutProperty("azure-traffic-layer", "visibility", showTraffic ? "visible" : "none");
  }, [showTraffic]);

  // 4. Update Route Line Geometry
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("route-line") as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeGeometry?.coordinates || [],
        },
      });
    }
  }, [routeGeometry]);

  // 5. Update Driver Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentDriverIds = new Set(drivers.map((d) => d.id));

    // Remove old markers
    for (const [id, marker] of driverMarkersRef.current.entries()) {
      if (!currentDriverIds.has(id)) {
        marker.remove();
        driverMarkersRef.current.delete(id);
      }
    }

    // Add or update markers
    drivers.forEach((driver) => {
      if (typeof driver.lat !== "number" || typeof driver.lon !== "number") return;

      const isSelected = driver.id === selectedDriverId;
      const isStale = driver.lastPingAt
        ? Date.now() - new Date(driver.lastPingAt).getTime() > 10 * 60 * 1000
        : true;

      let marker = driverMarkersRef.current.get(driver.id);
      if (!marker) {
        const el = document.createElement("div");
        el.className = "driver-marker-container cursor-pointer transition-transform duration-300";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onDriverSelect?.(driver.id);
        });

        marker = new maplibregl.Marker({ element: el, rotationAlignment: "map" })
          .setLngLat([driver.lon, driver.lat])
          .addTo(map);

        driverMarkersRef.current.set(driver.id, marker);
      } else {
        marker.setLngLat([driver.lon, driver.lat]);
      }

      if (driver.heading !== null && driver.heading !== undefined) {
        marker.setRotation(driver.heading);
      }

      const el = marker.getElement();
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isSelected
              ? "bg-blue-600 text-white ring-4 ring-blue-300 scale-110"
              : isStale
              ? "bg-zinc-600 text-zinc-300 opacity-60"
              : "bg-emerald-600 text-white hover:scale-105"
          }">
            <svg class="w-4 h-4 transform ${
              driver.heading !== null && driver.heading !== undefined ? "rotate-0" : ""
            }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19V5m0 0l-4 4m4-4l4 4"/>
            </svg>
          </div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap bg-zinc-900/90 text-zinc-200 border border-zinc-700 shadow-sm">
            ${driver.name}
          </div>
        </div>
      `;
    });
  }, [drivers, selectedDriverId, onDriverSelect]);

  // 6. Update Stop Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentStopIds = new Set(stops.map((s) => s.id));

    // Remove old
    for (const [id, marker] of stopMarkersRef.current.entries()) {
      if (!currentStopIds.has(id)) {
        marker.remove();
        stopMarkersRef.current.delete(id);
      }
    }

    // Add or update
    stops.forEach((stop) => {
      if (typeof stop.lat !== "number" || typeof stop.lon !== "number") return;

      let marker = stopMarkersRef.current.get(stop.id);
      if (!marker) {
        const el = document.createElement("div");
        el.className = "stop-marker-container cursor-pointer";
        marker = new maplibregl.Marker({ element: el })
          .setLngLat([stop.lon, stop.lat])
          .addTo(map);
        stopMarkersRef.current.set(stop.id, marker);
      } else {
        marker.setLngLat([stop.lon, stop.lat]);
      }

      const isPickup = stop.stopType === "pickup";
      const isCompleted = stop.status === "completed";
      const el = marker.getElement();
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-white ${
            isCompleted
              ? "bg-zinc-700 text-zinc-400"
              : isPickup
              ? "bg-amber-500 text-zinc-950"
              : "bg-indigo-600 text-white"
          }">
            ${isPickup ? "P" : "D"}
          </div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900/90 text-zinc-300 border border-zinc-700 whitespace-nowrap shadow-sm">
            #${stop.sequence}
          </div>
        </div>
      `;
    });
  }, [stops]);

  // 7. Auto fit bounds when drivers/stops change initially
  const fitBoundsToData = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const coords: [number, number][] = [];
    drivers.forEach((d) => {
      if (typeof d.lat === "number" && typeof d.lon === "number") coords.push([d.lon, d.lat]);
    });
    stops.forEach((s) => {
      if (typeof s.lat === "number" && typeof s.lon === "number") coords.push([s.lon, s.lat]);
    });

    if (coords.length === 0) return;

    if (coords.length === 1) {
      map.flyTo({ center: coords[0], zoom: 13, duration: 800 });
      return;
    }

    const bounds = coords.reduce(
      (b, coord) => b.extend(coord),
      new LngLatBounds(coords[0], coords[0])
    );

    map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
  }, [drivers, stops]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-20 text-zinc-300">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
          <p className="text-sm font-medium">Loading Azure Maps...</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-20 text-red-400 p-6 text-center">
          <p className="text-base font-semibold mb-1">Map Loading Error</p>
          <p className="text-xs text-zinc-400 max-w-md">{error}</p>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => setShowTraffic((prev) => !prev)}
          title="Toggle Live Traffic"
          className={`p-2.5 rounded-lg text-xs font-medium border shadow-md flex items-center gap-1.5 transition-colors ${
            showTraffic
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 backdrop-blur-md"
              : "bg-zinc-900/80 text-zinc-300 border-zinc-700/80 hover:bg-zinc-800 backdrop-blur-md"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Traffic</span>
        </button>

        <button
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          title="Toggle Base Map Theme"
          className="p-2.5 rounded-lg text-xs font-medium border bg-zinc-900/80 text-zinc-300 border-zinc-700/80 hover:bg-zinc-800 shadow-md backdrop-blur-md flex items-center gap-1.5"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="capitalize">{theme}</span>
        </button>

        <button
          onClick={fitBoundsToData}
          title="Fit to Fleet & Stops"
          className="p-2.5 rounded-lg text-xs font-medium border bg-zinc-900/80 text-zinc-300 border-zinc-700/80 hover:bg-zinc-800 shadow-md backdrop-blur-md flex items-center gap-1.5"
        >
          <Compass className="w-4 h-4" />
          <span>Fit</span>
        </button>
      </div>
    </div>
  );
};
