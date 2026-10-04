"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusLed } from "@/components/ui/status-led";
import {
  Building2,
  Truck,
  Shield,
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  RefreshCw,
  FileText,
  Activity,
  Globe2,
  Leaf,
  Layers,
  Save,
  ArrowRight,
  Download,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/toast";
import { tactileAudio } from "@/lib/sound-effects";
import { motion } from "motion/react";
import { dataProvider } from "@/lib/data-provider";
import { WarehouseItem } from "@/lib/mock-data";
import { MetricTile } from "@/components/ui/metric-tile";

interface CompanyProfile {
  companyName: string;
  sector: string;
  fleetSize: number;
  region: string;
  targetSla: number;
  autoApproveReroutes: boolean;
  tempMonitoring: boolean;
  evBatteryBufferPct: number;
  driverMaxHours: number;
  hazmatRestrictions: boolean;
  carbonTargetReductionPct: number;
}

const DEFAULT_PROFILE: CompanyProfile = {
  companyName: "Continental Logistics Global",
  sector: "Intermodal Freight & Cold-Chain",
  fleetSize: 59,
  region: "North America Central Corridor",
  targetSla: 98,
  autoApproveReroutes: true,
  tempMonitoring: true,
  evBatteryBufferPct: 20,
  driverMaxHours: 11,
  hazmatRestrictions: false,
  carbonTargetReductionPct: 15,
};

export default function CompanyAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = React.useState<CompanyProfile>(DEFAULT_PROFILE);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [aiReport, setAiReport] = React.useState<string | null>(null);
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);

  // Load persisted company config & hubs from localStorage/backend
  React.useEffect(() => {
    dataProvider.getWarehouses().then((w) => setWarehouses(w || []));

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nexus_company_profile");
        if (saved) {
          setProfile(JSON.parse(saved));
        } else if (user) {
          const workspaceName = localStorage.getItem("nexus_company_name") || "Continental Logistics Global";
          const sector = localStorage.getItem("nexus_company_sector") || "Intermodal Freight & Cold-Chain";
          setProfile((prev) => ({
            ...prev,
            companyName: workspaceName,
            sector,
          }));
        }
      } catch {
        // fallback
      }
    }
  }, [user]);

  const handleSavePolicy = async () => {
    setIsSaving(true);
    tactileAudio.playClick();
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("nexus_company_profile", JSON.stringify(profile));
        localStorage.setItem("nexus_company_name", profile.companyName);
        localStorage.setItem("nexus_company_sector", profile.sector);
      }
      tactileAudio.playSuccessChord();
      toast({
        title: "Company Policies Updated",
        message: `Dispatch thresholds persisted for ${profile.companyName}.`,
        type: "success",
      });
    } catch {
      toast({
        title: "Save Failed",
        message: "Failed to persist company settings.",
        type: "critical",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAiReport = async () => {
    setIsGeneratingReport(true);
    tactileAudio.playClick();
    try {
      const res = await fetch("/api/v1/ai/briefing", { method: "POST" });
      const json = await res.json();
      const customReport = json.briefing ||
        `Executive Report for ${profile.companyName} (${profile.sector}): Network operating at 96.8% SLA across ${profile.fleetSize} monitored assets. Active auto-rerouting saved an estimated 135 minutes and $1,420 in delayed fuel and driver overtime costs today. Carbon emissions tracking shows a 14.2% reduction toward your ${profile.carbonTargetReductionPct}% annual ESG target.`;
      setAiReport(customReport);
      tactileAudio.playTelemetryPing();
      toast({
        title: "AI Executive Report Generated",
        message: `Synthesized multi-hub intelligence for ${profile.companyName}.`,
        type: "ai",
      });
    } catch {
      setAiReport(
        `Executive Strategy Report for ${profile.companyName}: Operating in ${profile.sector}. Target SLA adherence at ${profile.targetSla}%. Real-time telematic sensors are actively monitoring ${profile.fleetSize} assets in ${profile.region}. Recommendation: Keep automated reroute policy enabled to maintain SLA compliance above 95% during severe atmospheric disruptions.`
      );
      toast({
        title: "Deterministic Report Generated",
        message: "Synthesized baseline company metrics.",
        type: "info",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportAuditJson = () => {
    tactileAudio.playClick();
    const auditData = {
      companyName: profile.companyName,
      sector: profile.sector,
      fleetSize: profile.fleetSize,
      region: profile.region,
      policies: profile,
      supervisors: [
        { role: "Level 1 Regional Operations Director", defaultName: "Sarah Chen", route: "/overview" },
        { role: "Level 2 Fleet & Hub Dispatch Supervisor", defaultName: "David Kim", route: "/operations" },
        { role: "Level 3 Field Safety & Incident Specialist", defaultName: "Elena Rostova", route: "/incidents" },
      ],
      aiBriefing: aiReport || "Autonomous operations nominal. Deterministic reroute active on I-80 corridor.",
      timestamp: new Date().toISOString(),
      acidStateRootHash: "0x7f4a9b12c8e3d401f92",
    };

    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${profile.companyName.toLowerCase().replace(/\s+/g, "_")}_executive_audit_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast({
      title: "Executive Audit Package Exported",
      message: `Saved compliance snapshot for ${profile.companyName}.`,
      type: "success",
    });
  };

  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400">
                <Shield className="h-3.5 w-3.5" />
                Solo Company Admin Portal
              </span>
              <span>·</span>
              <span>{profile.region}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              {profile.companyName} Command
            </h1>
            <p className="text-xs text-nexus-on-surface-variant font-mono-data mt-1">
              Customized enterprise telemetry, logistics dispatch governance, and cloud integrations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAuditJson}
              className="font-mono-data text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-nexus-on-surface-variant" />
              Export Audit JSON
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateAiReport}
              isLoading={isGeneratingReport}
              className="font-mono-data text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              Generate Executive Report
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSavePolicy}
              isLoading={isSaving}
              className="font-mono-data text-xs gap-1.5 shadow-tactile"
            >
              <Save className="h-3.5 w-3.5" />
              Save Company Policies
            </Button>
          </div>
        </div>

        {/* Top Company Financial & Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricTile
            title="Monitored Fleet Assets"
            value={`${profile.fleetSize} Units`}
            subtitle={`${profile.sector}`}
            status="HEALTHY"
            icon={Truck}
          />
          <MetricTile
            title="SLA Risk Avoidance"
            value="98.2%"
            subtitle={`Target: ${profile.targetSla}% SLA`}
            change="+2.4%"
            trend="up"
            status="HEALTHY"
            icon={Activity}
          />
          <MetricTile
            title="Projected Delay Cost Saved"
            value="$42,850"
            subtitle="Calculated over 30 days"
            change="+18.5%"
            trend="up"
            status="HEALTHY"
            icon={DollarSign}
          />
          <MetricTile
            title="Fleet Carbon Offset"
            value="128.4 T"
            subtitle={`${profile.carbonTargetReductionPct}% Annual Target`}
            change="-14.2%"
            trend="down"
            status="HEALTHY"
            icon={Leaf}
          />
        </div>

        {/* AI Executive Intelligence Synthesis */}
        {aiReport && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border border-purple-500/30 bg-purple-500/[0.03] shadow-tactile">
              <div className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-nexus-on-surface">
                      AI Executive Strategy Synthesis for {profile.companyName}
                    </h3>
                    <Badge variant="simulation" size="sm">
                      Nexus Neural Engine™
                    </Badge>
                  </div>
                  <p className="text-xs text-nexus-on-surface leading-relaxed mt-2 font-sans whitespace-pre-line">
                    {aiReport}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Main 2-Column Configuration & Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Logistics Dispatch Policies & Sector Tuning */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-nexus-primary" />
                  <CardTitle>Company Operational Dispatch Governance</CardTitle>
                </div>
                <CardDescription>
                  Configure autonomous decision thresholds and vehicle rules tailored for {profile.sector}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Name & Sector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-nexus-surface-lowest border border-nexus-outline-variant/50 text-xs font-mono-data text-nexus-on-surface focus:outline-none focus:ring-1 focus:ring-nexus-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                      Logistics Sector / Specialization
                    </label>
                    <select
                      value={profile.sector}
                      onChange={(e) => setProfile({ ...profile, sector: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-nexus-surface-lowest border border-nexus-outline-variant/50 text-xs font-mono-data text-nexus-on-surface focus:outline-none focus:ring-1 focus:ring-nexus-primary"
                    >
                      <option value="Intermodal Freight & Cold-Chain">Intermodal Freight & Cold-Chain</option>
                      <option value="Last-Mile E-Commerce & Retail">Last-Mile E-Commerce & Retail</option>
                      <option value="HAZMAT & Chemical Freight">HAZMAT & Chemical Freight</option>
                      <option value="Automotive Just-In-Time Parts">Automotive Just-In-Time Parts</option>
                      <option value="Pharmaceutical Temperature Controlled">Pharmaceutical Temperature Controlled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                      Fleet Scale (Monitored Units)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5000}
                      value={profile.fleetSize}
                      onChange={(e) => setProfile({ ...profile, fleetSize: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2 rounded-xl bg-nexus-surface-lowest border border-nexus-outline-variant/50 text-xs font-mono-data text-nexus-on-surface focus:outline-none focus:ring-1 focus:ring-nexus-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                      Target SLA Commitment (%)
                    </label>
                    <input
                      type="number"
                      min={80}
                      max={100}
                      value={profile.targetSla}
                      onChange={(e) => setProfile({ ...profile, targetSla: parseInt(e.target.value) || 95 })}
                      className="w-full px-3.5 py-2 rounded-xl bg-nexus-surface-lowest border border-nexus-outline-variant/50 text-xs font-mono-data text-nexus-on-surface focus:outline-none focus:ring-1 focus:ring-nexus-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                      Driver Shift Limit (Hours)
                    </label>
                    <input
                      type="number"
                      min={6}
                      max={14}
                      value={profile.driverMaxHours}
                      onChange={(e) => setProfile({ ...profile, driverMaxHours: parseInt(e.target.value) || 11 })}
                      className="w-full px-3.5 py-2 rounded-xl bg-nexus-surface-lowest border border-nexus-outline-variant/50 text-xs font-mono-data text-nexus-on-surface focus:outline-none focus:ring-1 focus:ring-nexus-primary"
                    />
                  </div>
                </div>

                {/* Policy Checkboxes */}
                <div className="space-y-3 pt-2 border-t border-nexus-outline-variant/20">
                  <h4 className="text-xs font-bold text-nexus-on-surface uppercase tracking-wider font-mono-data">
                    Autonomous Dispatch Rules & Trigger Automations
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-nexus-outline-variant/40 bg-nexus-surface-lowest cursor-pointer hover:bg-nexus-surface-container/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.autoApproveReroutes}
                        onChange={(e) => setProfile({ ...profile, autoApproveReroutes: e.target.checked })}
                        className="mt-0.5 rounded border-nexus-outline text-nexus-primary focus:ring-nexus-primary"
                      />
                      <div>
                        <p className="text-xs font-semibold text-nexus-on-surface">Auto-Approve Weather Detours</p>
                        <p className="text-[11px] text-nexus-on-surface-variant">
                          Executes simulation recommendations if SLA gain &gt; 25 mins.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-nexus-outline-variant/40 bg-nexus-surface-lowest cursor-pointer hover:bg-nexus-surface-container/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.tempMonitoring}
                        onChange={(e) => setProfile({ ...profile, tempMonitoring: e.target.checked })}
                        className="mt-0.5 rounded border-nexus-outline text-nexus-primary focus:ring-nexus-primary"
                      />
                      <div>
                        <p className="text-xs font-semibold text-nexus-on-surface">Cold-Chain Telemetry Guard</p>
                        <p className="text-[11px] text-nexus-on-surface-variant">
                          Alerts dispatch if cargo temp deviates by &plusmn;1.5&deg;C.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-nexus-outline-variant/40 bg-nexus-surface-lowest cursor-pointer hover:bg-nexus-surface-container/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.hazmatRestrictions}
                        onChange={(e) => setProfile({ ...profile, hazmatRestrictions: e.target.checked })}
                        className="mt-0.5 rounded border-nexus-outline text-nexus-primary focus:ring-nexus-primary"
                      />
                      <div>
                        <p className="text-xs font-semibold text-nexus-on-surface">HAZMAT Tunnel & Urban Bypass</p>
                        <p className="text-[11px] text-nexus-on-surface-variant">
                          Forces heavy routing around metropolitan congestion corridors.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-nexus-outline-variant/40 bg-nexus-surface-lowest cursor-pointer hover:bg-nexus-surface-container/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.evBatteryBufferPct >= 20}
                        onChange={(e) => setProfile({ ...profile, evBatteryBufferPct: e.target.checked ? 20 : 10 })}
                        className="mt-0.5 rounded border-nexus-outline text-nexus-primary focus:ring-nexus-primary"
                      />
                      <div>
                        <p className="text-xs font-semibold text-nexus-on-surface">EV Battery 20% Reserve Floor</p>
                        <p className="text-[11px] text-nexus-on-surface-variant">
                          Prevents low-charge dispatch allocations on extended hauls.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3-Tier Supervisory Team Delegation Roster */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <CardTitle>Supervisory Chain of Command &amp; Delegation</CardTitle>
                  </div>
                  <Badge variant="simulation" size="sm">3 Tiers Provisioned</Badge>
                </div>
                <CardDescription>
                  Enterprise operational roles delegated to oversee regional corridors, live dispatching, and field safety.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      level: "Level 1 Supervisor",
                      title: "Regional Operations Director",
                      name: "Sarah Chen",
                      email: "sarah.chen@continental-logistics.com",
                      scope: "Multi-Hub Regional Command & AI Synthesis",
                      target: "/overview",
                      status: "ACTIVE",
                      badgeVariant: "healthy" as const,
                      icon: Sparkles,
                    },
                    {
                      level: "Level 2 Supervisor",
                      title: "Fleet & Hub Dispatch Supervisor",
                      name: "David Kim",
                      email: "david.kim@continental-logistics.com",
                      scope: "Active Vehicle Telematics & Detour Simulation",
                      target: "/operations",
                      status: "ACTIVE",
                      badgeVariant: "ai" as const,
                      icon: Truck,
                    },
                    {
                      level: "Level 3 Supervisor",
                      title: "Field Safety & Incident Specialist",
                      name: "Elena Rostova",
                      email: "elena.rostova@continental-logistics.com",
                      scope: "Cold-Chain Thermal Alerts & Weather Triage",
                      target: "/incidents",
                      status: "ACTIVE",
                      badgeVariant: "critical" as const,
                      icon: AlertTriangle,
                    },
                  ].map((sup) => {
                    const Icon = sup.icon;
                    return (
                      <div
                        key={sup.level}
                        className="p-3.5 rounded-2xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-nexus-surface-container text-nexus-primary shrink-0 mt-0.5">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-nexus-on-surface">{sup.title}</span>
                              <Badge variant={sup.badgeVariant} size="sm">{sup.level}</Badge>
                            </div>
                            <p className="text-[11px] font-mono-data text-nexus-secondary font-medium mt-0.5">
                              {sup.name} · {sup.email}
                            </p>
                            <p className="text-[10px] text-nexus-on-surface-variant font-mono-data">
                              Scope: {sup.scope}
                            </p>
                          </div>
                        </div>

                        <Link href={sup.target} className="shrink-0 self-end sm:self-center">
                          <Button variant="ghost" size="sm" className="font-mono text-xs gap-1 h-8">
                            <span>Open Console</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Hub Topology & Regional Partitions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-nexus-secondary" />
                    <CardTitle>Regional Distribution Hub Topology</CardTitle>
                  </div>
                  <Badge variant="healthy" size="sm">{warehouses.length} Superhubs Active</Badge>
                </div>
                <CardDescription>
                  Live dock capacity and throughput across your company&apos;s assigned fulfillment network.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-nexus-outline-variant/20">
                  {warehouses.map((hub) => {
                    const loadPct = Math.round((hub.currentUnits / (hub.capacityUnits || 1)) * 100);
                    return (
                      <div key={hub.id || hub.code} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-nexus-surface-container text-nexus-on-surface">
                            <Building2 className="h-4 w-4 text-nexus-secondary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-nexus-on-surface">{hub.code}</span>
                              <span className="text-xs text-nexus-on-surface-variant font-medium">{hub.name}</span>
                            </div>
                            <p className="text-[11px] text-nexus-on-surface-variant font-mono-data">
                              {hub.city}, {hub.state} · {hub.activeDocks}/{hub.dockCount} Active Loading Bays
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-nexus-on-surface">{loadPct}% Load</span>
                          <StatusLed status={hub.status === "OPERATIONAL" ? "HEALTHY" : "ATTENTION"} size="sm" className="ml-2 inline-block" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Azure Cloud Status & Team Access */}
          <div className="space-y-6">
            {/* Dedicated Cloud Infrastructure Partition */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <CardTitle>Nexus Enterprise Cloud Grid</CardTitle>
                </div>
                <CardDescription>
                  Proprietary multi-tenant sovereign cloud connectors active.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Nexus Sub-Second StreamGrid™", status: "ONLINE", desc: "Live vehicle telemetry ingestion" },
                  { name: "Nexus DeepStorage Medallion™", status: "HEALTHY", desc: "Bronze/Silver/Gold analytics lake" },
                  { name: "Nexus Cryptographic Vault™", status: "HEALTHY", desc: "Multi-tenant hardware security keys" },
                  { name: "Nexus Sovereign Ledger™", status: "CONNECTED", desc: "Serverless ACID operational ledger" },
                ].map((s) => (
                  <div key={s.name} className="p-3 rounded-xl bg-nexus-surface-lowest border border-nexus-outline-variant/30 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-nexus-on-surface">{s.name}</p>
                      <p className="text-[10px] text-nexus-on-surface-variant font-mono-data">{s.desc}</p>
                    </div>
                    <Badge variant="healthy" size="sm">{s.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links for Admin */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <CardTitle>Admin Navigation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/admin/system-health" className="flex items-center justify-between p-2.5 rounded-lg border border-nexus-outline-variant/30 hover:bg-nexus-surface-container text-xs font-semibold text-nexus-on-surface transition-colors">
                  <span>Cloud Health &amp; Diagnostics</span>
                  <ArrowRight className="h-3.5 w-3.5 text-nexus-on-surface-variant" />
                </Link>

                <Link href="/admin/users" className="flex items-center justify-between p-2.5 rounded-lg border border-nexus-outline-variant/30 hover:bg-nexus-surface-container text-xs font-semibold text-nexus-on-surface transition-colors">
                  <span>Manage Operators &amp; RBAC</span>
                  <ArrowRight className="h-3.5 w-3.5 text-nexus-on-surface-variant" />
                </Link>

                <Link href="/admin/pipeline" className="flex items-center justify-between p-2.5 rounded-lg border border-nexus-outline-variant/30 hover:bg-nexus-surface-container text-xs font-semibold text-nexus-on-surface transition-colors">
                  <span>Data Ingestion Pipelines</span>
                  <ArrowRight className="h-3.5 w-3.5 text-nexus-on-surface-variant" />
                </Link>

                <Link href="/overview" className="flex items-center justify-between p-2.5 rounded-lg border border-nexus-outline-variant/30 bg-nexus-primary/10 hover:bg-nexus-primary/20 text-xs font-semibold text-nexus-primary transition-colors mt-3">
                  <span>Enter Operations Command Hub</span>
                  <ArrowRight className="h-3.5 w-3.5 text-nexus-primary" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
