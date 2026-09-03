"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusLed } from "@/components/ui/status-led";
import {
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  Shield,
  Activity,
  FileText,
  User,
} from "lucide-react";
import { IncidentItem } from "@/lib/mock-data";
import { dataProvider } from "@/lib/data-provider";
import { formatCurrency, formatDateTime, formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const STATE_STEPS = [
  "DETECTED",
  "ACKNOWLEDGED",
  "INVESTIGATING",
  "SIMULATING",
  "ACTION_PENDING",
  "ACTION_APPLIED",
  "RESOLVED",
] as const;

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const incidentId = params?.id as string;

  const [incident, setIncident] = React.useState<IncidentItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    dataProvider.getIncident(incidentId)
      .then((inc) => {
        if (mounted) setIncident(inc);
      })
      .catch((err) => {
        console.error("Failed to fetch incident details:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [incidentId]);

  const currentStepIdx = incident && STATE_STEPS.indexOf(incident.status as any) !== -1
    ? STATE_STEPS.indexOf(incident.status as any)
    : 2;

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 font-mono text-sm text-nexus-on-surface-variant">
          Loading incident details...
        </div>
      </AppShell>
    );
  }

  if (!incident) {
    return (
      <AppShell>
        <div className="p-8 space-y-4 font-mono text-sm">
          <p className="text-nexus-on-surface">Incident '{incidentId}' was not found.</p>
          <Link href="/incidents">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="h-4 w-4" /> Back to Incidents
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const handleAdvanceStatus = async (nextStatus: IncidentItem["status"]) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/v1/incidents/${incident?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          note: `Advanced incident state machine to ${nextStatus}`,
          actorName: "Sarah Chen",
        }),
      });
      const json = await res.json();
      const incData = json.data || json;
      if (incData && incData.id) {
        setIncident(incData);
        toast({
          title: "Incident State Advanced",
          message: `Status updated to ${nextStatus}.`,
          type: nextStatus === "RESOLVED" ? "success" : "info",
        });
      }
    } catch {
      if (incident) {
        const updated = { ...incident, status: nextStatus };
        setIncident(updated);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (!incident) return null;

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-mono-data text-nexus-on-surface-variant hover:text-nexus-on-surface transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Incident Intelligence Center</span>
        </Link>

        {/* Header Summary */}
        <div className="p-6 rounded-2xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-data font-bold text-red-700 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  {incident.code}
                </span>
                <Badge
                  variant={incident.severity === "CRITICAL" ? "critical" : "attention"}
                  size="sm"
                >
                  {incident.severity} SEVERITY
                </Badge>
                <span className="text-xs text-nexus-on-surface-variant font-mono-data">
                  Logged {formatRelativeTime(incident.createdAt)}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-nexus-on-surface tracking-tight">
                {incident.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/simulations/new?incidentId=${incident.id}`}>
                <Button variant="simulation" size="sm" className="font-mono-data text-xs shadow-tactile">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Launch What-If Simulation
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-sm text-nexus-on-surface leading-relaxed">{incident.summary}</p>
        </div>

        {/* State Machine Workflow Stepper */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Incident Lifecycle State Machine</CardTitle>
            <span className="text-xs font-mono-data text-nexus-on-surface-variant">
              Current State: {incident.status}
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {STATE_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div
                    key={step}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? "bg-nexus-primary-container text-white border-black font-bold shadow-tactile"
                        : isPassed
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold"
                        : "bg-nexus-surface-container/50 border-nexus-outline-variant/20 text-nexus-outline"
                    }`}
                  >
                    <span className="block text-[10px] font-mono-data tracking-wider uppercase">
                      STEP {idx + 1}
                    </span>
                    <span className="text-xs font-mono-data mt-0.5 block truncate">{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Stepper Control Buttons */}
            <div className="mt-6 pt-4 border-t border-nexus-outline-variant/30 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono-data text-nexus-on-surface-variant">
                Transition to next operational stage:
              </span>
              <div className="flex items-center gap-2">
                {incident.status === "DETECTED" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAdvanceStatus("ACKNOWLEDGED")}
                    isLoading={isUpdating}
                  >
                    Acknowledge Anomaly
                  </Button>
                )}
                {incident.status === "ACKNOWLEDGED" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAdvanceStatus("INVESTIGATING")}
                    isLoading={isUpdating}
                  >
                    Begin Investigation
                  </Button>
                )}
                {incident.status === "INVESTIGATING" && (
                  <Button
                    size="sm"
                    variant="simulation"
                    onClick={() => handleAdvanceStatus("SIMULATING")}
                    isLoading={isUpdating}
                  >
                    Advance to Simulation
                  </Button>
                )}
                {incident.status === "SIMULATING" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAdvanceStatus("ACTION_PENDING")}
                    isLoading={isUpdating}
                  >
                    Propose Mitigation Action
                  </Button>
                )}
                {incident.status === "ACTION_PENDING" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAdvanceStatus("ACTION_APPLIED")}
                    isLoading={isUpdating}
                  >
                    Apply Action
                  </Button>
                )}
                {incident.status !== "RESOLVED" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAdvanceStatus("RESOLVED")}
                    isLoading={isUpdating}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Root Cause & AI Mitigation Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Root Cause Investigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-nexus-on-surface leading-relaxed">
                {incident.rootCause || "Telemetry data confirms environmental sensor threshold breach on the corridor."}
              </p>
              <div className="p-3 rounded-lg bg-nexus-surface-container/60 font-mono-data space-y-1.5 text-nexus-on-surface-variant">
                <div className="flex justify-between">
                  <span>Affected Asset:</span>
                  <span className="font-semibold text-nexus-on-surface">{incident.affectedEntityName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delay:</span>
                  <span className="font-semibold text-red-700">+{incident.delayMinutes} mins</span>
                </div>
                <div className="flex justify-between">
                  <span>Consignment Value:</span>
                  <span className="font-semibold text-nexus-on-surface">{formatCurrency(incident.costEstimate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="simulation-layer border border-purple-500/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-700" />
                <CardTitle className="text-sm">Groq AI Mitigation Synthesis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-nexus-on-surface leading-relaxed">
                {incident.aiAnalysis || "Recommend immediate reroute via southern bypass to save transit delay."}
              </p>
              <Link href={`/simulations/new?incidentId=${incident.id}`}>
                <Button variant="simulation" size="sm" className="w-full mt-2 font-mono-data text-xs">
                  Run Deterministic Simulation
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Audit & Telemetry Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 relative pl-4 border-l-2 border-nexus-outline-variant/40 ml-2">
              {incident.timeline.map((tl) => (
                <div key={tl.id} className="relative">
                  <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-nexus-primary border-2 border-nexus-surface" />
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-nexus-on-surface font-mono-data">{tl.status}</span>
                      <span className="text-[10px] text-nexus-on-surface-variant font-mono-data">
                        {formatDateTime(tl.createdAt)}
                      </span>
                    </div>
                    <p className="text-nexus-on-surface mt-1">{tl.note}</p>
                    <p className="text-[10px] text-nexus-on-surface-variant font-mono-data mt-0.5">
                      Actor: {tl.actorName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
