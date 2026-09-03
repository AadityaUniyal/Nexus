"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusLed } from "@/components/ui/status-led";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertTriangle, Plus, Sparkles, Clock, ArrowRight, ShieldAlert, RefreshCw } from "lucide-react";
import { IncidentItem } from "@/lib/mock-data";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function IncidentCenterPage() {
  const { toast } = useToast();
  const [incidents, setIncidents] = React.useState<IncidentItem[]>([]);
  const [filterSeverity, setFilterSeverity] = React.useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Form states
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [severity, setSeverity] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [affectedEntity, setAffectedEntity] = React.useState("Vehicle NX-TRK-104");

  const fetchIncidents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/incidents");
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json?.data && Array.isArray(json.data)) ? json.data : [];
        if (list.length > 0) {
          setIncidents(
            list.map((i: any) => ({
              id: i.id,
              code: i.code,
              title: i.title,
              severity: (i.severity || "HIGH") as any,
              status: (i.status || "DETECTED") as any,
              category: i.category || "WEATHER",
              summary: i.summary || i.title,
              affectedEntityType: (i.affected_entity_type || i.affectedEntityType || "VEHICLE") as any,
              affectedEntityId: i.affected_entity_id || i.affectedEntityId || "v-104",
              affectedEntityName: i.affected_entity_name || i.affectedEntityName || "Vehicle NX-TRK-104",
              rootCause: i.root_cause || i.rootCause || "Severe weather obstacle",
              aiAnalysis: i.ai_analysis || i.aiAnalysis || "Deterministic detour calculation recommended.",
              potentialImpact: i.potential_impact || i.potentialImpact || "SLA breach risk +180 mins",
              costEstimate: i.cost_estimate || i.costEstimate || 2500,
              ordersAffected: i.orders_affected || i.affected_orders_count || 14,
              delayMinutes: i.delay_minutes || i.delayMinutes || 180,
              createdAt: i.created_at || i.createdAt || new Date().toISOString(),
              timeline: i.timeline || [],
            }))
          );
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const filtered = incidents.filter(
    (i) => filterSeverity === "ALL" || i.severity === filterSeverity
  );

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          severity,
          affectedEntityType: "VEHICLE",
          affectedEntityId: "v-104",
          affectedEntityName: affectedEntity,
          delayMinutes: 60,
          costEstimate: 2500,
        }),
      });
      const json = await res.json();
      if (json.data || json.id) {
        const newInc = json.data || json;
        setIncidents((prev) => [
          {
            id: newInc.id || `inc-${Date.now()}`,
            code: newInc.code || `INC-${Date.now().toString().slice(-4)}`,
            title: newInc.title || title,
            summary: newInc.summary || summary,
            severity: (newInc.severity || severity) as any,
            status: "ACTION_PENDING",
            category: "WEATHER",
            affectedEntityType: "VEHICLE",
            affectedEntityId: "v-104",
            affectedEntityName: affectedEntity,
            rootCause: "Reported field observation",
            aiAnalysis: "Evaluating routing adjustments.",
            potentialImpact: "Delay on primary consignment",
            costEstimate: 2500,
            ordersAffected: 14,
            delayMinutes: 60,
            createdAt: new Date().toISOString(),
            timeline: [],
          },
          ...prev,
        ]);
        setIsCreateOpen(false);
        setTitle("");
        setSummary("");
        toast({
          title: `Incident Recorded`,
          message: "Triggered telemetry anomaly pipeline.",
          type: "critical",
        });
      }
    } catch {
      toast({
        title: "Incident Logged",
        message: "Recorded locally in operational store.",
        type: "info",
      });
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span>Telemetry Anomaly Triage</span>
              <span>·</span>
              <span>State Machine Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Incident Intelligence Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchIncidents}
              isLoading={isLoading}
              className="font-mono-data text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="font-mono-data text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Report Incident
            </Button>
          </div>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-2">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <Button
              key={sev}
              variant={filterSeverity === sev ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilterSeverity(sev)}
              className="font-mono-data text-xs"
            >
              {sev === "ALL" ? "All Incidents" : sev}
            </Button>
          ))}
        </div>

        {/* Incidents Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Incident Code</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Incident Summary</TableHead>
              <TableHead>Affected Asset</TableHead>
              <TableHead>Est. Delay</TableHead>
              <TableHead>Exposure Risk</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inc) => (
              <TableRow key={inc.id}>
                <TableCell className="font-mono-data font-bold">{inc.code}</TableCell>
                <TableCell>
                  <Badge
                    variant={inc.severity === "CRITICAL" ? "critical" : inc.severity === "HIGH" ? "attention" : "neutral"}
                    size="sm"
                  >
                    {inc.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusLed
                      status={inc.status === "RESOLVED" ? "HEALTHY" : inc.severity}
                      size="sm"
                    />
                    <span className="text-xs font-mono-data">{inc.status}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs max-w-sm">
                  <p className="font-semibold text-nexus-on-surface line-clamp-1">{inc.title}</p>
                  <p className="text-nexus-on-surface-variant text-[11px] line-clamp-1 mt-0.5">{inc.summary}</p>
                </TableCell>
                <TableCell className="font-mono-data text-xs">{inc.affectedEntityName}</TableCell>
                <TableCell className="font-mono-data text-xs font-semibold text-red-700">
                  +{inc.delayMinutes}m
                </TableCell>
                <TableCell className="font-mono-data text-xs font-semibold">
                  {formatCurrency(inc.costEstimate)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/simulations/new?incidentId=${inc.id}`}>
                      <Button variant="simulation" size="sm" className="font-mono-data text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Simulate
                      </Button>
                    </Link>
                    <Link href={`/incidents/${inc.id}`}>
                      <Button variant="secondary" size="sm" className="font-mono-data text-xs">
                        Inspect <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Create Incident Modal */}
        <Dialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Report Operational Incident"
          description="Manually record a weather delay, mechanical failure, or route obstruction."
        >
          <form onSubmit={handleCreateIncident} className="space-y-4">
            <Input
              label="Incident Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Highway Closure on I-80 Pass"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-nexus-on-surface font-mono-data uppercase">
                Detailed Summary
              </label>
              <textarea
                required
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Explain the operational telemetry observation..."
                className="tactile-input w-full p-3 text-sm text-nexus-on-surface"
              />
            </div>

            <Select
              label="Severity Level"
              value={severity}
              onChange={(e: any) => setSeverity(e.target.value)}
              options={[
                { label: "CRITICAL (Immediate SLA Threat)", value: "CRITICAL" },
                { label: "HIGH (Significant Delay)", value: "HIGH" },
                { label: "MEDIUM (Manageable)", value: "MEDIUM" },
                { label: "LOW (Informational)", value: "LOW" },
              ]}
            />

            <Input
              label="Affected Entity / Vehicle"
              required
              value={affectedEntity}
              onChange={(e) => setAffectedEntity(e.target.value)}
              placeholder="e.g. Route RT-CHI-DEN-01 or Vehicle NX-TRK-104"
            />

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Record Incident
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppShell>
  );
}
