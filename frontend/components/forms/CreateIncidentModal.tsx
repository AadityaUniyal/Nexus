"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertTriangle, Clock, DollarSign } from "lucide-react";
import { dataProvider } from "@/lib/data-provider";
import { IncidentItem, VehicleItem, WarehouseItem } from "@/lib/mock-data";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (incident: IncidentItem) => void;
  vehicles?: VehicleItem[];
  warehouses?: WarehouseItem[];
}

export function CreateIncidentModal({
  isOpen,
  onClose,
  onSuccess,
  vehicles = [],
  warehouses = [],
}: CreateIncidentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [severity, setSeverity] = React.useState("");
  const [entityType, setEntityType] = React.useState("VEHICLE");
  const [entityId, setEntityId] = React.useState(vehicles[0]?.id || "");
  const [delayMinutes, setDelayMinutes] = React.useState("");
  const [costEstimate, setCostEstimate] = React.useState("");
  const [rootCause, setRootCause] = React.useState("");

  // Keep entityId synced when vehicles or warehouses change
  React.useEffect(() => {
    if (entityType === "VEHICLE" && !vehicles.some((v) => v.id === entityId)) {
      setEntityId("");
    } else if (entityType === "WAREHOUSE" && !warehouses.some((w) => w.id === entityId)) {
      setEntityId("");
    }
  }, [entityType, vehicles, warehouses, entityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !severity || !entityId || delayMinutes === "" || costEstimate === "") {
      toast({
        title: "Validation Error",
        message: "Complete incident details, affected asset, severity, delay, and cost estimate before saving.",
        type: "critical",
      });
      return;
    }

    setIsSubmitting(true);
    tactileAudio.playClick();

    try {
      let entityName = "";
      if (entityType === "VEHICLE") {
        const found = vehicles.find((v) => v.id === entityId);
        if (found) entityName = `${found.code} (${found.driverName})`;
      } else if (entityType === "WAREHOUSE") {
        const found = warehouses.find((w) => w.id === entityId);
        if (found) entityName = `${found.name} (${found.city})`;
      }

      if (!entityName) throw new Error("Select an existing affected asset in this workspace.");
      const created = await dataProvider.createIncident({
        title: title.trim(),
        summary: summary.trim(),
        severity: severity as any,
        affectedEntityType: entityType as any,
        affectedEntityId: entityId,
        affectedEntityName: entityName,
        delayMinutes: Number(delayMinutes),
        costEstimate: Number(costEstimate),
        rootCause: rootCause.trim(),
      });

      tactileAudio.playCriticalAlert();
      toast({
        title: "Incident saved",
        message: `${created.title} was added to this workspace.`,
        type: "critical",
      });

      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      toast({
        title: "Incident Submission Failed",
        message: err.message || "Unable to save incident to live database.",
        type: "critical",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const entityOptions = entityType === "VEHICLE"
    ? (vehicles.length > 0
        ? vehicles.map((v) => ({ label: `${v.code} - ${v.driverName}`, value: v.id }))
        : [{ label: "No registered vehicles available", value: "" }])
    : (warehouses.length > 0
        ? warehouses.map((w) => ({ label: `${w.name} (${w.city})`, value: w.id }))
        : [{ label: "No registered warehouses available", value: "" }]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Log Operational Incident & Disruption"
      description="Role Requirement: Field Operator or Driver reporting active corridor bottlenecks or breakdowns."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title & Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Incident Headline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Flash Flooding on NH-7 Bypass"
              required
            />
          </div>
          <div>
            <Select
              label="Severity Level"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              options={[
                { label: "Select severity", value: "" },
                { label: "Critical Breach", value: "CRITICAL" },
                { label: "High Severity", value: "HIGH" },
                { label: "Medium Impact", value: "MEDIUM" },
                { label: "Low Advisory", value: "LOW" },
              ]}
            />
          </div>
        </div>

        {/* Field Notes Summary */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-nexus-on-surface font-mono uppercase">
            Field Observation / Telemetry Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="tactile-input w-full px-3.5 py-2 text-sm text-nexus-on-surface placeholder:text-nexus-outline transition-all"
            placeholder="Describe physical obstruction, vehicle telemetry warnings, or weather impact..."
            required
          />
        </div>

        {/* Affected Asset Association */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Entity Category"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setEntityId("");
            }}
            options={[
              { label: "Fleet Commercial Vehicle", value: "VEHICLE" },
              { label: "Warehouse / Terminal Hub", value: "WAREHOUSE" },
            ]}
          />
          <Select
            label="Specific Affected Asset"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            options={entityOptions}
          />
        </div>

        {/* Operational Delay & Financial Exposure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Expected Delay (Minutes)"
            type="number"
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(e.target.value)}
            min="0"
            required
          />
          <Input
            label="Estimated Financial Liability ($)"
            type="number"
            value={costEstimate}
            onChange={(e) => setCostEstimate(e.target.value)}
            min="0"
            required
          />
        </div>

        <Input
          label="Root Cause Category"
          value={rootCause}
          onChange={(e) => setRootCause(e.target.value)}
          placeholder="Enter the reported cause, if known"
        />

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
            variant="critical"
            disabled={isSubmitting}
            className="font-mono text-xs shadow-tactile"
          >
            {isSubmitting ? "Broadcasting Alert..." : "Broadcast Incident Alert"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
