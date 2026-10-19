"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Battery, User } from "lucide-react";
import { dataProvider } from "@/lib/data-provider";
import { VehicleItem, WarehouseItem } from "@/lib/mock-data";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (vehicle: VehicleItem) => void;
  warehouses?: WarehouseItem[];
}

export function CreateVehicleModal({
  isOpen,
  onClose,
  onSuccess,
  warehouses = [],
}: CreateVehicleModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [model, setModel] = React.useState("");
  const [driverName, setDriverName] = React.useState("");
  const [driverPhone, setDriverPhone] = React.useState("");
  const [capacityKg, setCapacityKg] = React.useState("");
  const [currentLoadKg, setCurrentLoadKg] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [speedKmh, setSpeedKmh] = React.useState("");
  const [batteryPct, setBatteryPct] = React.useState("");
  const [status, setStatus] = React.useState("");

  React.useEffect(() => {
    if (warehouses && warehouses.length > 0) {
      setLat(warehouses[0].lat.toFixed(4));
      setLng(warehouses[0].lng.toFixed(4));
    }
  }, [warehouses]);

  const handleSelectWarehouseLocation = (whId: string) => {
    const wh = warehouses.find((w) => w.id === whId || w.code === whId);
    if (wh) {
      setLat(wh.lat.toFixed(4));
      setLng(wh.lng.toFixed(4));
      tactileAudio.playClick();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      if (!code.trim() || !name.trim() || !model.trim() || !driverName.trim() || !status) {
      toast({
        title: "Validation Error",
          message: "Vehicle code, name, model, assigned driver, and current status are required.",
        type: "critical",
      });
      return;
    }

    setIsSubmitting(true);
    tactileAudio.playClick();

    try {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      const parsedCapacity = capacityKg ? Number(capacityKg) : undefined;
      const parsedLoad = currentLoadKg ? Number(currentLoadKg) : undefined;
      const parsedSpeed = speedKmh ? Number(speedKmh) : undefined;
      const parsedBattery = batteryPct ? Number(batteryPct) : undefined;
      if (!lat.trim() || !lng.trim() || !Number.isFinite(parsedLat) || !Number.isFinite(parsedLng) || Math.abs(parsedLat) > 90 || Math.abs(parsedLng) > 180) {
        throw new Error("Enter the vehicle’s current latitude and longitude, or select a recorded warehouse location.");
      }

      const created = await dataProvider.createVehicle({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        model: model.trim(),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        capacityKg: parsedCapacity,
        currentLoadKg: parsedLoad,
        lat: parsedLat,
        lng: parsedLng,
        speedKmh: parsedSpeed,
        batteryPct: parsedBattery,
        status: status as any,
      });

      tactileAudio.playSuccess();
      toast({
        title: "Commercial Vehicle Enrolled",
        message: `${created.code} was saved to this workspace. Live telemetry requires a connected data source.`,
        type: "success",
      });

      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        message: err.message || "Unable to register commercial vehicle.",
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
      title="Enroll Fleet Vehicle & Driver"
      description="Role Requirement: Dispatcher / Field Operator managing vehicle assets & driver credentials."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin Warehouse Picker if available */}
        {warehouses.length > 0 && (
          <div className="p-3 rounded-xl bg-nexus-surface-container-high/60 border border-nexus-outline/20 space-y-1.5">
            <label className="block text-xs font-semibold text-nexus-on-surface font-mono uppercase">
              Deploy From Registered Warehouse Hub
            </label>
            <div className="flex flex-wrap gap-1.5">
              {warehouses.slice(0, 6).map((wh) => (
                <button
                  key={wh.id}
                  type="button"
                  onClick={() => handleSelectWarehouseLocation(wh.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-nexus-surface border border-nexus-outline/30 text-nexus-on-surface hover:border-nexus-primary transition-all"
                >
                  {wh.name} ({wh.city})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Identity & Model */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Vehicle ID / Plate"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="NX-104"
            required
          />
          <Input
            label="Asset Fleet Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Regional Express Hauler"
            required
          />
          <Input
            label="Truck Model / Class"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Class-8 EV Hauler"
            required
          />
        </div>

        {/* Driver Assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Driver Pilot Name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="Vikram Rawat"
            required
          />
          <Input
            label="Driver Phone / Beacon Link"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            placeholder="+91 98111 22334"
            required
          />
        </div>

        {/* Current Location Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Live Telemetry Latitude (°N)"
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="30.3165"
            required
          />
          <Input
            label="Live Telemetry Longitude (°E)"
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="78.0322"
            required
          />
        </div>

        {/* Weight & Capacity Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Max Payload Capacity (Kg)"
            type="number"
            value={capacityKg}
            onChange={(e) => setCapacityKg(e.target.value)}
            placeholder="24000"
          />
          <Input
            label="Current Load (Kg)"
            type="number"
            value={currentLoadKg}
            onChange={(e) => setCurrentLoadKg(e.target.value)}
            placeholder="16500"
          />
        </div>

        {/* Real-time Telemetry Starting State */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Current Speed (Km/h)"
            type="number"
            value={speedKmh}
            onChange={(e) => setSpeedKmh(e.target.value)}
            placeholder="64"
          />
          <Input
            label="Battery SoC (%)"
            type="number"
            min="0"
            max="100"
            value={batteryPct}
            onChange={(e) => setBatteryPct(e.target.value)}
            placeholder="92"
          />
          <Select
            label="Fleet Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: "In Transit (Active)", value: "IN_TRANSIT" },
              { label: "Dock Loading", value: "LOADING" },
              { label: "Stationary / Idle", value: "IDLE" },
              { label: "Depot Maintenance", value: "MAINTENANCE" },
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
            {isSubmitting ? "Registering Telemetry..." : "Deploy Commercial Asset"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
