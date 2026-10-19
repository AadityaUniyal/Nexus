"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Package, Truck, Building2, Calendar, DollarSign } from "lucide-react";
import { dataProvider } from "@/lib/data-provider";
import { OrderItem, WarehouseItem, VehicleItem } from "@/lib/mock-data";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (order: OrderItem) => void;
  warehouses?: WarehouseItem[];
  vehicles?: VehicleItem[];
}

export function CreateOrderModal({
  isOpen,
  onClose,
  onSuccess,
  warehouses = [],
  vehicles = [],
}: CreateOrderModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [orderNumber, setOrderNumber] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState(warehouses[0]?.id || "");
  const [vehicleId, setVehicleId] = React.useState(vehicles[0]?.id || "");
  const [priority, setPriority] = React.useState("STANDARD");
  const [deadline, setDeadline] = React.useState("");
  const [totalCost, setTotalCost] = React.useState("");
  const [createdShareInfo, setCreatedShareInfo] = React.useState<{ orderNumber: string; driverUrl: string; trackingUrl: string } | null>(null);

  // Keep origin warehouse default synced
  React.useEffect(() => {
    if (warehouses.length > 0 && !warehouseId) {
      setWarehouseId(warehouses[0].id);
    }
  }, [warehouses, warehouseId]);

  // Keep vehicle default synced
  React.useEffect(() => {
    if (vehicles.length > 0 && !vehicleId) {
      setVehicleId(vehicles[0].id);
    }
  }, [vehicles, vehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !customerName.trim() || !destination.trim()) {
      toast({
        title: "Validation Error",
        message: "Order number, customer name, and destination are required.",
        type: "critical",
      });
      return;
    }

    setIsSubmitting(true);
    tactileAudio.playClick();

    try {
      const selectedWh = warehouses.find((w) => w.id === warehouseId);
      const selectedVeh = vehicles.find((v) => v.id === vehicleId);

      const created = await dataProvider.createOrder({
        orderNumber: orderNumber.trim().toUpperCase(),
        customerName: customerName.trim(),
        destination: destination.trim(),
        warehouseId: selectedWh?.id || null,
        warehouseName: selectedWh?.name || "",
        vehicleId: selectedVeh?.id || null,
        vehicleCode: selectedVeh?.code || undefined,
        routeId: null,
        priority: priority as any,
        deadline: new Date(deadline).toISOString(),
        totalCost: Number(totalCost),
        status: "PENDING" as any,
      });

      tactileAudio.playSuccess();
      const driverUrl = `${window.location.origin}/driver-pass?v=${selectedVeh?.code || "NX-804"}&order=${encodeURIComponent(created.orderNumber)}`;
      setCreatedShareInfo({
        orderNumber: created.orderNumber,
        driverUrl,
        trackingUrl: `${window.location.origin}/track/${encodeURIComponent(created.orderNumber)}`,
      });

      toast({
        title: "Consignment Dispatched",
        message: `Trip for #${created.orderNumber} created. Share pass with driver.`,
        type: "success",
      });

      if (onSuccess) {
        onSuccess(created);
      }
    } catch (err: any) {
      toast({
        title: "Order Dispatch Failed",
        message: err.message || "Failed to commit order into operations database.",
        type: "critical",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const warehouseOptions = warehouses.length > 0
    ? warehouses.map((w) => ({ label: `${w.name} (${w.city})`, value: w.id }))
    : [{ label: "No Registered Hubs (Create Hub First)", value: "" }];

  const vehicleOptions = vehicles.length > 0
    ? [{ label: "Auto-Assign or Unassigned", value: "" }, ...vehicles.map((v) => ({ label: `${v.code} - ${v.driverName} (${v.model})`, value: v.id }))]
    : [{ label: "No Active Vehicles (Register Vehicle First)", value: "" }];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Freight Consignment Order"
      description="Create an order record. Dispatch and SLA tracking require assigned routes and real operational updates."
      maxWidth="lg"
    >
      {createdShareInfo ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] text-left">
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              ✓ Consignment Trip Created &amp; Dispatched
            </span>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">
              Order #{createdShareInfo.orderNumber} is assigned to active road transit.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <div className="p-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.10] bg-neutral-50 dark:bg-neutral-900/50">
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">
                1. Driver Mobile Web Pass (Zero-Install WhatsApp Link)
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  readOnly
                  value={createdShareInfo.driverUrl}
                  className="w-full text-xs font-mono bg-white dark:bg-neutral-800 border border-black/[0.1] dark:border-white/[0.1] rounded-lg px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300 select-all"
                />
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    navigator.clipboard.writeText(createdShareInfo.driverUrl);
                    toast({ title: "Copied!", message: "Driver pass URL copied to clipboard.", type: "success" });
                  }}
                  className="shrink-0 text-xs font-mono"
                >
                  Copy Link
                </Button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.10] bg-neutral-50 dark:bg-neutral-900/50">
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">
                2. Client / Consignor Live Tracking Link (Public Read-Only)
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  readOnly
                  value={createdShareInfo.trackingUrl}
                  className="w-full text-xs font-mono bg-white dark:bg-neutral-800 border border-black/[0.1] dark:border-white/[0.1] rounded-lg px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300 select-all"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(createdShareInfo.trackingUrl);
                    toast({ title: "Copied!", message: "Client tracking URL copied to clipboard.", type: "success" });
                  }}
                  className="shrink-0 text-xs font-mono"
                >
                  Copy Link
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-black/[0.08] dark:border-white/[0.10]">
            <Button
              variant="default"
              onClick={() => {
                setCreatedShareInfo(null);
                onClose();
              }}
              className="text-xs font-mono"
            >
              Done &amp; Return to Dashboard
            </Button>
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core Order Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Consignment Order #"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="ORD-92811"
            required
          />
          <Input
            label="Customer / Enterprise Client"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            required
          />
        </div>

        {/* Destination Address */}
        <Input
          label="Destination Delivery Address"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter delivery address"
          required
        />

        {/* Operational Routing Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Origin Fulfillment Hub"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            options={warehouseOptions}
          />
          <Select
            label="Assigned Fleet Carrier"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            options={vehicleOptions}
          />
        </div>

        {/* SLA & Priority Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Priority Tier"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { label: "Standard", value: "STANDARD" },
              { label: "High Priority", value: "HIGH" },
              { label: "Critical", value: "CRITICAL" },
            ]}
          />
          <Input
            label="SLA Deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
          <Input
            label="Declared Value ($)"
            type="number"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            min="0"
            required
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
            {isSubmitting ? "Saving order…" : "Save order"}
          </Button>
        </div>
      </form>
      )}
    </Dialog>
  );
}
