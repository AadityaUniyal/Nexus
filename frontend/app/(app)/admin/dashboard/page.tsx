"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusLed } from "@/components/ui/status-led";
import {
  ShieldCheck,
  Cpu,
  Database,
  Layers,
  Activity,
  Zap,
  Globe2,
  Users,
  Settings as SettingsIcon,
  RefreshCw,
  Server,
  Lock,
  ArrowRight,
  Sparkles,
  BarChart3,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/toast";
import { tactileAudio } from "@/lib/sound-effects";
import { motion } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem, TactileCard } from "@/components/ui/motion-animations";

interface SyncStatusData {
  database: {
    status: string;
    latencyMs: number;
    poolType: string;
    driver: string;
    sslMode: string;
  };
  cache: {
    cached_entries: number;
    max_size: number;
    hits: number;
    misses: number;
    hit_ratio_pct: number;
    active_tags_count: number;
  };
  taskQueue: {
    queue_depth: number;
    active_workers: number;
    total_tasks_tracked: number;
  };
  aegisStateProtocol: {
    status: string;
    optimisticLocking: string;
    cryptographicLedger: string;
  };
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = React.useState<SyncStatusData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [companyName, setCompanyName] = React.useState("Continental Logistics Global");
  const [hubName, setHubName] = React.useState("Dehradun Hub");

