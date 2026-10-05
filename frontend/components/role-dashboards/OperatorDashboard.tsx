"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  Truck,
  Battery,
  Gauge,
  Thermometer,
  Radio,
  PhoneCall,
  QrCode,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  Shield,
  Activity,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricTile } from "@/components/ui/metric-tile";
import { VehicleItem, WarehouseItem } from "@/lib/mock-data";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";
import { DriverBeaconModal } from "@/components/innovations/DriverBeaconModal";

export interface OperatorDashboardProps {
  vehicles: VehicleItem[];
  warehouses: WarehouseItem[];
  onQuickDispatch?: (vehicleId: string) => void;
}

export function OperatorDashboard({
  vehicles,
  warehouses,
  onQuickDispatch,
}: OperatorDashboardProps) {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = React.useState<VehicleItem | null>(
    vehicles[0] || null
  );
  const [beaconModalOpen, setBeaconModalOpen] = React.useState(false);

  // Keyboard shortcut listener for field dispatchers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        tactileAudio.playSuccess();
        toast({
          title: "Telemetry Acknowledged",
          message: "Shift log updated for active field queue.",
          type: "info",
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toast]);

  const activeVehicles = vehicles.filter((v) => v.status === "IN_TRANSIT");

  return (
    <div className="space-y-6">
      {/* Telemetry Stream Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Active Field Pilots"
          value={activeVehicles.length}
          subtitle={`of ${vehicles.length} Trucks`}
          change="100% telemetry synced"
          trend="up"
          status="HEALTHY"
          icon={Truck}
          variant="default"
        />
        <MetricTile
          title="Fleet Battery Health"
          value="88.4%"
          subtitle="Average SoC"
          change="0 depleted"
          trend="up"
          status="HEALTHY"
          icon={Battery}
          variant="default"
        />
        <MetricTile
          title="Dock Turnaround Time"
          value="24m"
          subtitle="Average Gate-to-Dock"
          change="-6m vs yesterday"
          trend="up"
          status="HEALTHY"
          icon={Clock}
          variant="default"
        />
        <MetricTile
          title="Cold-Chain Sensor Integrity"
          value="99.8%"
          subtitle="Within ±0.5°C Range"
          change="Pharma grade"
          trend="up"
          status="HEALTHY"
          icon={Thermometer}
          variant="default"
        />
      </div>

      {/* Field Dispatch Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Vehicles High-Density Stream */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile">
            <CardHeader className="pb-3 border-b border-nexus-outline/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-mono font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Asset Telemetry & Shift Stream
                </CardTitle>
                <CardDescription className="text-xs">
                  Press [Space] to quick-acknowledge telemetry alerts
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setBeaconModalOpen(true)}
                  className="font-mono text-xs h-8"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1.5 text-nexus-secondary" />
                  Generate Driver Beacon Pass
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-nexus-surface-container-high/60 border-b border-nexus-outline/20 text-nexus-on-surface-variant text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Vehicle</th>
                    <th className="py-2.5 px-3">Pilot / Phone</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Speed / SoC</th>
                    <th className="py-2.5 px-3">Cargo Temp</th>
                    <th className="py-2.5 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-outline/10">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicle?.id === v.id;
                    return (
                      <tr
                        key={v.id}
                        onClick={() => {
                          setSelectedVehicle(v);
                          tactileAudio.playClick();
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-nexus-secondary/10 dark:bg-nexus-secondary/20"
                            : "hover:bg-nexus-surface-container-high/40"
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-nexus-on-surface flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-nexus-secondary shrink-0" />
                          <span>{v.code}</span>
                        </td>
                        <td className="py-3 px-3 text-nexus-on-surface">
                          <div>{v.driverName}</div>
                          <div className="text-[10px] text-nexus-on-surface-variant font-sans">
                            {v.driverPhone}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={v.status === "IN_TRANSIT" ? "healthy" : "attention"}
                            className="text-[10px] uppercase font-mono"
                          >
                            {v.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-nexus-on-surface">{v.speedKmh} km/h</div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            {v.batteryPct}% Battery
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                            -4.2°C
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVehicle(v);
                              setBeaconModalOpen(true);
                            }}
                            className="h-7 px-2 text-[11px] font-mono text-nexus-secondary hover:text-nexus-on-surface"
                          >
                            <QrCode className="w-3.5 h-3.5 mr-1" /> Pass
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Selected Vehicle HUD Card */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile bg-nexus-surface-container">
            <CardHeader className="pb-3 border-b border-nexus-outline/20">
              <CardTitle className="text-sm font-mono font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-nexus-secondary" />
                Active Truck Diagnostics
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedVehicle?.code || "NX-804"} · {selectedVehicle?.model || "Freightliner eCascadia"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {selectedVehicle ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                      <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                        Active Route
                      </span>
                      <span className="font-bold text-nexus-on-surface">
                        {selectedVehicle.currentRouteName || "Corridor I-80"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                      <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                        Payload Weight
                      </span>
                      <span className="font-bold text-nexus-on-surface">
                        {(selectedVehicle.currentLoadKg / 1000).toFixed(1)} / {(selectedVehicle.capacityKg / 1000).toFixed(1)} T
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                      <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                        Tyre Pressure (PSI)
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        105 PSI (Nominal)
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                      <span className="text-[10px] text-nexus-on-surface-variant block uppercase">
                        Driver Rest Timer
                      </span>
                      <span className="font-bold text-nexus-on-surface">
                        3h 42m elapsed
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        tactileAudio.playClick();
                        toast({
                          title: "Driver Audio Radio Initiated",
                          message: `Connecting to ${selectedVehicle.driverName}...`,
                          type: "info",
                        });
                      }}
                      className="w-full font-mono text-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5 mr-1.5 text-nexus-secondary" />
                      Contact Driver Voice Bridge
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        tactileAudio.playCriticalAlert();
                        toast({
                          title: "Emergency SOS Triggered",
                          message: `Highway breakdown alert broadcast for ${selectedVehicle.code}.`,
                          type: "critical",
                        });
                      }}
                      className="w-full font-mono text-xs shadow-tactile"
                    >
                      <AlertOctagon className="w-3.5 h-3.5 mr-1.5" />
                      Broadcast Emergency SOS
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs font-mono text-nexus-on-surface-variant">
                  Select a vehicle from the telemetry stream.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Driver Beacon Modal */}
      <DriverBeaconModal
        isOpen={beaconModalOpen}
        onClose={() => setBeaconModalOpen(false)}
        vehicleCode={selectedVehicle?.code || "NX-804"}
        driverName={selectedVehicle?.driverName || "Rajesh Sharma"}
        routeCode={selectedVehicle?.currentRouteName || "COR-DEL-DED-01"}
      />
    </div>
  );
}
