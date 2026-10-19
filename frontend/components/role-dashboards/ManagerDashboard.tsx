"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Clock,
  DollarSign,
  TrendingDown,
  Building2,
  GitBranch,
  Truck,
  Activity,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricTile } from "@/components/ui/metric-tile";
import { IncidentItem, SimulationItem, WarehouseItem } from "@/lib/mock-data";
import { realtimeClient, NexusPulseItem } from "@/lib/realtime-client";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export interface ManagerDashboardProps {
  incidents: IncidentItem[];
  simulations: SimulationItem[];
  warehouses: WarehouseItem[];
  onOpenCreateIncident?: () => void;
  onOpenCreateWarehouse?: () => void;
  canRunSimulations?: boolean;
}

export function ManagerDashboard({
  incidents,
  simulations,
  warehouses,
  onOpenCreateIncident,
  onOpenCreateWarehouse,
  canRunSimulations = false,
}: ManagerDashboardProps) {
  const { toast } = useToast();
  const [selectedIncident, setSelectedIncident] = React.useState<IncidentItem | null>(
    incidents[0] || null
  );

  const [livePulse, setLivePulse] = React.useState<NexusPulseItem[]>([]);

  React.useEffect(() => {
    setLivePulse(realtimeClient.getPulseHistory().slice(0, 5));
    const unsub = realtimeClient.subscribePulse((item) => {
      setLivePulse((prev) => [item, ...prev.slice(0, 4)]);
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    if (!selectedIncident || !incidents.some((incident) => incident.id === selectedIncident.id)) {
      setSelectedIncident(incidents[0] || null);
    }
  }, [incidents, selectedIncident]);

  const activeIncidents = incidents.filter(
    (i) => i.status !== "RESOLVED" && i.status !== "ARCHIVED"
  );
  const knownIncidentCosts = activeIncidents.map((i) => i.costEstimate).filter((value): value is number => typeof value === "number");
  const totalFinancialLiability = knownIncidentCosts.length ? knownIncidentCosts.reduce((sum, value) => sum + value, 0) : null;
  const warehouseCapacity = warehouses.reduce((sum, warehouse) => sum + (warehouse.capacityUnits || 0), 0);
  const warehouseUnits = warehouses.reduce((sum, warehouse) => sum + (warehouse.currentUnits || 0), 0);
  const warehouseUtilization = warehouseCapacity > 0 ? `${Math.round((warehouseUnits / warehouseCapacity) * 100)}%` : "Unavailable";

  return (
    <div className="space-y-6">
      {/* Tactical KPI Stream */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Active Disruptions"
          value={activeIncidents.length}
          subtitle="Hotspots Flagged"
          change={activeIncidents.length > 0 ? `${activeIncidents.length} active` : "No active disruptions"}
          trend={activeIncidents.length > 0 ? "down" : "up"}
          status={activeIncidents.length > 0 ? "CRITICAL" : "HEALTHY"}
          icon={AlertTriangle}
          variant={activeIncidents.length > 0 ? "critical" : "default"}
        />
        <MetricTile
          title="SLA Risk Exposure"
          value={totalFinancialLiability == null ? "Unavailable" : `$${(totalFinancialLiability / 1000).toFixed(1)}k`}
          subtitle="Recorded incident estimates"
          change={knownIncidentCosts.length ? `${knownIncidentCosts.length} recorded estimate(s)` : "No cost estimates recorded"}
          trend="neutral"
          status="NEUTRAL"
          icon={DollarSign}
          variant="default"
        />
        <MetricTile
          title="Scenarios Evaluated"
          value={simulations.length}
          subtitle="Alternative plans computed"
          change="Available for comparison"
          trend="up"
          status="HEALTHY"
          icon={GitBranch}
          variant="default"
        />
        <MetricTile
          title="Warehouse Dock Balance"
          value={warehouseUtilization}
          subtitle="Recorded capacity utilization"
          change={`${warehouses.length} workspace location(s)`}
          trend="neutral"
          status="NEUTRAL"
          icon={Building2}
          variant="default"
        />
      </div>

      {/* Main Incident Commander Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Urgent Incident Queue */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile">
            <CardHeader className="pb-3 border-b border-nexus-outline/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                      Operational Attention Queue
                    </CardTitle>
                    <CardDescription className="text-xs text-stone-500">
                      Exceptions requiring intervention, prioritized by estimated delay impact
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="critical" className="font-mono text-[10px]">
                    {activeIncidents.length} Active
                  </Badge>
                  {onOpenCreateIncident && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenCreateIncident}
                      className="font-mono text-[11px] h-7 px-2 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                    >
                      + Log Incident
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5 max-h-[440px] overflow-y-auto">
              {activeIncidents.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-nexus-on-surface-variant space-y-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
                  <p>All corridors operating normally. Zero active SLA breaches.</p>
                  {onOpenCreateIncident && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onOpenCreateIncident}
                      className="font-mono text-xs shadow-tactile mx-auto"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-500" />
                      Report Corridor Disruption
                    </Button>
                  )}
                </div>
              ) : (
                activeIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <motion.div
                      key={inc.id}
                      onClick={() => {
                        setSelectedIncident(inc);
                        tactileAudio.playClick();
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-nexus-surface-container-highest border-nexus-secondary shadow-md"
                          : "bg-nexus-surface-container-high/60 border-nexus-outline/20 hover:border-nexus-outline/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-nexus-on-surface">
                              {inc.title}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                              {inc.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-nexus-on-surface-variant line-clamp-2">
                            {inc.summary}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-extrabold text-rose-600 dark:text-rose-400 block">
                            {inc.costEstimate == null ? "Not recorded" : `$${inc.costEstimate.toLocaleString()}`}
                          </span>
                          <span className="text-[10px] font-mono text-nexus-on-surface-variant flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" /> {inc.delayMinutes == null ? "Delay unavailable" : `${inc.delayMinutes}m delay`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile">
            <CardHeader className="pb-3 border-b border-nexus-outline/20">
              <CardTitle className="text-sm">Incident context</CardTitle>
              <CardDescription>Review recorded information and create a planning estimate from assigned route data.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {selectedIncident ? <>
                <div><div className="font-semibold text-nexus-on-surface">{selectedIncident.title}</div><p className="mt-1 text-sm text-nexus-on-surface-variant">{selectedIncident.summary}</p></div>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div><span className="text-nexus-on-surface-variant">Reported delay</span><p className="font-medium">{selectedIncident.delayMinutes == null ? "Not recorded" : `${selectedIncident.delayMinutes} min`}</p></div>
                  <div><span className="text-nexus-on-surface-variant">Cost estimate</span><p className="font-medium">{selectedIncident.costEstimate == null ? "Not recorded" : `$${selectedIncident.costEstimate.toLocaleString()}`}</p></div>
                  <div><span className="text-nexus-on-surface-variant">Cause</span><p className="font-medium">{selectedIncident.rootCause || "Not recorded"}</p></div>
                  <div><span className="text-nexus-on-surface-variant">Affected asset</span><p className="font-medium">{selectedIncident.affectedEntityName || "Not recorded"}</p></div>
                </div>
                {canRunSimulations && <Link href={`/simulations/new?incidentId=${encodeURIComponent(selectedIncident.id)}`}>
                  <Button variant="outline" size="sm" className="font-mono text-xs"><GitBranch className="mr-1 h-3.5 w-3.5"/>Create planning estimate</Button>
                </Link>}
                <p className="text-xs text-nexus-on-surface-variant">Estimates do not change live dispatch. Dispatch integration is not configured.</p>
              </> : <p className="py-12 text-center text-sm text-nexus-on-surface-variant">Select an incident to review its recorded details.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Real-Time Operational Event Feed */}
      {livePulse.length > 0 && (
        <Card className="border-nexus-outline/30 shadow-tactile overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-nexus-outline/20 bg-nexus-surface-container-high/30 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-on-surface">
                Live Operations & Dispatch Stream
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-nexus-on-surface-variant">Connected to SSE Telemetry Channel</span>
          </CardHeader>
          <CardContent className="p-3 divide-y divide-nexus-outline/10 space-y-0 text-xs">
            {livePulse.map((item) => (
              <div key={item.id} className="py-2.5 px-2 flex items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={item.severity === "CRITICAL" ? "critical" : item.severity === "SUCCESS" ? "healthy" : "neutral"} className="text-[10px] font-mono shrink-0">
                    {item.eventType}
                  </Badge>
                  <div>
                    <span className="font-semibold text-nexus-on-surface block sm:inline mr-2">{item.title}:</span>
                    <span className="text-nexus-on-surface-variant text-[11px]">{item.message}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-nexus-on-surface-variant shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
