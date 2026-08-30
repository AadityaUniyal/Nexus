'use client';

import React, { useState } from 'react';
import { LocationSearch } from './LocationSearch';
import { LocationSummary } from './LocationSummary';
import { ResolvedLocation } from '@/lib/api/endpoints/location';
import { api } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { useAvatarStore } from '@/lib/avatar-store';

interface LocationPickerProps {
  workspaceId?: string;
  onLocationChange?: (location: ResolvedLocation) => void;
  initialLocation?: ResolvedLocation;
  className?: string;
}

export function LocationPicker({
  workspaceId,
  onLocationChange,
  initialLocation,
  className = '',
}: LocationPickerProps) {
  const [selectedLoc, setSelectedLoc] = useState<ResolvedLocation | null>(initialLocation || null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const triggerAvatar = useAvatarStore((s) => s.triggerEvent);

  const handleSelect = (loc: ResolvedLocation) => {
    setSelectedLoc(loc);
    setIsPrimary(false);
    if (onLocationChange) {
      onLocationChange(loc);
    }
  };

  const handleSetPrimary = async () => {
    if (!selectedLoc || !workspaceId) return;

    setIsSaving(true);
    triggerAvatar('AI_REQUEST');
    try {
      await api.location.setWorkspaceLocation(workspaceId, {
        location: selectedLoc,
        label: 'Primary Operating Base',
        type: 'OPERATING_REGION',
        isPrimary: true,
      });
      setIsPrimary(true);
      triggerAvatar('DECISION_APPLIED');
      toast({
        title: 'Operating Base Updated',
        message: `Workspace primary location set to ${selectedLoc.display_name}.`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Update Failed',
        message: 'Unable to set workspace primary location.',
        type: 'critical',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-1">
        <label className="text-xs font-mono uppercase tracking-wider text-nexus-on-surface-variant font-medium">
          Target Operating Region
        </label>
        <LocationSearch onLocationSelected={handleSelect} />
      </div>

      {selectedLoc && (
        <LocationSummary
          location={selectedLoc}
          isWorkspacePrimary={isPrimary}
          onSetPrimary={workspaceId ? handleSetPrimary : undefined}
          isSettingPrimary={isSaving}
        />
      )}
    </div>
  );
}