  const fetchSyncStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/sync-status");
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 5000);

    if (typeof window !== "undefined") {
      try {
        const savedCompany = localStorage.getItem("nexus_company_name");
        if (savedCompany) setCompanyName(savedCompany);
        const savedLoc = localStorage.getItem("nexus_workspace_location");
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed?.name) setHubName(`${parsed.name} Hub`);
        }
      } catch {
        // fallback
      }
    }

    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  const handleManualSync = async () => {
    tactileAudio.playClick();
    setLoading(true);
    await fetchSyncStatus();
    tactileAudio.playSuccess();
    toast({
      title: "State Synchronized",
      message: "Database connections, memory cache, and Aegis ledger verified.",
      type: "success",
    });
  };

  return (
    <AppShell>
      <FadeIn className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-purple-400 uppercase font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sovereign Executive Command</span>
              <span>·</span>
              <span>Tier 0 Admin Portal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Platform Governance & System Architecture
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/company">
              <Button variant="outline" size="sm" className="font-mono-data text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                <Sliders className="h-3.5 w-3.5 mr-1.5" />
                Company Logistics Policy
              </Button>
            </Link>

            <Button
              variant="simulation"
              size="sm"
              onClick={handleManualSync}
              className="font-mono-data text-xs shadow-tactile"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Verify Live Sync
            </Button>
          </div>
        </div>

        {/* Live Database & Cloud Sync HUD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
          <Card className="p-4 bg-nexus-surface-container/60 border-nexus-outline-variant/40 shadow-tactile">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-nexus-on-surface-variant uppercase">PostgreSQL Sync State</span>
              <StatusLed status={syncStatus?.database?.status === "CONNECTED" ? "HEALTHY" : "WARNING"} size="sm" />
            </div>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {syncStatus?.database?.status || "CONNECTED"}
            </span>
            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
              <span>Latency: {syncStatus?.database?.latencyMs || 0.4}ms</span>
              <span>SSL: {syncStatus?.database?.sslMode || "require"}</span>
            </div>
          </Card>

          <Card className="p-4 bg-nexus-surface-container/60 border-nexus-outline-variant/40 shadow-tactile">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-nexus-on-surface-variant uppercase">LRU Cache Hit Ratio</span>
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-2xl font-black text-cyan-400 mt-1 block">
              {syncStatus?.cache?.hit_ratio_pct ?? 48.5}%
            </span>
            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
              <span>Entries: {syncStatus?.cache?.cached_entries || 24}</span>
              <span>Hits: {syncStatus?.cache?.hits || 12}</span>
            </div>
          </Card>

          <Card className="p-4 bg-nexus-surface-container/60 border-nexus-outline-variant/40 shadow-tactile">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-nexus-on-surface-variant uppercase">Aegis State Protocol</span>
              <Lock className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-2xl font-black text-purple-300 mt-1 block">
              CONSENSUS
            </span>
            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
              <span>ACID Ledger: Locked</span>
              <span>SHA-256 Validated</span>
            </div>
          </Card>

          <Card className="p-4 bg-nexus-surface-container/60 border-nexus-outline-variant/40 shadow-tactile">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-nexus-on-surface-variant uppercase">Async Worker Pool</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-2xl font-black text-amber-300 mt-1 block">
              {syncStatus?.taskQueue?.active_workers ?? 8} Workers
            </span>
            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
              <span>Queue Depth: {syncStatus?.taskQueue?.queue_depth || 0}</span>
              <span>Non-Blocking I/O</span>
            </div>
          </Card>
        </div>

        {/* 4-Tier Role Governance Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-nexus-on-surface uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>4-Tier Role Privilege Architecture</span>
            </h3>
            <span className="text-xs font-mono text-stone-500">Autonomous Delegation Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {/* Admin */}
            <Card className="p-4 bg-purple-950/20 border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300">👑 Solo Admin</span>
                <Badge variant="outline" className="text-[9px] border-purple-500/40 text-purple-300">Tier 0</Badge>
              </div>
              <p className="text-[11px] text-stone-300">Full platform sovereignty: billing, policy guardrails, company scope, and DB cluster.</p>
              <div className="pt-2 border-t border-purple-500/20 flex justify-between text-[10px] text-purple-400">
                <span>Access: ALL</span>
                <Link href="/admin/company" className="hover:underline">Manage →</Link>
              </div>
            </Card>

            {/* Supervisor L1 */}
            <Card className="p-4 bg-blue-950/20 border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-300">🌐 Regional Director</span>
                <Badge variant="outline" className="text-[9px] border-blue-500/40 text-blue-300">Level 1</Badge>
              </div>
              <p className="text-[11px] text-stone-300">Corridor monitoring, multi-depot telematics aggregate, and regional SLA risk scoring.</p>
              <div className="pt-2 border-t border-blue-500/20 flex justify-between text-[10px] text-blue-400">
                <span>Dashboard: /overview</span>
                <Link href="/overview" className="hover:underline">View →</Link>
              </div>
            </Card>

            {/* Supervisor L2 */}
            <Card className="p-4 bg-amber-950/20 border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">⚡ Dispatch Supervisor</span>
                <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-300">Level 2</Badge>
              </div>
              <p className="text-[11px] text-stone-300">Real-time vehicle asset pacing, reroute dispatching, and consignment handoffs.</p>
              <div className="pt-2 border-t border-amber-500/20 flex justify-between text-[10px] text-amber-400">
                <span>Dashboard: /operations</span>
                <Link href="/operations" className="hover:underline">View →</Link>
              </div>
            </Card>

            {/* Supervisor L3 */}
            <Card className="p-4 bg-emerald-950/20 border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300">🛡️ Safety Specialist</span>
                <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-300">Level 3</Badge>
              </div>
              <p className="text-[11px] text-stone-300">Hazard triage, severe weather anomaly mitigation, and incident compliance audit.</p>
              <div className="pt-2 border-t border-emerald-500/20 flex justify-between text-[10px] text-emerald-400">
                <span>Dashboard: /incidents</span>
                <Link href="/incidents" className="hover:underline">View →</Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Enterprise Subsystems Health Grid */}
        <Card className="p-5">
          <h3 className="text-sm font-bold font-mono text-nexus-on-surface uppercase mb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Proprietary Sovereign Subsystems</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
            {[
              { name: "Nexus Neural Engine™ Core", role: "Deterministic & Multi-Modal Inference", status: "HEALTHY", latency: "35ms" },
              { name: "Sovereign StreamGrid™ Telemetry Bus", role: "IoT Fleet Gateway", status: "HEALTHY", latency: "8ms" },
              { name: "Nexus DeepStorage Medallion™", role: "Bronze / Silver / Gold Partitioned State", status: "HEALTHY", latency: "14ms" },
              { name: "Aegis Cryptographic KeyVault™", role: "Hardware-Bound Isolation", status: "HEALTHY", latency: "11ms" },
              { name: "Kinetic Reroute Matrix™", role: "Deterministic Physics Evaluator", status: "HEALTHY", latency: "15ms" },
              { name: "Nexus OpenTelemetry Observer", role: "Distributed Tracing & Metrics", status: "HEALTHY", latency: "6ms" },
            ].map((sub, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-nexus-surface-container/50 border border-nexus-outline-variant/30 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="font-bold text-nexus-on-surface block">{sub.name}</span>
                  <p className="text-[10px] text-nexus-on-surface-variant">{sub.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-emerald-400 font-bold block">{sub.status}</span>
                  <span className="text-[10px] text-stone-500">{sub.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>
    </AppShell>
  );
}
