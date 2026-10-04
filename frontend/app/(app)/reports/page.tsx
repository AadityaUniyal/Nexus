"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Sparkles,
  Printer,
  CheckCircle2,
  ArrowRight,
  History,
  TrendingUp,
  ShieldCheck,
  MapPin,
  Clock,
  DollarSign,
  Leaf,
  Filter,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { FadeIn, StaggerContainer, StaggerItem, TactileCard } from "@/components/ui/motion-animations";

interface HistoricalService {
  id: string;
  tracking_code: string;
  origin: string;
  destination: string;
  distance_km: number;
  sector: string;
  status: string;
  completed_at: string;
  time_recovered_mins: number;
  cost_saved_usd: number;
  carbon_offset_kg: number;
  on_time_sla_met: boolean;
  cryptographic_proof: string;
}

interface HistoricalSummary {
  time_range_days: number;
  total_fulfilled_services: number;
  sla_compliance_rate_pct: number;
  total_cost_recovered_usd: number;
  total_carbon_offset_kg: number;
  avg_time_saved_per_trip_mins: number;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<"briefings" | "past_services" | "trends">("briefings");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [timeRangeDays, setTimeRangeDays] = React.useState(30);

  // Past Services data
  const [pastServices, setPastServices] = React.useState<HistoricalService[]>([]);
  const [historySummary, setHistorySummary] = React.useState<HistoricalSummary | null>(null);

  const [reportsList, setReportsList] = React.useState([
    {
      id: "rep-1",
      title: "Daily Operations Executive Briefing · Regional Hub",
      date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      type: "EXECUTIVE_BRIEF",
      summary: "80% fleet utilization with 98.2% SLA adherence. 1 critical weather detour evaluated and applied via simulation SIM-901.",
      author: "Nexus Neural Engine™",
    },
    {
      id: "rep-2",
      title: "Incident INC-8041 Post-Mortem & Decision Impact",
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      type: "INCIDENT_AUDIT",
      summary: "Evaluated detour vs holding pattern. Decision applied transactionally: saved 135 minutes on high-value consignment.",
      author: "Alex Rivera (COO)",
    },
    {
      id: "rep-3",
      title: "Weekly Cold-Chain Fleet Thermal Performance Audit",
      date: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      type: "FLEET_AUDIT",
      summary: "Biopharma transport integrity maintained at 99.8% compliance across multi-axle refrigerated units.",
      author: "Sarah Chen (Regional Director)",
    },
  ]);

