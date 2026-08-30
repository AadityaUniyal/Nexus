'use client';

import React, { useEffect } from 'react';

export interface WeatherHazard {
  id: string;
  title: string;
  severity: 'WARNING' | 'CRITICAL';
  coordinates: number[][]; // Polygon ring [[lng, lat], ...]
}

export const DEMO_HAZARDS: WeatherHazard[] = [
  {
    id: 'hazard-i80-blizzard',
    title: 'I-80 Nebraska Mountain Blizzard Impasse Zone',
    severity: 'CRITICAL',
    coordinates: [
      [-96.5, 41.0],
      [-95.0, 41.0],
      [-95.0, 41.8],
      [-96.5, 41.8],
      [-96.5, 41.0],
    ],
  },
  {
    id: 'hazard-rockies-wind',
    title: 'Rockies High Wind Velocity Corridor (65+ MPH)',
    severity: 'WARNING',
    coordinates: [
      [-105.5, 39.2],
      [-104.5, 39.2],
      [-104.5, 40.2],
      [-105.5, 40.2],
      [-105.5, 39.2],
    ],
  },
];

interface HazardLayerProps {
  mapInstance: any;
  hazards?: WeatherHazard[];
  visible?: boolean;
}

export function syncHazardLayers(map: any, hazards: WeatherHazard[] = DEMO_HAZARDS, visible = true) {
  if (!map) return;

  const sourceId = 'nexus-hazards-source';
  const fillLayerId = 'nexus-hazards-fill';
  const lineLayerId = 'nexus-hazards-outline';

  if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
  if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  if (!visible || hazards.length === 0) return;

  const features = hazards.map((h) => ({
    type: 'Feature',
    properties: {
      id: h.id,
      title: h.title,
      severity: h.severity,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [h.coordinates],
    },
  }));

  map.addSource(sourceId, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features,
    },
  });

  // Semi-transparent Danger Fill
  map.addLayer({
    id: fillLayerId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': ['match', ['get', 'severity'], 'CRITICAL', '#DC2626', '#F59E0B'],
      'fill-opacity': 0.2,
    },
  });

  // Pulsing / Dashed Outline
  map.addLayer({
    id: lineLayerId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': ['match', ['get', 'severity'], 'CRITICAL', '#B91C1C', '#D97706'],
      'line-width': 2.5,
      'line-dasharray': [2, 2],
    },
  });
}
