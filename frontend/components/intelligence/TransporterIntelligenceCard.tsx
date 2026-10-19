"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  Clock,
  Fuel,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  TrendingDown,
  Sparkles,
  Leaf,
  Layers,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/lib/api/auth-fetch";

interface DetentionForecastItem {
  hubId: string;
  hubCode: string;
  hubName: string;
  city: string;
  dockUtilizationPct: number;
  activeDocks: string;
  expectedDwellMinutes: number;
  detentionProbabilityPct: number;
  projectedDemurrageUsd: number;
  riskLevel: "CRITICAL" | "ELEVATED" | "NOMINAL";
  optimalDockingWindow: string;
}

interface ReturnLoadItem {
  vehicleId: string;
  vehicleCode: string;
  driverName: string;
  currentLocation: string;
  returnOrderNumber: string;
  returnCustomer: string;
  returnDestination: string;
  estimatedRevenueUsd: number;
  deadheadKmSaved: number;
  projectedFuelSavedUsd: number;
  co2AvoidedKg: number;
  feasibilityScorePct: number;
}

export function TransporterIntelligenceCard() {
  const [activeTab, setActiveTab] = React.useState<"detention" | "returnLoads">("detention");
  const [detentionForecasts, setDetentionForecasts] = React.useState<DetentionForecastItem[]>([]);
  const [returnLoads, setReturnLoads] = React.useState<ReturnLoadItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchIntelligence = React.useCallback(async () => {
    setLoading(true);
    try {
      const [detentionRes, returnRes] = await Promise.allSettled([
        authFetch<{ forecasts: DetentionForecastItem[] }>("/api/v1/intelligence/detention-forecast"),
        authFetch<{ matches: ReturnLoadItem[] }>("/api/v1/intelligence/return-loads"),
      ]);

      if (detentionRes.status === "fulfilled" && detentionRes.value?.forecasts) {
        setDetentionForecasts(detentionRes.value.forecasts);
      }
      if (returnRes.status === "fulfilled" && returnRes.value?.matches) {
        setReturnLoads(returnRes.value.matches);
      }
    } catch {
      // Soft fallback for offline/demo modes
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  return (
    <Card className="border-nexus-outline/30 shadow-tactile overflow-hidden bg-nexus-surface/60 backdrop-blur-md">
      <CardHeader className="py-3 px-4 border-b border-nexus-outline/20 bg-nexus-surface-container-high/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-on-surface">
              Ground-Level Transporter Intelligence
            </CardTitle>
            <CardDescription className="text-[11px] text-nexus-on-surface-variant">
              Predictive dock dwell times, detention demurrage clocks & empty-haul elimination
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg p-0.5 bg-black/5 dark:bg-white/5 border border-nexus-outline/20 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("detention")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === "detention"
                  ? "bg-white dark:bg-zinc-800 text-nexus-on-surface shadow-xs font-semibold"
                  : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
              }`}
            >
              Dock Detention Radar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("returnLoads")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === "returnLoads"
                  ? "bg-white dark:bg-zinc-800 text-nexus-on-surface shadow-xs font-semibold"
                  : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
              }`}
            >
              Return-Load Optimizer
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchIntelligence}
            disabled={loading}
            className="h-7 w-7 p-0"
            title="Refresh Intelligence Predictions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {activeTab === "detention" && (
          <div className="space-y-3">
            {detentionForecasts.length === 0 ? (
              <div className="py-8 text-center text-xs text-nexus-on-surface-variant font-mono">
                {loading ? "Computing facility dwell and dock congestion models..." : "No facilities registered in this workspace."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {detentionForecasts.map((hub) => (
                  <motion.div
                    key={hub.hubId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl border border-nexus-outline/20 bg-nexus-surface-container-low/40 hover:border-nexus-outline/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="font-semibold text-xs text-nexus-on-surface block leading-tight">
                            {hub.hubName}
                          </span>
                          <span className="text-[10px] font-mono text-nexus-on-surface-variant">
                            {hub.city} · {hub.hubCode}
                          </span>
                        </div>
                        <Badge
                          variant={
                            hub.riskLevel === "CRITICAL"
                              ? "critical"
                              : hub.riskLevel === "ELEVATED"
                              ? "neutral"
                              : "healthy"
                          }
                          className="text-[9px] font-mono shrink-0 uppercase"
                        >
                          {hub.riskLevel} DETENTION
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-nexus-outline/10 text-xs">
                        <div>
                          <span className="text-[10px] text-nexus-on-surface-variant block">Dock Utilization</span>
                          <span className="font-mono font-bold text-nexus-on-surface">{hub.dockUtilizationPct}%</span>
                          <span className="text-[9px] text-nexus-on-surface-variant block">({hub.activeDocks} docks active)</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-nexus-on-surface-variant block">Est. Dwell Time</span>
                          <span className="font-mono font-bold text-nexus-on-surface flex items-center gap-1">
                            <Clock className="w-3 h-3 text-nexus-on-surface-variant" /> {hub.expectedDwellMinutes} min
                          </span>
                          <span className="text-[9px] text-nexus-on-surface-variant block">Free window: 120 min</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-nexus-on-surface-variant">Detention Probability</span>
                        <span className="font-mono font-bold text-nexus-on-surface">{hub.detentionProbabilityPct}%</span>
                      </div>
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full ${
                            hub.detentionProbabilityPct > 60
                              ? "bg-rose-500"
                              : hub.detentionProbabilityPct > 35
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(hub.detentionProbabilityPct, 100)}%` }}
                        />
                      </div>

                      {hub.projectedDemurrageUsd > 0 && (
                        <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md flex items-center justify-between mb-1">
                          <span>Demurrage Exposure:</span>
                          <span className="font-bold">${hub.projectedDemurrageUsd.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-nexus-on-surface-variant font-mono truncate">
                        Window: <span className="text-nexus-on-surface">{hub.optimalDockingWindow}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "returnLoads" && (
          <div className="space-y-3">
            {returnLoads.length === 0 ? (
              <div className="py-8 text-center text-xs text-nexus-on-surface-variant font-mono">
                {loading ? "Matching returning trucks with pending outbound loads..." : "No deadhead backhaul opportunities detected."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {returnLoads.map((match, idx) => (
                  <motion.div
                    key={`${match.vehicleId}-${idx}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl border border-nexus-outline/20 bg-nexus-surface-container-low/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-nexus-on-surface">
                            {match.vehicleCode}
                          </span>
                          <span className="text-[10px] text-nexus-on-surface-variant">
                            ({match.driverName})
                          </span>
                        </div>
                        <Badge variant="healthy" className="text-[9px] font-mono">
                          {match.feasibilityScorePct}% MATCH
                        </Badge>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-nexus-outline/10 text-xs space-y-1 mb-2">
                        <div className="flex items-center justify-between text-nexus-on-surface">
                          <span className="font-medium text-[11px]">Return Load: {match.returnOrderNumber}</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +${match.estimatedRevenueUsd.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[10px] text-nexus-on-surface-variant flex items-center justify-between">
                          <span>Shipper: {match.returnCustomer}</span>
                          <span>Dest: {match.returnDestination}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-nexus-outline/10 text-[10px] font-mono text-center">
                      <div>
                        <span className="text-nexus-on-surface-variant block">Deadhead Cut</span>
                        <span className="font-bold text-nexus-on-surface flex items-center justify-center gap-0.5">
                          <TrendingDown className="w-2.5 h-2.5 text-emerald-500" /> {match.deadheadKmSaved} km
                        </span>
                      </div>
                      <div>
                        <span className="text-nexus-on-surface-variant block">Fuel Saved</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                          <Fuel className="w-2.5 h-2.5" /> ${match.projectedFuelSavedUsd.toFixed(0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-nexus-on-surface-variant block">CO2 Avoided</span>
                        <span className="font-bold text-nexus-on-surface flex items-center justify-center gap-0.5">
                          <Leaf className="w-2.5 h-2.5 text-emerald-500" /> {match.co2AvoidedKg} kg
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
