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

  const [orderNumber, setOrderNumber] = React.useState(`ORD-${Math.floor(10000 + Math.random() * 90000)}`);
  const [customerName, setCustomerName] = React.useState("Continental Retail Logistics");
  const [destination, setDestination] = React.useState("Haridwar Industrial Estate, Uttarakhand");
  const [warehouseId, setWarehouseId] = React.useState(warehouses[0]?.id || "");
  const [vehicleId, setVehicleId] = React.useState(vehicles[0]?.id || "");
  const [priority, setPriority] = React.useState("NORMAL");
  const [deadline, setDeadline] = React.useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [totalCost, setTotalCost] = React.useState("1850");
  const [itemsCount, setItemsCount] = React.useState("16");

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
        warehouseName: selectedWh?.name || "Regional Dispatch Hub",
        vehicleId: selectedVeh?.id || null,
        vehicleCode: selectedVeh?.code || "Unassigned",
        priority: priority as any,
        deadline: new Date(deadline).toISOString(),
        totalCost: parseFloat(totalCost) || 1500,
        itemsCount: parseInt(itemsCount, 10) || 12,
        status: "ASSIGNED" as any,
      });

      tactileAudio.playSuccess();
      toast({
        title: "Consignment Dispatched",
        message: `Order #${created.orderNumber} successfully booked with ${created.customerName}.`,
        type: "success",
      });

      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
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
      description="Role Requirement: Dispatcher scheduling customer orders and binding SLA guarantees."
      maxWidth="lg"
    >
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
            placeholder="Continental Retail Logistics"
            required
          />
        </div>

        {/* Destination Address */}
        <Input
          label="Destination Delivery Address"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Haridwar Industrial Estate, Uttarakhand"
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
              { label: "Normal (Standard SLA)", value: "NORMAL" },
              { label: "High Priority", value: "HIGH" },
              { label: "Urgent Critical", value: "URGENT" },
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
            placeholder="1850"
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
            {isSubmitting ? "Generating Consignment..." : "Commit Order & SLA Contract"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
