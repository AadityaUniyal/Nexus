'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapControls } from './MapControls';
import { syncHazardLayers, WeatherHazard } from './HazardLayer';
import { ResolvedLocation, RouteResult } from '@/lib/api/endpoints/location';
import { api } from '@/lib/api/client';
import { useAvatarStore } from '@/lib/avatar-store';
import { tactileAudio } from '@/lib/sound-effects';
import { createSafeMapMarkerElement } from './safe-map-dom';

export interface MapVehicle {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  speedKmh?: number;
  heading?: number;
  status?: string;
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

interface NexusMapProps {
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

export function NexusMap({
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
}: NexusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<ResolvedLocation | null>(null);
  const [isReversing, setIsReversing] = useState(false);
  const triggerAvatar = useAvatarStore((s) => s.triggerEvent);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    async function initMap() {
      const maplibregl = (await import('maplibre-gl')).default;

      if (!isMounted || !mapContainerRef.current) return;

      let customCenter: [number, number] = [0, 20];
      let customZoom = 2;

      if (centerLocation) {
        customCenter = [centerLocation.longitude, centerLocation.latitude];
        customZoom = 12;
      }

      const initialCenter: [number, number] = customCenter;
      const initialZoom = customZoom;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
              paint: {
                'raster-opacity': 0.85,
                'raster-saturation': -0.3,
                'raster-contrast': 0.1,
              },
            },
          ],
        },
        center: initialCenter,
        zoom: initialZoom,
        pitch: 30,
        bearing: 0,
      });

      map.on('load', () => {
        if (!isMounted) return;
        setMapLoaded(true);
      });

      // Handle map click reverse geocoding
      map.on('click', async (e: any) => {
        const { lng, lat } = e.lngLat;
        setIsReversing(true);
        tactileAudio.playClick();
        try {
          const resolved = await api.location.reverse(lat, lng);
          setClickedLocation(resolved);
          tactileAudio.playTelemetryPing();
          if (onLocationClick) {
            onLocationClick(resolved);
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
          setClickedLocation(fallbackLoc);
          if (onLocationClick) {
            onLocationClick(fallbackLoc);
          }
        } finally {
          setIsReversing(false);
        }
      });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Camera flyTo on centerLocation change
  useEffect(() => {
    if (!mapInstanceRef.current || !centerLocation || !mapLoaded) return;

    let targetZoom = 12;
    const type = (centerLocation.type || '').toLowerCase();
    if (type.includes('country')) targetZoom = 5;
    else if (type.includes('city')) targetZoom = 11;
    else if (type.includes('street') || type.includes('address')) targetZoom = 15;
    else if (type.includes('airport') || type.includes('railway') || type.includes('facility')) targetZoom = 14;

    mapInstanceRef.current.flyTo({
      center: [centerLocation.longitude, centerLocation.latitude],
      zoom: targetZoom,
      pitch: 35,
      essential: true,
      duration: 2000,
    });
  }, [centerLocation, mapLoaded]);

  // Real-Time Voice Action Listener (Direct Spoken Execution)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || typeof window === 'undefined') return;

    const handleVoiceAction = (e: any) => {
      const detail = e.detail;
      if (!detail) return;

      if (detail.action_type === 'MAP_FLY_TO' && detail.action_payload) {
        const { latitude, longitude } = detail.action_payload;
        if (latitude && longitude) {
          mapInstanceRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 12,
            pitch: 40,
            duration: 2200,
            essential: true,
          });
        }
      }
    };

    window.addEventListener('nexus:voice-action', handleVoiceAction);
    return () => window.removeEventListener('nexus:voice-action', handleVoiceAction);
  }, [mapLoaded]);

  // Sync Weather Hazard Polygons
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    syncHazardLayers(mapInstanceRef.current, hazards, showHazards);
  }, [hazards, showHazards, mapLoaded]);

  // Update Route GeoJSON Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const map = mapInstanceRef.current;

    const sourceId = 'nexus-route-source';
    const layerId = 'nexus-route-line';
    const casingId = 'nexus-route-casing';

    if (map.getLayer(casingId)) map.removeLayer(casingId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (routePreview && routePreview.geometry) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: routePreview.geometry,
        },
      });

      // Route Casing
      map.addLayer({
        id: casingId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': isSimulationMode ? '#7B2CBF' : '#1B4D3E',
          'line-width': 8,
          'line-opacity': 0.4,
        },
      });

      // Route Main Line
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': isSimulationMode ? '#9C27B0' : '#10B981',
          'line-width': 4,
          'line-dasharray': isSimulationMode ? [2, 2] : [1, 0],
        },
      });
    }
  }, [routePreview, isSimulationMode, mapLoaded]);

  // Update Markers (Vehicles, Warehouses, Incidents, Selected)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    async function syncMarkers() {
      const maplibregl = (await import('maplibre-gl')).default;
      const map = mapInstanceRef.current;
      if (!map) return;

      // Clean existing markers
      Object.values(markersRef.current).forEach((m: any) => m.remove());
      markersRef.current = {};

      // 1. Warehouses Markers
      warehouses.forEach((wh) => {
        const el = createSafeMapMarkerElement(document, 'warehouse', `${wh.name} (${wh.code})`);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([wh.lng, wh.lat])
          .addTo(map);
        markersRef.current[`wh-${wh.id}`] = marker;
      });

      // 2. Vehicles Markers
      vehicles.forEach((v) => {
        const label = `${v.name} · ${v.speedKmh ? `${v.speedKmh} km/h` : 'Active'}`;
        const el = createSafeMapMarkerElement(document, 'vehicle', label, v.heading || 0);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([v.lng, v.lat])
          .addTo(map);
        markersRef.current[`veh-${v.id}`] = marker;
      });

      // 3. Incidents Markers
      incidents.forEach((inc) => {
        const el = createSafeMapMarkerElement(document, 'incident', `[${inc.severity}] ${inc.title}`);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([inc.lng, inc.lat])
          .addTo(map);
        markersRef.current[`inc-${inc.id}`] = marker;
      });

      // 4. Center Selected Location Marker
      if (centerLocation) {
        const el = createSafeMapMarkerElement(document, 'location', centerLocation.display_name);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([centerLocation.longitude, centerLocation.latitude])
          .addTo(map);
        markersRef.current['center-loc'] = marker;
      }
    }

    syncMarkers();
  }, [warehouses, vehicles, incidents, centerLocation, mapLoaded]);

  // Controls Handlers
  const handleZoomIn = () => {
    tactileAudio.playClick();
    mapInstanceRef.current?.zoomIn();
  };
  const handleZoomOut = () => {
    tactileAudio.playClick();
    mapInstanceRef.current?.zoomOut();
  };
  const handleResetNorth = () => {
    tactileAudio.playClick();
    mapInstanceRef.current?.resetNorthPitch();
  };
  const handleLocateMe = () => {
    if (centerLocation && mapInstanceRef.current) {
      tactileAudio.playTelemetryPing();
      mapInstanceRef.current.flyTo({
        center: [centerLocation.longitude, centerLocation.latitude],
        zoom: 13,
        pitch: 30,
      });
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-nexus-surface-container-high bg-nexus-surface ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetNorth={handleResetNorth}
        onLocateMe={centerLocation ? handleLocateMe : undefined}
        isSimulationMode={isSimulationMode}
        className="absolute top-4 right-4"
      />

      {/* Click Popup Card */}
      {clickedLocation && (
        <div className="absolute bottom-4 left-4 max-w-sm p-3.5 bg-white dark:bg-zinc-900 border border-nexus-surface-container-high rounded-xl shadow-xl space-y-2 font-sans z-20">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-nexus-primary font-semibold">
                Point Selected
              </span>
              <h5 className="text-xs font-bold text-nexus-on-surface line-clamp-2">
                {clickedLocation.display_name}
              </h5>
              <p className="text-[11px] text-nexus-on-surface-variant font-mono">
                {clickedLocation.latitude.toFixed(4)}°, {clickedLocation.longitude.toFixed(4)}°
              </p>
            </div>
            <button
              onClick={() => setClickedLocation(null)}
              className="text-xs text-nexus-on-surface-variant hover:text-nexus-on-surface p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
