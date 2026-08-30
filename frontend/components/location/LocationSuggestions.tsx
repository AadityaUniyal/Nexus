'use client';

import React from 'react';
import { MapPin, Building2, Train, Plane, Landmark, Compass } from 'lucide-react';
import { LocationAutocompleteItem } from '@/lib/api/endpoints/location';

interface LocationSuggestionsProps {
  suggestions: LocationAutocompleteItem[];
  selectedIndex: number;
  onSelect: (item: LocationAutocompleteItem) => void;
}

export function LocationSuggestions({
  suggestions,
  selectedIndex,
  onSelect,
}: LocationSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  const getIconForType = (type: string, label: string) => {
    const l = label.toLowerCase();
    if (l.includes('airport') || type === 'airport') return <Plane className="w-4 h-4 text-nexus-primary" />;
    if (l.includes('station') || l.includes('railway') || type === 'railway') return <Train className="w-4 h-4 text-nexus-secondary" />;
    if (type === 'city' || type === 'administrative') return <Building2 className="w-4 h-4 text-emerald-600" />;
    if (type === 'landmark' || type === 'amenity') return <Landmark className="w-4 h-4 text-amber-600" />;
    return <MapPin className="w-4 h-4 text-nexus-on-surface-variant" />;
  };

  const formatTypeTag = (type: string, label: string) => {
    const l = label.toLowerCase();
    if (l.includes('railway') || l.includes('station')) return 'Railway Station';
    if (l.includes('airport')) return 'Airport Facility';
    if (type === 'city') return 'City';
    if (type === 'administrative' || type === 'state') return 'Region';
    if (type === 'street') return 'Street Address';
    return type.replace('_', ' ').toUpperCase();
  };

  return (
    <ul
      role="listbox"
      className="absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto bg-white dark:bg-zinc-900 border border-nexus-surface-container-high rounded-lg shadow-xl divide-y divide-nexus-surface-container/50 font-sans"
    >
      {suggestions.map((item, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <li
            key={item.id || `${item.latitude}-${item.longitude}-${idx}`}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(item)}
            className={`flex items-start gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
              isSelected
                ? 'bg-nexus-surface-container text-nexus-primary font-medium'
                : 'hover:bg-nexus-surface/60 text-nexus-on-surface'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {getIconForType(item.type, item.label)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate">
                  {item.label}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-nexus-surface-container text-nexus-on-surface-variant shrink-0">
                  {formatTypeTag(item.type, item.label)}
                </span>
              </div>

              {item.secondary_label && (
                <p className="text-xs text-nexus-on-surface-variant truncate mt-0.5">
                  {item.secondary_label}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
