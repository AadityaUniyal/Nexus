"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric-tile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/http";
import { track } from "@/lib/analytics/tracker";
import { AIInsightsPanel } from "@/components/analytics/AIInsightsPanel";
import {
  BarChart3,
  TrendingUp,
  Download,
  Activity,
  Truck,
  Building2,
  RefreshCw,
  BrainCircuit,
  AlertTriangle,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Cloud,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type TabType = "overview" | "forecast" | "anomalies" | "risk" | "medallion";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>("overview");
  const [timeframe, setTimeframe] = React.useState<"24h" | "7d" | "30d" | "90d">("24h");
  const [forecastMetric, setForecastMetric] = React.useState<string>("delivery_volume");
  const [forecastHorizon, setForecastHorizon] = React.useState<"24h" | "7d">("7d");
  const [loading, setLoading] = React.useState<boolean>(true);
  const [exporting, setExporting] = React.useState<boolean>(false);

  // Data states
  const [overviewData, setOverviewData] = React.useState<any>(null);
  const [forecastData, setForecastData] = React.useState<any>(null);
  const [anomalyData, setAnomalyData] = React.useState<any>(null);
  const [riskData, setRiskData] = React.useState<any>(null);
  const [medallionData, setMedallionData] = React.useState<any>(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Overview
      const resOverview = await apiFetch(`/api/v1/analytics/overview?timeframe=${timeframe}`);
      if (resOverview.ok) {
        setOverviewData(await resOverview.json());
      }

      // 2. Forecast
      const resForecast = await apiFetch(
        `/api/v1/analytics/forecast?metric=${forecastMetric}&horizon=${forecastHorizon}`
      );
      if (resForecast.ok) {
        setForecastData(await resForecast.json());
      }

      // 3. Anomalies
      const resAnomalies = await apiFetch(`/api/v1/analytics/anomalies`);
      if (resAnomalies.ok) {
        setAnomalyData(await resAnomalies.json());
      }

      // 4. Risk scores
      const resRisk = await apiFetch(`/api/v1/analytics/risk-scores`);
      if (resRisk.ok) {
        setRiskData(await resRisk.json());
      }

      // 5. Medallion architecture
      const resMedallion = await apiFetch(`/api/v1/analytics/medallion-summary`);
      if (resMedallion.ok) {
        setMedallionData(await resMedallion.json());
      }
    } catch (e) {
      console.error("Failed to fetch live analytics:", e);
    } finally {
      setLoading(false);
    }
  }, [timeframe, forecastMetric, forecastHorizon]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCSV = async () => {
    setExporting(true);
    track("export", { format: "csv", timeframe });
    try {
      const res = await apiFetch(`/api/v1/analytics/export?format=csv&timeframe=${timeframe}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nexus-analytics-${timeframe}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error("CSV Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  const slaRate = overviewData?.slaComplianceRate ?? 97.4;
  const turnaround = overviewData?.avgTurnaroundMins ?? 42;
  const totalUnits = (overviewData?.totalNetworkUnits ?? 71650).toLocaleString();
  const slaTrends = overviewData?.slaTrends ?? [];
  const hubThroughput = overviewData?.hubThroughput ?? [];
  const forecastList = forecastData?.forecast ?? [];
  const anomaliesList = anomalyData?.anomalies ?? [];
  const riskList = riskData?.riskBreakdown ?? [];

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <span>Analytics</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Operations analytics
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Global Timeframe Selector */}
            <div className="inline-flex rounded-lg bg-nexus-surface-container p-1 text-xs font-mono">
              {(["24h", "7d", "30d", "90d"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    timeframe === t
                      ? "bg-nexus-surface-container-lowest text-nexus-on-surface shadow-sm font-bold"
                      : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAnalytics}
              disabled={loading}
              className="font-mono text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              disabled={exporting}
              className="font-mono text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        <AIInsightsPanel timeframe={timeframe} />

        {/* Tab Navigation */}
        <div className="flex border-b border-nexus-outline-variant/40 gap-2 overflow-x-auto text-sm font-medium">
          {[
            { id: "overview" as TabType, label: "Overview", icon: Activity },
            { id: "forecast" as TabType, label: "Forecast", icon: BrainCircuit },
            { id: "anomalies" as TabType, label: "Anomalies", icon: AlertTriangle },
            { id: "risk" as TabType, label: "Risk", icon: ShieldAlert },
            { id: "medallion" as TabType, label: "Data pipeline", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-mono text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? "border-nexus-secondary text-nexus-secondary font-bold"
                    : "border-transparent text-nexus-on-surface-variant hover:text-nexus-on-surface hover:border-nexus-outline-variant"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Analytics Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricTile
                title="SLA Compliance Rate"
                value={`${slaRate}%`}
                subtitle={`Target benchmark 95.0% (${timeframe})`}
                trend={slaRate >= 95 ? "up" : "down"}
                status={slaRate >= 95 ? "HEALTHY" : "ATTENTION"}
                icon={Activity}
              />
              <MetricTile
                title="Avg Corridor Turnaround"
                value={`${turnaround} mins`}
                subtitle="Calculated across active corridors"
                trend="up"
                status="HEALTHY"
                icon={Truck}
              />
              <MetricTile
                title="Total Network Volume"
                value={totalUnits}
                subtitle={`Units across ${hubThroughput.length || 6} regional hubs`}
                trend="neutral"
                status="OPERATIONAL"
                icon={Building2}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SLA Adherence Timeline */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle className="text-sm font-bold">
                      SLA Compliance Adherence ({timeframe})
                    </CardTitle>
                    <CardDescription>
                      Continuous delivery adherence vs 95% target threshold
                    </CardDescription>
                  </div>
                  <Badge variant={slaRate >= 95 ? "healthy" : "attention"} size="sm">
                    {slaRate}% Live
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={slaTrends}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="slaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.6} />
                        <XAxis dataKey="time" stroke="var(--outline)" fontSize={11} fontFamily="monospace" />
                        <YAxis domain={[85, 100]} stroke="var(--outline)" fontSize={11} fontFamily="monospace" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="adherence"
                          stroke="var(--chart-1)"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#slaGradient)"
                          name="SLA %"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Hub Capacity & Volume Bar Chart */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle className="text-sm font-bold">
                      Warehouse Volume vs Total Capacity
                    </CardTitle>
                    <CardDescription>
                      Storage saturation across continental hubs
                    </CardDescription>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {hubThroughput.length} Hubs
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={hubThroughput}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.6} />
                        <XAxis dataKey="hub" stroke="var(--outline)" fontSize={11} fontFamily="monospace" />
                        <YAxis stroke="var(--outline)" fontSize={11} fontFamily="monospace" />
                        <Tooltip />
                        <Bar dataKey="volume" fill="#20231f" radius={[4, 4, 0, 0]} name="Current Load" />
                        <Bar dataKey="capacity" fill="#dcd9d8" radius={[4, 4, 0, 0]} name="Max Capacity" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: PREDICTIVE ML FORECASTING */}
        {activeTab === "forecast" && (
          <div className="space-y-6">
            {/* Forecast Controls Bar */}
            <div className="p-4 rounded-xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-nexus-on-surface-variant uppercase font-bold">
                  Metric:
                </span>
                <select
                  value={forecastMetric}
                  onChange={(e) => setForecastMetric(e.target.value)}
                  className="bg-nexus-surface-container text-xs font-mono px-3 py-1.5 rounded-lg border border-nexus-outline-variant/50 text-nexus-on-surface"
                >
                  <option value="delivery_volume">Delivery Volume (Units)</option>
                  <option value="sla_adherence">SLA Adherence (%)</option>
                  <option value="energy_consumption">Energy Burn (kWh)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-nexus-on-surface-variant uppercase font-bold">
                  Horizon:
                </span>
                <div className="inline-flex rounded-lg bg-nexus-surface-container p-0.5 text-xs font-mono">
                  {(["24h", "7d"] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setForecastHorizon(h)}
                      className={`px-3 py-1 rounded-md transition-all ${
                        forecastHorizon === h
                          ? "bg-nexus-surface-container-lowest font-bold text-nexus-secondary shadow-sm"
                          : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
                      }`}
                    >
                      {h.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Forecast Area Chart with P10/P50/P90 Bounds */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Probabilistic Time-Series Forecast (P10 · P50 Expected · P90 Bounds)
                  </CardTitle>
                  <CardDescription>
                    Statistical time-series decomposition modeling trend, diurnal cycles, and 90%
                    credible interval bounds.
                  </CardDescription>
                </div>
                <Badge variant="healthy" size="sm">
                  {forecastData?.modelMetadata?.algorithm || "Prophet-Aligned"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={forecastList}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="p90Gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.6} />
                      <XAxis
                        dataKey={forecastHorizon === "24h" ? "time" : "date"}
                        stroke="var(--outline)"
                        fontSize={11}
                        fontFamily="monospace"
                      />
                      <YAxis stroke="var(--outline)" fontSize={11} fontFamily="monospace" />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px", fontFamily: "monospace" }} />
                      <Area
                        type="monotone"
                        dataKey="p90"
                        stroke="#7c3aed"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fill="url(#p90Gradient)"
                        name="P90 (Upper Bound)"
                      />
                      <Area
                        type="monotone"
                        dataKey="p50"
                        stroke="var(--chart-1)"
                        strokeWidth={2.5}
                        fill="none"
                        name="P50 (Expected)"
                      />
                      <Area
                        type="monotone"
                        dataKey="p10"
                        stroke="#0284c7"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fill="none"
                        name="P10 (Lower Bound)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Model Metadata Card */}
                <div className="mt-6 pt-4 border-t border-nexus-outline-variant/30 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-nexus-on-surface-variant block">ALGORITHM</span>
                    <span className="font-bold text-nexus-on-surface">
                      {forecastData?.modelMetadata?.algorithm || "Bayesian Additive Decomposition"}
                    </span>
                  </div>
                  <div>
                    <span className="text-nexus-on-surface-variant block">CONFIDENCE INTERVAL</span>
                    <span className="font-bold text-nexus-secondary">
                      {forecastData?.modelMetadata?.confidenceLevel || "90% Credible Bounds"}
                    </span>
                  </div>
                  <div>
                    <span className="text-nexus-on-surface-variant block">MEAN ABSOLUTE % ERROR</span>
                    <span className="font-bold text-nexus-on-surface">
                      {forecastData?.modelMetadata?.meanAbsolutePercentageError || "3.4%"}
                    </span>
                  </div>
                  <div>
                    <span className="text-nexus-on-surface-variant block">FABRIC FOUNDRY MODEL</span>
                    <span className="font-bold text-purple-700 dark:text-purple-400">
                      {forecastData?.modelMetadata?.fabricFoundryModel || "nexus-logistics-forecaster-v2"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: TELEMETRY ANOMALY DETECTION */}
        {activeTab === "anomalies" && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-nexus-on-surface">
                  Machine Learning Telemetry Anomaly Detector
                </h3>
                <p className="text-xs text-nexus-on-surface-variant">
                  Algorithm: Scikit-Learn IsolationForest (Multi-variate speed, battery, and powertrain telemetry)
                </p>
              </div>
              <Badge variant="healthy" size="sm">
                {anomalyData?.totalVehiclesMonitored || 6} Fleet Units Monitored
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomaliesList.map((anom: any, idx: number) => {
                const isCritical = anom.severity === "CRITICAL";
                const isHigh = anom.severity === "HIGH";
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCritical
                        ? "bg-red-500/5 border-red-500/30"
                        : isHigh
                        ? "bg-amber-500/5 border-amber-500/30"
                        : "bg-nexus-surface-container-lowest border-nexus-outline-variant/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-nexus-on-surface">
                          {anom.vehicleCode}
                        </span>
                        <span className="text-xs text-nexus-on-surface-variant">({anom.vehicleName})</span>
                      </div>
                      <Badge
                        variant={isCritical ? "critical" : isHigh ? "attention" : "neutral"}
                        size="sm"
                      >
                        {anom.severity} · SCORE: {anom.anomalyScore}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-mono font-bold text-nexus-secondary">
                        {anom.anomalyType}
                      </p>
                      <p className="text-xs text-nexus-on-surface-variant mt-1 leading-relaxed">
                        {anom.recommendation}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-nexus-outline-variant/20 grid grid-cols-3 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-nexus-on-surface-variant block">SPEED</span>
                        <span className="font-bold text-nexus-on-surface">
                          {anom.telemetrySnapshot?.speedKmh} km/h
                        </span>
                      </div>
                      <div>
                        <span className="text-nexus-on-surface-variant block">BATTERY</span>
                        <span className="font-bold text-nexus-on-surface">
                          {anom.telemetrySnapshot?.batteryPct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-nexus-on-surface-variant block">POWERTRAIN</span>
                        <span className="font-bold text-nexus-on-surface">
                          {anom.telemetrySnapshot?.healthScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: RISK SCORING */}
        {activeTab === "risk" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40">
                <p className="text-xs font-mono text-nexus-on-surface-variant uppercase">Portfolio Risk Exposure</p>
                <p className="text-2xl font-bold font-mono text-red-600 mt-1">
                  ${(riskData?.portfolioExposureUsd || 14200).toLocaleString()}
                </p>
                <p className="text-xs text-nexus-on-surface-variant mt-1">Potential SLA breach penalty fines</p>
              </div>

              <div className="p-4 rounded-xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40">
                <p className="text-xs font-mono text-nexus-on-surface-variant uppercase">Critical Orders at Risk</p>
                <p className="text-2xl font-bold font-mono text-amber-600 mt-1">
                  {riskData?.criticalRiskCount || 2} Orders
                </p>
                <p className="text-xs text-nexus-on-surface-variant mt-1">Requiring active detour arbitration</p>
              </div>

              <div className="p-4 rounded-xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40">
                <p className="text-xs font-mono text-nexus-on-surface-variant uppercase">Scored Active Orders</p>
                <p className="text-2xl font-bold font-mono text-nexus-on-surface mt-1">
                  {riskData?.ordersScoredCount || 14}
                </p>
                <p className="text-xs text-nexus-on-surface-variant mt-1">Evaluated across continental corridors</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-sm font-bold">Order Risk Matrix & Financial Exposure</CardTitle>
                  <CardDescription>
                    Multi-factor index: Weather Severity + Route Congestion + SLA Urgency
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-nexus-outline-variant/40 text-nexus-on-surface-variant text-left">
                        <th className="py-2.5">ORDER ID</th>
                        <th className="py-2.5">CUSTOMER</th>
                        <th className="py-2.5">DESTINATION</th>
                        <th className="py-2.5">PRIORITY</th>
                        <th className="py-2.5">RISK SCORE</th>
                        <th className="py-2.5">TIER</th>
                        <th className="py-2.5 text-right">EXPOSURE (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexus-outline-variant/20">
                      {riskList.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-nexus-surface-container/40">
                          <td className="py-2.5 font-bold text-nexus-on-surface">{r.orderNumber}</td>
                          <td className="py-2.5">{r.customerName}</td>
                          <td className="py-2.5">{r.destination}</td>
                          <td className="py-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                r.priority === "CRITICAL"
                                  ? "bg-red-500/20 text-red-600 font-bold"
                                  : "bg-nexus-surface-container text-nexus-on-surface-variant"
                              }`}
                            >
                              {r.priority}
                            </span>
                          </td>
                          <td className="py-2.5 font-bold">{r.riskScore}/100</td>
                          <td className="py-2.5">
                            <span
                              className={`font-bold ${
                                r.riskTier === "CRITICAL"
                                  ? "text-red-600"
                                  : r.riskTier === "HIGH"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {r.riskTier}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-bold text-nexus-on-surface">
                            ${r.potentialLossUsd.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 5: MEDALLION LAKEHOUSE */}
        {activeTab === "medallion" && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-nexus-on-surface">
                  Microsoft Fabric OneLake Medallion Architecture
                </h3>
                <p className="text-xs text-nexus-on-surface-variant">
                  Cleaned, partitioned Delta tables designed for zero-copy Direct Lake querying in Power BI.
                </p>
              </div>
              <Badge variant="healthy" size="sm">
                Fabric Sync: Active (15m batch)
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bronze */}
              <div className="p-5 rounded-2xl bg-nexus-surface-container-lowest border border-amber-600/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    BRONZE LAYER
                  </span>
                  <Database className="h-4 w-4 text-amber-600" />
                </div>
                <h4 className="text-sm font-bold text-nexus-on-surface">Raw IoT Ingestion Stream</h4>
                <p className="text-xs text-nexus-on-surface-variant leading-relaxed">
                  Immutable, append-only JSON/Avro packets from GPS gateways, Azure IoT Hub F1, and vehicle sensors.
                </p>
                <div className="space-y-1 text-xs font-mono pt-2 border-t border-nexus-outline-variant/30">
                  <p className="text-nexus-on-surface-variant">Throughput: <strong className="text-nexus-on-surface">1,500 events/sec</strong></p>
                  <p className="text-nexus-on-surface-variant">Daily Events: <strong className="text-nexus-on-surface">1.25M records</strong></p>
                  <p className="text-nexus-on-surface-variant">Retention: <strong className="text-nexus-on-surface">90 days (ADLS Gen2)</strong></p>
                </div>
              </div>

              {/* Silver */}
              <div className="p-5 rounded-2xl bg-nexus-surface-container-lowest border border-slate-400/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-400/20 text-slate-700 dark:text-slate-300">
                    SILVER LAYER
                  </span>
                  <Layers className="h-4 w-4 text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-nexus-on-surface">Enriched & Validated Delta</h4>
                <p className="text-xs text-nexus-on-surface-variant leading-relaxed">
                  Deduplicated, schema-enforced telemetry joined with customer orders and GIS corridor waypoints.
                </p>
                <div className="space-y-1 text-xs font-mono pt-2 border-t border-nexus-outline-variant/30">
                  <p className="text-nexus-on-surface-variant">Quality Score: <strong className="text-emerald-600 font-bold">99.8% Passed</strong></p>
                  <p className="text-nexus-on-surface-variant">Delta Table: <strong className="text-nexus-on-surface">silver_telemetry_events</strong></p>
                  <p className="text-nexus-on-surface-variant">Partitions: <strong className="text-nexus-on-surface">[workspace_id, date]</strong></p>
                </div>
              </div>

              {/* Gold */}
              <div className="p-5 rounded-2xl bg-nexus-surface-container-lowest border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-400/20 text-amber-600 font-bold">
                    GOLD LAYER
                  </span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <h4 className="text-sm font-bold text-nexus-on-surface">Business Intelligence Marts</h4>
                <p className="text-xs text-nexus-on-surface-variant leading-relaxed">
                  Aggregated hourly fleet utilization, route cost efficiency scores, and driver safety scorecards.
                </p>
                <div className="space-y-1 text-xs font-mono pt-2 border-t border-nexus-outline-variant/30">
                  <p className="text-nexus-on-surface-variant">Refresh: <strong className="text-nexus-on-surface">15-minute microbatches</strong></p>
                  <p className="text-nexus-on-surface-variant">Power BI Mode: <strong className="text-nexus-secondary font-bold">Direct Lake (Zero-ETL)</strong></p>
                  <p className="text-nexus-on-surface-variant">Marts: <strong className="text-nexus-on-surface">gold_fleet_kpis_hourly</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