  // Fetch past services from backend history endpoint
  const fetchPastServices = React.useCallback(async (days: number) => {
    setLoadingHistory(true);
    try {
      let city = "Dehradun";
      if (typeof window !== "undefined") {
        const savedLoc = localStorage.getItem("nexus_workspace_location");
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed?.name) city = parsed.name;
        }
      }

      const res = await fetch(`/api/v1/history/services?days=${days}&city=${encodeURIComponent(city)}`);
      if (res.ok) {
        const data = await res.json();
        setPastServices(data.services || []);
        setHistorySummary(data.summary || null);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === "past_services") {
      fetchPastServices(timeRangeDays);
    }
  }, [activeTab, timeRangeDays, fetchPastServices]);

  const handleGenerateNewReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/v1/briefing", { method: "POST" });
      let summaryText = "Real-time fleet operations report synthesized from active IoT telemetry and simulation predictions.";
      if (res.ok) {
        const data = await res.json();
        summaryText = data.briefing || summaryText;
      }

      const newReport = {
        id: `rep-${Date.now()}`,
        title: `Operations Command Synthesis · ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        type: "EXECUTIVE_BRIEF",
        summary: summaryText,
        author: "Nexus Neural Engine™",
      };

      setReportsList((prev) => [newReport, ...prev]);

      toast({
        title: "Executive Report Compiled",
        message: "Generated executive intelligence report from active telemetry.",
        type: "ai",
      });
    } catch {
      toast({
        title: "Executive Report Compiled",
        message: "Generated deterministic operational report.",
        type: "info",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = (rep: typeof reportsList[0]) => {
    const markdownContent = `# ${rep.title}\n\n**Date:** ${new Date(rep.date).toLocaleString()}\n**Classification:** ${rep.type}\n**Author:** ${rep.author}\n\n## Executive Summary\n${rep.summary}\n\n---\n*Generated by NEXUS Autonomous Operations Intelligence Platform*`;
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rep.id}-${rep.type.toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      message: `Downloaded ${rep.id} dossier.`,
      type: "success",
    });
  };

  return (
    <AppShell>
      <FadeIn className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span>Executive Intelligence & Audit Center</span>
              <span>·</span>
              <span>Past Services & Compliance Ledger</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Command Briefings & Historical Services
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="simulation"
              size="sm"
              onClick={handleGenerateNewReport}
              isLoading={isGenerating}
              className="font-mono-data text-xs shadow-tactile"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Compile Live Executive Briefing
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-nexus-surface-container/60 border border-nexus-outline-variant/30 w-fit">
          <button
            onClick={() => setActiveTab("briefings")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === "briefings"
                ? "bg-nexus-surface-lowest text-nexus-on-surface shadow-tactile"
                : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Executive Briefings</span>
          </button>

          <button
            onClick={() => setActiveTab("past_services")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === "past_services"
                ? "bg-nexus-surface-lowest text-nexus-on-surface shadow-tactile"
                : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Past Services Ledger</span>
          </button>
        </div>

        {/* TAB 1: EXECUTIVE BRIEFINGS */}
        {activeTab === "briefings" && (
          <StaggerContainer className="space-y-4">
            {reportsList.map((rep) => (
              <StaggerItem key={rep.id}>
                <TactileCard>
                  <Card>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-nexus-surface-container text-nexus-secondary shrink-0 mt-1">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="healthy" size="sm">
                              {rep.type}
                            </Badge>
                            <span className="text-xs text-nexus-on-surface-variant font-mono-data">
                              {formatDateTime(rep.date)}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-nexus-on-surface mt-1">{rep.title}</h3>
                          <p className="text-xs text-nexus-on-surface-variant mt-1 max-w-2xl leading-relaxed">
                            {rep.summary}
                          </p>
                          <p className="text-[11px] font-mono-data text-nexus-on-surface-variant/80 mt-2">
                            Compiled by: {rep.author}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadReport(rep)}
                          className="text-xs font-mono-data"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TactileCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* TAB 2: PAST SERVICES LEDGER */}
        {activeTab === "past_services" && (
          <div className="space-y-6">
            {/* Top KPI Metrics Bar */}
            {historySummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                <Card className="p-4 bg-nexus-surface-container/40 border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant uppercase block">Fulfilled Dispatches</span>
                  <span className="text-2xl font-black text-nexus-on-surface mt-1 block">
                    {historySummary.total_fulfilled_services}
                  </span>
                  <span className="text-[10px] text-emerald-400">Past {historySummary.time_range_days} Days Lookback</span>
                </Card>

                <Card className="p-4 bg-nexus-surface-container/40 border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant uppercase block">SLA Compliance</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {historySummary.sla_compliance_rate_pct}%
                  </span>
                  <span className="text-[10px] text-stone-500">On-Time Accuracy Benchmark</span>
                </Card>

                <Card className="p-4 bg-nexus-surface-container/40 border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant uppercase block">Cost Recovered</span>
                  <span className="text-2xl font-black text-purple-400 mt-1 block">
                    ${historySummary.total_cost_recovered_usd.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-stone-500">Via Autonomous Reroutes</span>
                </Card>

                <Card className="p-4 bg-nexus-surface-container/40 border-nexus-outline-variant/30">
                  <span className="text-[10px] text-nexus-on-surface-variant uppercase block">CO2 Offset</span>
                  <span className="text-2xl font-black text-cyan-400 mt-1 block">
                    {historySummary.total_carbon_offset_kg.toLocaleString()} kg
                  </span>
                  <span className="text-[10px] text-stone-500">Eco-Optimal Route Physics</span>
                </Card>
              </div>
            )}

            {/* Time Filter Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {[7, 30, 90, 180].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTimeRangeDays(days)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      timeRangeDays === days
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-nexus-surface-container/50 text-nexus-on-surface-variant hover:text-nexus-on-surface"
                    }`}
                  >
                    Past {days} Days
                  </button>
                ))}
              </div>

              <div className="text-xs font-mono text-nexus-on-surface-variant flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aegis Cryptographic State Ledger</span>
              </div>
            </div>

            {/* Services Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-nexus-surface-container/70 border-b border-nexus-outline-variant/30 text-[11px] text-nexus-on-surface-variant uppercase font-bold">
                    <tr>
                      <th className="p-3.5">Service Code</th>
                      <th className="p-3.5">Corridor Route</th>
                      <th className="p-3.5">Sector</th>
                      <th className="p-3.5">Completed Date</th>
                      <th className="p-3.5">Time Saved</th>
                      <th className="p-3.5">Cost Saved</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Aegis Proof</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-outline-variant/20">
                    {pastServices.map((svc) => (
                      <tr key={svc.id} className="hover:bg-nexus-surface-container/30 transition-colors">
                        <td className="p-3.5 font-bold text-nexus-on-surface">{svc.tracking_code}</td>
                        <td className="p-3.5">
                          <span className="text-nexus-on-surface block font-semibold">{svc.origin} → {svc.destination}</span>
                          <span className="text-[10px] text-nexus-on-surface-variant">{svc.distance_km} km transit</span>
                        </td>
                        <td className="p-3.5 text-stone-300">{svc.sector}</td>
                        <td className="p-3.5 text-nexus-on-surface-variant">{formatDateTime(svc.completed_at)}</td>
                        <td className="p-3.5 font-bold text-emerald-400">+{svc.time_recovered_mins} mins</td>
                        <td className="p-3.5 font-bold text-purple-400">+${svc.cost_saved_usd}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            svc.on_time_sla_met
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}>
                            {svc.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[10px] text-stone-500 truncate max-w-[120px]" title={svc.cryptographic_proof}>
                          {svc.cryptographic_proof.slice(0, 12)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </FadeIn>
    </AppShell>
  );
}
