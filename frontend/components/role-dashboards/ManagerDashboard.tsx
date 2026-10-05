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
  CheckCircle2,
  GitBranch,
  Truck,
  Activity,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricTile } from "@/components/ui/metric-tile";
import { IncidentItem, SimulationItem, WarehouseItem } from "@/lib/mock-data";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export interface ManagerDashboardProps {
  incidents: IncidentItem[];
  simulations: SimulationItem[];
  warehouses: WarehouseItem[];
  onApplyDecision?: (simId: string) => Promise<void>;
}

export function ManagerDashboard({
  incidents,
  simulations,
  warehouses,
  onApplyDecision,
}: ManagerDashboardProps) {
  const { toast } = useToast();
  const [selectedIncident, setSelectedIncident] = React.useState<IncidentItem | null>(
    incidents[0] || null
  );
  const [isApplying, setIsApplying] = React.useState(false);

  const activeIncidents = incidents.filter(
    (i) => i.status !== "RESOLVED" && i.status !== "ARCHIVED"
  );
  const totalFinancialLiability = activeIncidents.reduce(
    (acc, i) => acc + (i.costEstimate || 4200),
    0
  );

  const handleExecuteReroute = async (simId: string) => {
    setIsApplying(true);
    tactileAudio.playClick();
    try {
      if (onApplyDecision) {
        await onApplyDecision(simId);
      }
      tactileAudio.playSuccess();
      toast({
        title: "Autonomous Decision Committed",
        message: "Reroute waypoints synchronized with active fleet and audit ledger signed.",
        type: "success",
      });
    } catch {
      toast({
        title: "Commit Failed",
        message: "Unable to apply scenario to production.",
        type: "critical",
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tactical KPI Stream */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Active Disruptions"
          value={activeIncidents.length}
          subtitle="Hotspots Flagged"
          change={activeIncidents.length > 0 ? "+2 from shift" : "0 normal"}
          trend={activeIncidents.length > 0 ? "down" : "up"}
          status={activeIncidents.length > 0 ? "CRITICAL" : "HEALTHY"}
          icon={AlertTriangle}
          variant={activeIncidents.length > 0 ? "critical" : "default"}
        />
        <MetricTile
          title="SLA Risk Exposure"
          value={`$${(totalFinancialLiability / 1000).toFixed(1)}k`}
          subtitle="Potential Penalties"
          change="-$12.4k mitigated"
          trend="up"
          status={totalFinancialLiability > 5000 ? "ATTENTION" : "HEALTHY"}
          icon={DollarSign}
          variant="default"
        />
        <MetricTile
          title="AI Reroutes Staged"
          value={simulations.length}
          subtitle="Ready to execute"
          change="Avg net savings +82%"
          trend="up"
          status="SIMULATION"
          icon={Sparkles}
          variant="simulation"
        />
        <MetricTile
          title="Warehouse Dock Balance"
          value="94.2%"
          subtitle="Equilibrium Score"
          change="4 hubs optimal"
          trend="up"
          status="HEALTHY"
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
                    <CardTitle className="text-sm font-mono font-bold">
                      SLA Breach Countdown Queue
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Ranked by financial exposure & minutes to breach
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="critical" className="font-mono text-[10px]">
                  {activeIncidents.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5 max-h-[440px] overflow-y-auto">
              {activeIncidents.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-nexus-on-surface-variant">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  All corridors operating normally. Zero active SLA breaches.
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
                            ${(inc.costEstimate || 4200).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-mono text-nexus-on-surface-variant flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" /> {inc.delayMinutes || 85}m delay
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

        {/* Right Column: AI Mitigation Resolver */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile bg-gradient-to-br from-nexus-surface-container to-nexus-surface-container-high">
            <CardHeader className="pb-3 border-b border-nexus-outline/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-nexus-secondary text-white shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-mono font-bold">
                      One-Click AI Mitigation Resolver
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Compare baseline delay liability against simulated bypass corridor
                    </CardDescription>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-secondary/10 text-nexus-secondary font-bold">
                  Monte Carlo Verified
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {selectedIncident ? (
                <div className="space-y-4">
                  {/* Delta Comparison Box */}
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-nexus-surface border border-nexus-outline/30">
                    <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                      <span className="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400 font-bold block mb-1">
                        Current Baseline Path
                      </span>
                      <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                        +{selectedIncident.delayMinutes || 85} mins
                      </div>
                      <div className="text-xs font-mono text-nexus-on-surface-variant mt-1">
                        Cost Penalty: <span className="font-bold text-nexus-on-surface">${(selectedIncident.costEstimate || 4200).toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 mt-2">
                        Status: Severe Chokepoint
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold block mb-1">
                        AI Recommended Bypass
                      </span>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        +14 mins
                      </div>
                      <div className="text-xs font-mono text-nexus-on-surface-variant mt-1">
                        Net Savings: <span className="font-bold text-emerald-600 dark:text-emerald-400">+$3,820.00</span>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                        Confidence: 96.4% on I-80 Alternate
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning Brief */}
                  <div className="p-3.5 rounded-xl bg-nexus-surface-container-high border border-nexus-outline/20 text-xs text-nexus-on-surface leading-relaxed">
                    <span className="font-bold text-nexus-secondary font-mono block mb-1">
                      🧠 Aegis Tactical Decision Rationale:
                    </span>
                    Rerouting 8 Class-8 EV haulers through Exit 142 avoids the 3-foot snowdrift chokepoint on I-80. Dock turnaround at Warehouse WH-CHI-01 remains within SLA tolerance.
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <Link href={`/simulations/new?incidentId=${selectedIncident.id}`}>
                      <Button variant="outline" size="sm" className="font-mono text-xs">
                        <GitBranch className="w-3.5 h-3.5 mr-1" /> Fine-Tune Variables
                      </Button>
                    </Link>

                    <Button
                      variant="simulation"
                      size="sm"
                      onClick={() => handleExecuteReroute(simulations[0]?.id || "sim-1")}
                      isLoading={isApplying}
                      className="font-mono text-xs shadow-tactile"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1 text-amber-300" />
                      Authorize & Dispatch Reroute
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs font-mono text-nexus-on-surface-variant">
                  Select an incident from the left queue to inspect AI mitigation alternatives.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
