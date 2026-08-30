'use client';

import React, { useState } from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { ResolvedLocation } from '@/lib/api/endpoints/location';
import { useAvatarStore } from '@/lib/avatar-store';

interface CurrentLocationButtonProps {
  onLocationFound: (location: ResolvedLocation) => void;
  className?: string;
}

export function CurrentLocationButton({ onLocationFound, className = '' }: CurrentLocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const triggerAvatar = useAvatarStore((s) => s.triggerEvent);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    triggerAvatar('AI_REQUEST');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;

          const resolved = await api.location.reverse(lat, lng, accuracy);
          onLocationFound(resolved);
          triggerAvatar('AI_RESPONSE');
        } catch {
          setErrorMsg('Failed to resolve address. Using coordinates.');
          onLocationFound({
            id: `loc-gps-${Date.now()}`,
            display_name: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            type: 'current_position',
            confidence: 1.0,
            provider: 'browser-gps',
          });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg('Location access is disabled. Search for a place instead.');
        } else {
          setErrorMsg('Unable to retrieve current location.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={loading}
        title="Use my current location"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-wider uppercase text-nexus-primary bg-nexus-primary/10 hover:bg-nexus-primary/20 rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Navigation className="w-3.5 h-3.5" />
        )}
        <span>Use My Location</span>
      </button>

      {errorMsg && (
        <span className="absolute top-full left-0 mt-1 text-[11px] text-nexus-critical font-sans whitespace-nowrap">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
