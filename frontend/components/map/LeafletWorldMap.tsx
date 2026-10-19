'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { ResolvedLocation, RouteResult } from '@/lib/api/endpoints/location';
import { api } from '@/lib/api/client';
import { tactileAudio } from '@/lib/sound-effects';
import { createSafeMapMarkerElement } from './safe-map-dom';
import { Plus, Minus, Compass, Navigation, Layers, ShieldAlert, Truck, Building2, AlertTriangle, Crosshair } from 'lucide-react';

export interface MapVehicle {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  speedKmh?: number;
  heading?: number;
  status?: string;
  driverName?: string;
  batteryPct?: number;
}

export interface MapWarehouse {
  id: string;
  code: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  capacityUnits?: number;
  currentUnits?: number;
}

export interface MapIncident {
  id: string;
  code: string;
  title: string;
  severity: string;
  lat: number;
  lng: number;
}

export interface WeatherHazard {
  id: string;
  title: string;
  severity: 'WARNING' | 'CRITICAL';
  coordinates: number[][]; // Polygon ring [[lng, lat], ...]
}

interface LeafletWorldMapProps {
  centerLocation?: ResolvedLocation | null;
  vehicles?: MapVehicle[];
  warehouses?: MapWarehouse[];
  incidents?: MapIncident[];
  hazards?: WeatherHazard[];
  showHazards?: boolean;
  routePreview?: RouteResult | null;
  isSimulationMode?: boolean;
  onLocationClick?: (location: ResolvedLocation) => void;
  className?: string;
}

