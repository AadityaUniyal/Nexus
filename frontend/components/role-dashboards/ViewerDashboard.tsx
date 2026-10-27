"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Eye,
  FileText,
  Download,
  Sparkles,
  TrendingUp,
  Leaf,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Truck,
  ArrowUpRight,
  Printer
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricTile } from "@/components/ui/metric-tile";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export function ViewerDashboard() {
  const { toast } = useToast();
  const [isGeneratingBriefing, setIsGeneratingBriefing] = React.useState(false);

  const handleGenerateBriefing = () => {
    setIsGeneratingBriefing(true);
    tactileAudio.playClick();
    setTimeout(() => {
      setIsGeneratingBriefing(false);
      tactileAudio.playSuccess();
      toast({
        title: "Executive Briefing Generated",
        description: "Boardroom PDF summary formatted with Scope 1 ESG audit and financial demurrage recovery metrics.",
        variant: "default"
      });
      // Trigger browser print/pdf dialog
      window.print();
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Boardroom KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Global On-Time Delivery (OTD)"
          value="98.4%"
          subtext="Benchmark: 95.0% SLA Target"
          trend="up"
          trendValue="+2.1% MoM"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
        <MetricTile
          label="Net Margin Preservation"
          value="$1.42M"
          subtext="From route optimization & demurrage"
          trend="up"
          trendValue="+$340k Q4"
          icon={<DollarSign className="w-4 h-4 text-blue-500" />}
        />
        <MetricTile
          label="Scope 1 & 3 Carbon Avoided"
          value="42.8 Tons"
          subtext="Verified emission offsets"
          trend="down"
          trendValue="-38.6% Deadhead"
          icon={<Leaf className="w-4 h-4 text-teal-500" />}
        />
        <MetricTile
          label="Cryptographic Audit Integrity"
          value="100% Sealed"
          subtext="SHA-256 Ledger Verified"
          trend="up"
          trendValue="Zero Tamper Events"
          icon={<ShieldCheck className="w-4 h-4 text-purple-500" />}
        />
      </div>

      {/* Executive Briefing Banner */}
      <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl p-6 shadow-tactile flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              Executive View
            </Badge>
            <span className="text-xs font-mono text-neutral-500">Boardroom Digest & ESG Compliance</span>
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            Enterprise Fleet Performance & Governance Briefing
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl">
            High-level operational index synthesizing multi-depot throughput, automated carrier demurrage collections, and carbon footprint reduction curves.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerateBriefing}
            disabled={isGeneratingBriefing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs shadow-tactile gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            {isGeneratingBriefing ? "Generating PDF..." : "Export Executive PDF"}
          </Button>
        </div>
      </div>

      {/* Dual Executive Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ESG Carbon Reduction Matrix */}
        <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl p-6 shadow-tactile space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Leaf className="w-4 h-4 text-teal-500" />
                ESG Sustainability & Fleet Decarbonization
              </h4>
              <p className="text-xs text-neutral-500">
                Scope 1 direct diesel reduction via Clarke-Wright combinatorial routing.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
              -38.6% Empty Haul
            </span>
          </div>

          <div className="space-y-4 pt-2 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Baseline Unoptimized Distance</span>
              <span className="font-bold text-neutral-900 dark:text-white">1,620 km/day</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Optimized Fleet Routing</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">995 km/day (-625 km)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-teal-500/[0.05] border border-teal-500/20 flex items-center justify-between">
              <span className="text-teal-700 dark:text-teal-300 font-semibold">Net Scope 1 CO₂ Avoided</span>
              <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">42.8 Metric Tons</span>
            </div>
          </div>
        </div>

        {/* Carrier Demurrage & Dispute Resolution Summary */}
        <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl p-6 shadow-tactile space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-500" />
                Automated Detention Demurrage Ledger
              </h4>
              <p className="text-xs text-neutral-500">
                120-minute facility dwell overage billed via cryptographic SHA-256 receipts.
              </p>
            </div>
            <Link href="/intelligence" className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4 pt-2 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Total Billed Demurrage</span>
              <span className="font-bold text-neutral-900 dark:text-white">$28,450.00</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Dispute Settlement Turnaround</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">&lt; 60 seconds (down from 21 days)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-500/[0.05] border border-blue-500/20 flex items-center justify-between">
              <span className="text-blue-700 dark:text-blue-300 font-semibold">Net Recovered Margin</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">$26,890.00 (94.5%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
