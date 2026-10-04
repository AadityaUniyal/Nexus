'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue in Leaflet when using Webpack/Next.js safely on client only
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
    iconUrl: '/leaflet/images/marker-icon.png',
    shadowUrl: '/leaflet/images/marker-shadow.png',
  });
}

interface LocationData {
  id: string;
  latitude: number;
  longitude: number;
}

interface MapProps {
  /** Workspace identifier for which locations should be displayed */
  workspaceId: string;
  /** When true the Azure PostgreSQL engine is used; otherwise Neon */
  useAzure?: boolean;
}

/**
 * Simple 2‑D map displaying all stored locations for a workspace.
 * Data is fetched from the backend endpoint `/api/location/locations`.
 * No 3‑D view or hard‑coded coordinates – everything is driven by DB.
 */
const Map: React.FC<MapProps> = ({ workspaceId, useAzure = false }) => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [center, setCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default to India

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
        const resp = await fetch(
          `${baseUrl}/api/v1/location/locations?workspace_id=${workspaceId}&use_azure=${useAzure}`
        );
        if (!resp.ok) {
          console.error('Failed to load locations', resp.statusText);
          return;
        }
        const data: LocationData[] = await resp.json();
        setLocations(data);
        if (data.length > 0) {
          // Center map on first location
          setCenter([data[0].latitude, data[0].longitude]);
        }
      } catch (e) {
        console.error('Error fetching locations', e);
      }
    };
    fetchLocations();
  }, [workspaceId, useAzure]);

      const mapProps: any = {
        center,
        zoom: 5,
        style: { height: '400px', width: '100%' },
        scrollWheelZoom: true,
      };
      return (
        <MapContainer {...(mapProps as any)}>
// @ts-ignore
          <TileLayer {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' } as any)} />
          {locations.map((loc) => (
            <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
              <Popup>
                ID: {loc.id}<br />
                ({loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)})
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      );
};

export default Map;
