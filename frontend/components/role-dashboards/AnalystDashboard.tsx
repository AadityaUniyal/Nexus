"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  BarChart3,
  Sliders,
  Sparkles,
  Download,
  Database,
  FileSpreadsheet,
  Layers,
  LineChart,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricTile } from "@/components/ui/metric-tile";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export function AnalystDashboard() {
  const { toast } = useToast();
  const [iterations, setIterations] = React.useState<number>(5000);
  const [confidenceInterval, setConfidenceInterval] = React.useState<number>(95);
  const [weatherWeight, setWeatherWeight] = React.useState<number>(75);
  const [fuelSurgePct, setFuelSurgePct] = React.useState<number>(15);
  const [isSimulating, setIsSimulating] = React.useState(false);

  const handleRunMonteCarlo = () => {
    setIsSimulating(true);
    tactileAudio.playClick();
    setTimeout(() => {
      setIsSimulating(false);
      tactileAudio.playSuccess();
      toast({
        title: "Monte Carlo Run Completed",
        message: `Calculated ${iterations.toLocaleString()} iterations at ${confidenceInterval}% confidence interval.`,
        type: "ai",
      });
    }, 700);
  };

  const handleExportData = (format: "CSV" | "PARQUET" | "JSON") => {
    tactileAudio.playClick();
    toast({
      title: `Dataset Exported (${format})`,
      message: `Saved operational corridor regressions to ${format.toLowerCase()} format.`,
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistical Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Network Route Variance"
          value="±3.8%"
          subtitle="P95 Predictability"
          change="-1.2% vs last qtr"
          trend="up"
          status="HEALTHY"
          icon={TrendingUp}
          variant="default"
        />
        <MetricTile
          title="Carrier Cost Elasticity"
          value="$1.42/km"
          subtitle="Avg Marginal Cost"
          change="Optimized across 12 carriers"
          trend="up"
          status="HEALTHY"
          icon={BarChart3}
          variant="default"
        />
        <MetricTile
          title="Simulated Net Savings"
          value="$48.2k"
          subtitle="Predicted Next 30 Days"
          change="+18% over naive dispatch"
          trend="up"
          status="SIMULATION"
          icon={Sparkles}
          variant="simulation"
        />
        <MetricTile
          title="Carbon Avoidance Index"
          value="92.6"
          subtitle="ESG Corridor Score"
          change="+4.2 tons CO2 saved"
          trend="up"
          status="HEALTHY"
          icon={LineChart}
          variant="default"
        />
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Parameter Tuning Workbench */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile bg-nexus-surface-container">
            <CardHeader className="pb-3 border-b border-nexus-outline/20">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-nexus-secondary text-white shadow-xs">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-mono font-bold">
                    Monte Carlo Scenario Parameters
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tune statistical weights & environmental stress variables
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Sliders */}
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-nexus-on-surface-variant uppercase text-[10px]">
                      Monte Carlo Iterations
                    </span>
                    <span className="font-bold text-nexus-on-surface">{iterations.toLocaleString()} runs</span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={10000}
                    step={1000}
                    value={iterations}
                    onChange={(e) => setIterations(parseInt(e.target.value))}
                    className="w-full h-2 bg-nexus-surface-container-highest rounded-lg appearance-none cursor-pointer accent-nexus-secondary"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-nexus-on-surface-variant uppercase text-[10px]">
                      Confidence Interval (P-Value)
                    </span>
                    <span className="font-bold text-nexus-on-surface">{confidenceInterval}% Confidence</span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={99}
                    step={1}
                    value={confidenceInterval}
                    onChange={(e) => setConfidenceInterval(parseInt(e.target.value))}
                    className="w-full h-2 bg-nexus-surface-container-highest rounded-lg appearance-none cursor-pointer accent-nexus-secondary"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-nexus-on-surface-variant uppercase text-[10px]">
                      Winter Blizzard Severity Weight
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{weatherWeight}% Stress</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={weatherWeight}
                    onChange={(e) => setWeatherWeight(parseInt(e.target.value))}
                    className="w-full h-2 bg-nexus-surface-container-highest rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-nexus-on-surface-variant uppercase text-[10px]">
                      Fuel Price Inflation Spike
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">+{fuelSurgePct}% Surge</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={5}
                    value={fuelSurgePct}
                    onChange={(e) => setFuelSurgePct(parseInt(e.target.value))}
                    className="w-full h-2 bg-nexus-surface-container-highest rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
              </div>

              <Button
                variant="simulation"
                size="sm"
                onClick={handleRunMonteCarlo}
                isLoading={isSimulating}
                className="w-full font-mono text-xs shadow-tactile"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Execute Multi-Variate Model
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Simulation Curve & Data Studio */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile">
            <CardHeader className="pb-3 border-b border-nexus-outline/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-mono font-bold">
                  Predictive Delay Distribution Curve
                </CardTitle>
                <CardDescription className="text-xs">
                  Histogram of expected delays across {iterations.toLocaleString()} stochastic runs
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportData("CSV")}
                  className="font-mono text-xs h-7 px-2"
                >
                  <FileSpreadsheet className="w-3 h-3 mr-1" /> CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportData("PARQUET")}
                  className="font-mono text-xs h-7 px-2"
                >
                  <Database className="w-3 h-3 mr-1" /> Parquet
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Synthetic Visual Distribution Bars */}
              <div className="p-4 rounded-xl bg-nexus-surface border border-nexus-outline/20 space-y-2">
                <div className="flex items-end justify-between gap-1 h-32 pt-4 px-2">
                  {[12, 28, 45, 80, 95, 88, 62, 38, 20, 8, 4, 2].map((height, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.03 }}
                        className={`w-full rounded-t-md ${
                          idx === 4 || idx === 5
                            ? "bg-nexus-secondary"
                            : idx > 6
                            ? "bg-rose-500/70"
                            : "bg-nexus-secondary/40"
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-nexus-on-surface-variant pt-1 border-t border-nexus-outline/20">
                  <span>-15m (Ahead)</span>
                  <span className="font-bold text-nexus-on-surface">Mean: +14.2m Delay</span>
                  <span>+90m (Worst Case)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-nexus-surface-container-high text-xs font-mono text-nexus-on-surface leading-relaxed">
                <span className="font-bold text-nexus-secondary block mb-1">
                  🔬 Key Statistical Findings:
                </span>
                With +15% fuel price surge, optimal fleet route shifts by 32km north to utilize renewable EV supercharging corridors, recovering 78% of fuel margin exposure.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
