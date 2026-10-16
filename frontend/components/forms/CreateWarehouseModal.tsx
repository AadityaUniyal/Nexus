"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Compass, CheckCircle2 } from "lucide-react";
import { dataProvider } from "@/lib/data-provider";
import { WarehouseItem } from "@/lib/mock-data";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

interface CreateWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (warehouse: WarehouseItem) => void;
  defaultCoordinates?: { lat: number; lng: number };
}

const CITY_PRESETS = [
  { city: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322 },
  { city: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090 },
  { city: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  { city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { city: "London", state: "Greater London", lat: 51.5074, lng: -0.1278 },
  { city: "Chicago", state: "Illinois", lat: 41.8781, lng: -87.6298 },
  { city: "Singapore", state: "Singapore", lat: 1.3521, lng: 103.8198 },
  { city: "Tokyo", state: "Kanto", lat: 35.6762, lng: 139.6503 },
];

export function CreateWarehouseModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCoordinates,
}: CreateWarehouseModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [code, setCode] = React.useState("WH-DED-01");
  const [name, setName] = React.useState("Dehradun Intermodal Hub");
  const [city, setCity] = React.useState("Dehradun");
  const [state, setState] = React.useState("Uttarakhand");
  const [lat, setLat] = React.useState(defaultCoordinates?.lat?.toString() || "30.3165");
  const [lng, setLng] = React.useState(defaultCoordinates?.lng?.toString() || "78.0322");
  const [capacityUnits, setCapacityUnits] = React.useState("50000");
  const [dockCount, setDockCount] = React.useState("12");
  const [activeDocks, setActiveDocks] = React.useState("4");
  const [efficiencyPct, setEfficiencyPct] = React.useState("95");
  const [status, setStatus] = React.useState("OPERATIONAL");

  // React to defaultCoordinates prop change if map center changes, or load workspace location
  React.useEffect(() => {
    if (defaultCoordinates) {
      setLat(defaultCoordinates.lat.toFixed(4));
      setLng(defaultCoordinates.lng.toFixed(4));
    } else if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("nexus_workspace_location");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.lat && parsed.lng) {
            setLat(parsed.lat.toString());
            setLng(parsed.lng.toString());
            if (parsed.name) {
              setCity(parsed.name);
              setCode(`WH-${parsed.name.substring(0, 3).toUpperCase()}-01`);
              setName(`${parsed.name} Operational Hub`);
            }
          }
        }
      } catch {}
    }
  }, [defaultCoordinates]);

  const handleApplyPreset = (presetCity: string) => {
    const found = CITY_PRESETS.find((p) => p.city === presetCity);
    if (found) {
      setCity(found.city);
      setState(found.state);
      setLat(found.lat.toString());
      setLng(found.lng.toString());
      setCode(`WH-${found.city.substring(0, 3).toUpperCase()}-01`);
      setName(`${found.city} Central Terminal`);
      tactileAudio.playClick();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !city.trim()) {
      toast({
        title: "Validation Error",
        message: "Hub code, name, and city are mandatory fields.",
        type: "critical",
      });
      return;
    }

    setIsSubmitting(true);
    tactileAudio.playClick();

    try {
      const parsedLat = parseFloat(lat) || 30.3165;
      const parsedLng = parseFloat(lng) || 78.0322;
      const parsedCapacity = parseInt(capacityUnits, 10) || 50000;
      const parsedDocks = parseInt(dockCount, 10) || 8;
      const parsedActive = parseInt(activeDocks, 10) || 4;
      const parsedEff = parseFloat(efficiencyPct) || 95;

      const created = await dataProvider.createWarehouse({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        city: city.trim(),
        state: state.trim(),
        lat: parsedLat,
        lng: parsedLng,
        capacityUnits: parsedCapacity,
        currentUnits: Math.round(parsedCapacity * 0.4),
        dockCount: parsedDocks,
        activeDocks: parsedActive,
        efficiencyPct: parsedEff,
        status: status as any,
      });

      tactileAudio.playSuccess();
      toast({
        title: "Warehouse Hub Created",
        message: `${created.name} (${created.code}) saved and pinned to Google Maps network.`,
        type: "success",
      });

      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      toast({
        title: "Creation Failed",
        message: err.message || "Unable to save warehouse to operational database.",
        type: "critical",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Register Operational Hub / Warehouse"
      description="Role Requirement: Administrator or Operations Manager establishing GIS network nodes."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Location Preset Selector */}
        <div className="p-3 rounded-xl bg-nexus-surface-container-high/60 border border-nexus-outline/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-nexus-on-surface flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-nexus-primary" />
              Quick City Node Autofill
            </span>
            <span className="text-nexus-on-surface-variant text-[11px]">
              Sets coordinates and codes
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CITY_PRESETS.map((p) => (
              <button
                key={p.city}
                type="button"
                onClick={() => handleApplyPreset(p.city)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                  city === p.city
                    ? "bg-nexus-primary text-white border-nexus-primary font-bold shadow-xs"
                    : "bg-nexus-surface border-nexus-outline/30 text-nexus-on-surface hover:border-nexus-outline"
                }`}
              >
                {p.city}
              </button>
            ))}
          </div>
        </div>

        {/* Identity & Naming */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Hub Code (Unique ID)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. WH-DED-01"
            required
          />
          <Input
            label="Facility / Hub Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dehradun Intermodal Terminal"
            required
          />
        </div>

        {/* Regional Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Dehradun"
            required
          />
          <Input
            label="State / Province"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="e.g. Uttarakhand"
            required
          />
        </div>

        {/* Precise GIS Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Latitude (°N/S)"
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="30.3165"
            required
          />
          <Input
            label="Longitude (°E/W)"
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="78.0322"
            required
          />
        </div>

        {/* Operational Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Storage Units Capacity"
            type="number"
            value={capacityUnits}
            onChange={(e) => setCapacityUnits(e.target.value)}
            placeholder="50000"
          />
          <Input
            label="Total Docks"
            type="number"
            value={dockCount}
            onChange={(e) => setDockCount(e.target.value)}
            placeholder="12"
          />
          <Input
            label="Active Docks"
            type="number"
            value={activeDocks}
            onChange={(e) => setActiveDocks(e.target.value)}
            placeholder="4"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Operating Efficiency (%)"
            type="number"
            min="0"
            max="100"
            value={efficiencyPct}
            onChange={(e) => setEfficiencyPct(e.target.value)}
            placeholder="95"
          />
          <Select
            label="Operating Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: "Operational (Normal)", value: "OPERATIONAL" },
              { label: "High Congestion", value: "CONGESTED" },
              { label: "Scheduled Maintenance", value: "MAINTENANCE" },
            ]}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-nexus-outline/20">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="font-mono text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={isSubmitting}
            className="font-mono text-xs shadow-tactile"
          >
            {isSubmitting ? "Persisting to PostgreSQL..." : "Commit Hub to Network"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