export function LeafletWorldMap({
  centerLocation,
  vehicles = [],
  warehouses = [],
  incidents = [],
  hazards = [],
  showHazards = true,
  routePreview,
  isSimulationMode = false,
  onLocationClick,
  className = '',
}: LeafletWorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const hazardsLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<ResolvedLocation | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [tileLayerType, setTileLayerType] = useState<'CARTO_VOYAGER' | 'OSM' | 'CARTO_DARK'>('CARTO_VOYAGER');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VEHICLES' | 'WAREHOUSES' | 'INCIDENTS'>('ALL');
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import('leaflet')).default;
      LRef.current = L;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      let initCenter: [number, number] = [20, 0];
      let initZoom = 2;

      if (centerLocation && centerLocation.latitude && centerLocation.longitude) {
        initCenter = [centerLocation.latitude, centerLocation.longitude];
        initZoom = 8;
      }

      if (!isMounted || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: initCenter,
        zoom: initZoom,
        minZoom: 2,
        maxZoom: 19,
        zoomControl: false, // We render sleek custom Apple-style zoom buttons
        attributionControl: false,
      });

      // Sleek iOS-style tile layer (CartoDB Voyager: crisp, readable, high contrast)
      const tileUrl =
        tileLayerType === 'CARTO_DARK'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : tileLayerType === 'OSM'
          ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tiles = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Attribution small text
      L.control
        .attribution({ position: 'bottomright', prefix: '© OpenStreetMap · Nexus Live GPS' })
        .addTo(map);

      // Layers for dynamic markers
      const markerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = markerGroup;

      const routeGroup = L.layerGroup().addTo(map);
      routeLayerRef.current = routeGroup;

      const hazardGroup = L.layerGroup().addTo(map);
      hazardsLayerRef.current = hazardGroup;

      // Handle map click with Reverse Geocoding
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        tactileAudio.playClick();
        try {
          const res = await api.location.reverse(lat, lng);
          if (isMounted) {
            setClickedLocation(res);
            setSelectedEntity(null);
            tactileAudio.playTelemetryPing();
            if (onLocationClick) onLocationClick(res);
          }
        } catch {
          const fallbackLoc: ResolvedLocation = {
            id: `pt-${Date.now()}`,
            display_name: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
            latitude: lat,
            longitude: lng,
            type: 'coordinate',
            confidence: 1.0,
            provider: 'map-click',
          };
          if (isMounted) {
            setClickedLocation(fallbackLoc);
            setSelectedEntity(null);
            if (onLocationClick) onLocationClick(fallbackLoc);
          }
        }
      });

      mapRef.current = map;
      (map as any)._nexusTiles = tiles;
      setMapReady(true);
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer if Changed
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;
    if ((map as any)._nexusTiles) {
      map.removeLayer((map as any)._nexusTiles);
    }
    const tileUrl =
      tileLayerType === 'CARTO_DARK'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : tileLayerType === 'OSM'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map);
    (map as any)._nexusTiles = tiles;
  }, [tileLayerType]);

  // Camera FlyTo on centerLocation change
  useEffect(() => {
    if (!mapRef.current || !centerLocation) return;
    mapRef.current.flyTo([centerLocation.latitude, centerLocation.longitude], 12, {
      duration: 1.5,
    });
  }, [centerLocation, mapReady]);

  // Sync Weather Hazard Polygons
  useEffect(() => {
    if (!mapRef.current || !LRef.current || !hazardsLayerRef.current) return;
    const L = LRef.current;
    const group = hazardsLayerRef.current;
    group.clearLayers();

    if (!showHazards || !hazards || hazards.length === 0) return;

    hazards.forEach((hazard) => {
      // In Leaflet coordinates are [lat, lng] (reversed from GeoJSON [lng, lat])
      const latlngs = hazard.coordinates.map(([lng, lat]) => [lat, lng]);
      const color = hazard.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B';
      const poly = L.polygon(latlngs, {
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.18,
        dashArray: '4, 4',
      });
      const popup = document.createElement('div');
      popup.style.fontFamily = 'monospace';
      popup.style.fontSize = '11px';
      popup.style.padding = '2px';
      const popupTitle = document.createElement('div');
      popupTitle.style.fontWeight = 'bold';
      popupTitle.style.color = color;
      popupTitle.textContent = `[${hazard.severity}] HAZARD ZONE`;
      const popupDescription = document.createElement('div');
      popupDescription.style.marginTop = '4px';
      popupDescription.textContent = hazard.title;
      popup.append(popupTitle, popupDescription);
      poly.bindPopup(popup);
      group.addLayer(poly);
    });
  }, [hazards, showHazards, mapReady]);

  // Sync Route Preview Line
  useEffect(() => {
    if (!mapRef.current || !LRef.current || !routeLayerRef.current) return;
    const L = LRef.current;
    const group = routeLayerRef.current;
    group.clearLayers();

    if (!routePreview || !routePreview.geometry || !routePreview.geometry.coordinates) return;

    const coords = routePreview.geometry.coordinates;
    const latlngs = coords.map((c: any) => [c[1], c[0]]);

    // Outer Glow / Casing
    const casing = L.polyline(latlngs, {
      color: isSimulationMode ? '#7B2CBF' : '#047857',
      weight: 7,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    });
    group.addLayer(casing);

    // Inner Sharp Core Line
    const mainLine = L.polyline(latlngs, {
      color: isSimulationMode ? '#9333EA' : '#10B981',
      weight: 3.5,
      opacity: 0.95,
      dashArray: isSimulationMode ? '6, 6' : undefined,
    });
    group.addLayer(mainLine);

    if (latlngs.length > 0) {
      mapRef.current.fitBounds(mainLine.getBounds(), { padding: [50, 50] });
    }
  }, [routePreview, isSimulationMode, mapReady]);

  // Sync Markers (Warehouses, Vehicles, Incidents)
  useEffect(() => {
    if (!mapRef.current || !LRef.current || !layerGroupRef.current) return;
    const L = LRef.current;
    const group = layerGroupRef.current;
    group.clearLayers();

    // 1. Warehouses (Emerald Hexagons)
    if (activeFilter === 'ALL' || activeFilter === 'WAREHOUSES') {
      warehouses.forEach((wh) => {
        const iconElement = createSafeMapMarkerElement(document, 'warehouse', `${wh.name} (${wh.code})`);
        const customIcon = L.divIcon({
          html: iconElement,
          className: 'nexus-warehouse-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([wh.lat, wh.lng], { icon: customIcon });
        marker.on('click', () => {
          tactileAudio.playClick();
          setSelectedEntity({ type: 'WAREHOUSE', data: wh });
          setClickedLocation(null);
        });
        group.addLayer(marker);
      });
    }

    // 2. Vehicles (Cyan / Blue Navigation Arrows with Directional Heading)
    if (activeFilter === 'ALL' || activeFilter === 'VEHICLES') {
      vehicles.forEach((v) => {
        const label = `${v.code} · ${v.speedKmh ? `${v.speedKmh} km/h` : 'Active'}`;
        const iconElement = createSafeMapMarkerElement(document, 'vehicle', label, v.heading || 0);
        const customIcon = L.divIcon({
          html: iconElement,
          className: 'nexus-vehicle-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([v.lat, v.lng], { icon: customIcon });
        marker.on('click', () => {
          tactileAudio.playClick();
          setSelectedEntity({ type: 'VEHICLE', data: v });
          setClickedLocation(null);
        });
        group.addLayer(marker);
      });
    }

    // 3. Incidents (Pulsing Red Hazard Beacon)
    if (activeFilter === 'ALL' || activeFilter === 'INCIDENTS') {
      incidents.forEach((inc) => {
        const iconElement = createSafeMapMarkerElement(document, 'incident', `[${inc.severity}] ${inc.title}`);
        const customIcon = L.divIcon({
          html: iconElement,
          className: 'nexus-incident-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([inc.lat, inc.lng], { icon: customIcon });
        marker.on('click', () => {
          tactileAudio.playClick();
          setSelectedEntity({ type: 'INCIDENT', data: inc });
          setClickedLocation(null);
        });
        group.addLayer(marker);
      });
    }

    // 4. Center Location Ping
    if (centerLocation && centerLocation.latitude && centerLocation.longitude) {
      const pingHtml = `
        <div style="position: relative; width: 24px; height: 24px; display: flex; items-align: center; justify-content: center;">
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(16,185,129,0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #10B981; border: 2px solid #FFFFFF; box-shadow: 0 0 10px #10B981; margin: auto;"></div>
        </div>
      `;
      const pingIcon = L.divIcon({
        html: pingHtml,
        className: 'nexus-ping-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const pingMarker = L.marker([centerLocation.latitude, centerLocation.longitude], { icon: pingIcon });
      group.addLayer(pingMarker);
    }
  }, [warehouses, vehicles, incidents, centerLocation, activeFilter, mapReady]);

  // Controls Handlers
  const handleZoomIn = () => {
    tactileAudio.playClick();
    mapRef.current?.zoomIn();
  };
  const handleZoomOut = () => {
    tactileAudio.playClick();
    mapRef.current?.zoomOut();
  };
  const handleResetWorldView = () => {
    tactileAudio.playClick();
    mapRef.current?.setView([24.0, 40.0], 3, { animate: true });
  };
  const handleLocateWorkspace = () => {
    tactileAudio.playTelemetryPing();
    if (centerLocation && centerLocation.latitude && centerLocation.longitude) {
      mapRef.current?.flyTo([centerLocation.latitude, centerLocation.longitude], 12, { duration: 1.5 });
    } else if (warehouses.length > 0) {
      mapRef.current?.flyTo([warehouses[0].lat, warehouses[0].lng], 11, { duration: 1.5 });
    } else {
      mapRef.current?.setView([28.6139, 77.2090], 7);
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-nexus-surface-container-high bg-nexus-surface shadow-tactile ${className}`}>
      {/* Real OpenStreetMap Leaflet Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Controlled Grid Overlay — Disappears completely when showGrid is false (Blueprint §12.6) */}
      {showGrid && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-[200] opacity-30 dark:opacity-40 transition-opacity duration-200"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
            color: 'rgba(16, 185, 129, 0.4)',
          }}
        />
      )}

      {/* Floating Apple-Grade Map Control HUD */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {/* Zoom & Reset Pill */}
        <div className="flex flex-col bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2.5 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-px bg-stone-200/80 dark:bg-stone-800" />
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2.5 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Global Reset & Locate Center */}
        <div className="flex flex-col bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={handleLocateWorkspace}
            title="Recenter to Operating Base"
            className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <div className="h-px bg-stone-200/80 dark:bg-stone-800" />
          <button
            type="button"
            onClick={handleResetWorldView}
            title="View Whole World"
            className="p-2.5 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* Base Map Style Picker */}
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-800 rounded-2xl p-1 shadow-xl flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              setTileLayerType('CARTO_VOYAGER');
              tactileAudio.playClick();
            }}
            className={`px-2 py-1 text-[10px] font-mono rounded-xl font-bold transition-all text-left ${
              tileLayerType === 'CARTO_VOYAGER' ? 'bg-emerald-600 text-white' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Voyager
          </button>
          <button
            type="button"
            onClick={() => {
              setTileLayerType('CARTO_DARK');
              tactileAudio.playClick();
            }}
            className={`px-2 py-1 text-[10px] font-mono rounded-xl font-bold transition-all text-left ${
              tileLayerType === 'CARTO_DARK' ? 'bg-stone-950 text-emerald-400' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Night Ops
          </button>
          <button
            type="button"
            onClick={() => {
              setTileLayerType('OSM');
              tactileAudio.playClick();
            }}
            className={`px-2 py-1 text-[10px] font-mono rounded-xl font-bold transition-all text-left ${
              tileLayerType === 'OSM' ? 'bg-blue-600 text-white' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            OpenStreet
          </button>
          <div className="h-px bg-stone-200/80 dark:border-stone-800 my-0.5" />
          <button
            type="button"
            onClick={() => {
              setShowGrid((prev) => !prev);
              tactileAudio.playClick();
            }}
            className={`px-2 py-1 text-[10px] font-mono rounded-xl font-bold transition-all text-left flex items-center justify-between ${
              showGrid ? 'bg-emerald-600 text-white' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <span>Grid Overlay</span>
            <span className="text-[9px] opacity-80">{showGrid ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Floating Filter Pill HUD (Top Left) */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-1.5 p-1 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-800 shadow-xl text-xs font-mono">
        <button
          onClick={() => {
            setActiveFilter('ALL');
            tactileAudio.playClick();
          }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            activeFilter === 'ALL'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          All Layers ({vehicles.length + warehouses.length + incidents.length})
        </button>
        <button
          onClick={() => {
            setActiveFilter('VEHICLES');
            tactileAudio.playClick();
          }}
          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
            activeFilter === 'VEHICLES'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-sky-600 hover:text-sky-700 dark:text-sky-400'
          }`}
        >
          <Truck className="w-3.5 h-3.5" /> Fleet ({vehicles.length})
        </button>
        <button
          onClick={() => {
            setActiveFilter('WAREHOUSES');
            tactileAudio.playClick();
          }}
          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
            activeFilter === 'WAREHOUSES'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-emerald-700 hover:text-emerald-800 dark:text-emerald-400'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Hubs ({warehouses.length})
        </button>
        {incidents.length > 0 && (
          <button
            onClick={() => {
              setActiveFilter('INCIDENTS');
              tactileAudio.playClick();
            }}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              activeFilter === 'INCIDENTS'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-600 hover:text-red-700 dark:text-red-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Hazards ({incidents.length})
          </button>
        )}

        {/* Live Telemetry Stream Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-400" />
          </span>
          <span className="font-bold">WORKSPACE RECORDS</span>
          <span className="text-stone-400">·</span>
        </div>
      </div>

      {/* Selected Entity Card Detail Drawer (Bottom Left) */}
      {selectedEntity && (
        <div className="absolute bottom-4 left-4 z-[400] max-w-sm w-full p-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-2xl space-y-2 font-sans animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                selectedEntity.type === 'VEHICLE'
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                  : selectedEntity.type === 'WAREHOUSE'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                {selectedEntity.type}
              </span>
              <h4 className="text-sm font-bold text-stone-900 dark:text-white mt-1">
                {selectedEntity.data.name || selectedEntity.data.title} ({selectedEntity.data.code})
              </h4>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                GPS: {selectedEntity.data.lat?.toFixed(4)}°, {selectedEntity.data.lng?.toFixed(4)}°
              </p>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg"
            >
              ✕
            </button>
          </div>

          {selectedEntity.type === 'VEHICLE' && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800 text-xs font-mono">
              <div>
                <span className="text-stone-400 text-[10px]">Speed:</span>
                <p className="font-bold text-stone-800 dark:text-stone-200">{selectedEntity.data.speedKmh == null ? "Not recorded" : `${selectedEntity.data.speedKmh} km/h`}</p>
              </div>
              <div>
                <span className="text-stone-400 text-[10px]">Battery:</span>
                <p className="font-bold text-emerald-600">{selectedEntity.data.batteryPct == null ? "Not recorded" : `${selectedEntity.data.batteryPct}%`}</p>
              </div>
              <div>
                <span className="text-stone-400 text-[10px]">Status:</span>
                <p className="font-bold text-sky-600">{selectedEntity.data.status || 'Not recorded'}</p>
              </div>
              <div>
                <span className="text-stone-400 text-[10px]">Pilot:</span>
                <p className="font-bold truncate text-stone-800 dark:text-stone-200">{selectedEntity.data.driverName || 'Fleet Pilot'}</p>
              </div>
            </div>
          )}

          {selectedEntity.type === 'WAREHOUSE' && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800 text-xs font-mono">
              <div>
                <span className="text-stone-400 text-[10px]">City:</span>
                <p className="font-bold text-stone-800 dark:text-stone-200">{selectedEntity.data.city}</p>
              </div>
              <div>
                <span className="text-stone-400 text-[10px]">Capacity:</span>
                <p className="font-bold text-emerald-600">{selectedEntity.data.capacityUnits?.toLocaleString()} Units</p>
              </div>
            </div>
          )}

          {selectedEntity.type === 'INCIDENT' && (
            <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 text-xs font-mono">
              <span className="text-stone-400 text-[10px]">Severity:</span>
              <p className="font-bold text-red-600">[{selectedEntity.data.severity}] Impact</p>
            </div>
          )}
        </div>
      )}

      {/* Click Reverse Geocode HUD (Bottom Right) */}
      {clickedLocation && (
        <div className="absolute bottom-4 right-4 z-[400] max-w-sm p-3.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-2xl space-y-2 font-sans animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-bold">
                Map Coordinate Selected
              </span>
              <h5 className="text-xs font-bold text-stone-900 dark:text-white line-clamp-2">
                {clickedLocation.display_name}
              </h5>
              <p className="text-[11px] text-stone-500 font-mono">
                {clickedLocation.latitude.toFixed(4)}°, {clickedLocation.longitude.toFixed(4)}°
              </p>
            </div>
            <button
              onClick={() => setClickedLocation(null)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
