'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, Compass } from 'lucide-react';
import { api } from '@/lib/api/client';
import { LocationAutocompleteItem, ResolvedLocation } from '@/lib/api/endpoints/location';
import { LocationSuggestions } from './LocationSuggestions';
import { CurrentLocationButton } from './CurrentLocationButton';
import { useAvatarStore } from '@/lib/avatar-store';

interface LocationSearchProps {
  onLocationSelected: (location: ResolvedLocation) => void;
  placeholder?: string;
  className?: string;
  initialQuery?: string;
  showCurrentLocation?: boolean;
}

export function LocationSearch({
  onLocationSelected,
  placeholder = 'Search any city, address, hub, facility...',
  className = '',
  initialQuery = '',
  showCurrentLocation = true,
}: LocationSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<LocationAutocompleteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAvatar = useAvatarStore((s) => s.triggerEvent);

  // Debounced autocomplete query
  const fetchSuggestions = useCallback(async (text: string) => {
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const items = await api.location.autocomplete(text.trim(), undefined, 5);
      setSuggestions(items || []);
      setIsOpen(items && items.length > 0);
      setSelectedIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleSelectSuggestion = async (item: LocationAutocompleteItem) => {
    setQuery(item.label);
    setIsOpen(false);
    setIsLoading(true);
    triggerAvatar('AI_REQUEST');

    try {
      const resolved = await api.location.resolve({
        query: item.label,
        latitude: item.latitude,
        longitude: item.longitude,
        resultType: item.type,
        providerResultId: item.id,
      });
      onLocationSelected(resolved);
      triggerAvatar('WORLD_ENTITY_SELECTED');
    } catch {
      // Fallback resolved location
      const fallback: ResolvedLocation = {
        id: item.id || `loc-${Date.now()}`,
        display_name: item.label,
        latitude: item.latitude,
        longitude: item.longitude,
        country: item.country,
        country_code: item.country_code,
        region: item.state,
        city: item.city,
        type: item.type,
        confidence: item.confidence || 1.0,
        provider: 'geoapify',
      };
      onLocationSelected(fallback);
      triggerAvatar('WORLD_ENTITY_SELECTED');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute left-3 text-nexus-on-surface-variant pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-nexus-primary" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-24 py-2.5 bg-white dark:bg-zinc-900 border border-nexus-surface-container-high focus:border-nexus-primary focus:ring-1 focus:ring-nexus-primary rounded-lg text-sm text-nexus-on-surface placeholder:text-nexus-on-surface-variant/60 font-sans transition-all outline-none"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-nexus-on-surface-variant hover:text-nexus-on-surface rounded transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showCurrentLocation && (
            <CurrentLocationButton onLocationFound={(loc) => {
              setQuery(loc.display_name);
              onLocationSelected(loc);
            }} />
          )}
        </div>
      </div>

      {isOpen && (
        <LocationSuggestions
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={handleSelectSuggestion}
        />
      )}
    </div>
  );
}
