"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  PieChart,
  TrendingUp,
  FileText,
  Download,
  Leaf,
  DollarSign,
  Globe2,
  CheckCircle2,
  Sparkles,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricTile } from "@/components/ui/metric-tile";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export function ViewerDashboard() {
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const handleDownloadBoardBriefing = () => {
    setIsGeneratingPdf(true);
    tactileAudio.playClick();
    setTimeout(() => {
      setIsGeneratingPdf(false);
      tactileAudio.playSuccess();
      toast({
        title: "Executive PDF Briefing Generated",
        message: "Executive summary prepared with Q3 SLA figures and ESG carbon audits.",
        type: "success",
      });
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Executive Macro Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Global On-Time Delivery"
          value="98.4%"
          subtitle="Enterprise SLA Target"
          change="+3.2% vs previous quarter"
          trend="up"
          status="HEALTHY"
          icon={Award}
          variant="default"
        />
        <MetricTile
          title="Supply Chain Net Savings"
          value="$1.42M"
          subtitle="Mitigated Penalties"
          change="+24% ROI on AI"
          trend="up"
          status="HEALTHY"
          icon={DollarSign}
          variant="default"
        />
        <MetricTile
          title="ESG Carbon Avoidance"
          value="42.8 T"
          subtitle="Metric Tons CO2e"
          change="≈ 1,940 trees planted"
          trend="up"
          status="HEALTHY"
          icon={Leaf}
          variant="default"
        />
        <MetricTile
          title="Network Resilience Score"
          value="96.8"
          subtitle="out of 100 Index"
          change="Optimal fault tolerance"
          trend="up"
          status="SIMULATION"
          icon={Globe2}
          variant="simulation"
        />
      </div>

      {/* Executive Presentation View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: C-Suite Executive Summary Card */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile bg-gradient-to-br from-nexus-surface-container via-nexus-surface-container-high to-nexus-surface-container">
            <CardHeader className="pb-3 border-b border-nexus-outline/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold tracking-tight">
                  Executive Operations & ESG Briefing
                </CardTitle>
                <CardDescription className="text-xs">
                  Synthesized for Board of Directors and Enterprise Stakeholders
                </CardDescription>
              </div>
              <Button
                variant="simulation"
                size="sm"
                onClick={handleDownloadBoardBriefing}
                isLoading={isGeneratingPdf}
                className="font-mono text-xs shadow-tactile"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export Board Deck (PDF)
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-4 text-sm text-nexus-on-surface leading-relaxed">
                <p>
                  During the current operating cycle, the <strong>Nexus Autonomous Digital Twin</strong> proactively preempted <strong>14 critical network disruptions</strong> across North American and Indian freight corridors.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-nexus-surface border border-nexus-outline/20">
                    <span className="text-[11px] font-mono text-nexus-on-surface-variant block uppercase">
                      Financial Exposure Averted
                    </span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      $412,800
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-nexus-surface border border-nexus-outline/20">
                    <span className="text-[11px] font-mono text-nexus-on-surface-variant block uppercase">
                      EV Fleet Utilization
                    </span>
                    <span className="text-xl font-bold text-nexus-secondary font-mono">
                      91.4% Active
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-nexus-surface border border-nexus-outline/20">
                    <span className="text-[11px] font-mono text-nexus-on-surface-variant block uppercase">
                      Carrier SLA Compliance
                    </span>
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                      99.1% Verified
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Boardroom Quick Stats */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile bg-nexus-surface-container">
            <CardHeader className="pb-3 border-b border-nexus-outline/20">
              <CardTitle className="text-sm font-mono font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-nexus-secondary" />
                Automated Digest Schedule
              </CardTitle>
              <CardDescription className="text-xs">
                Next briefing: Tomorrow at 08:00 AM EST
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                <div className="font-bold text-nexus-on-surface">Recipient Channels</div>
                <div className="text-[10px] text-nexus-on-surface-variant mt-0.5">
                  board-briefing@enterprise.corp · Slack #c-suite-ops
                </div>
              </div>

              <div className="p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                <div className="font-bold text-nexus-on-surface">ESG Carbon Certification</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">
                  Scope 1 & Scope 3 ISO 14064 Compliant ✓
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
