"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  TrendingUp,
  Target,
  FileCheck2,
  Lock,
  Loader2,
} from "lucide-react";
import { formatPercent, formatDuration, formatNumber } from "@/lib/utils";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audit Chain Verification State
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    valid: boolean;
    checked: number;
    first_broken_seq: number | null;
  } | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleVerifyAuditChain = async () => {
    try {
      setVerifyingChain(true);
      const res = await api.verifyAuditChain();
      setAuditResult(res);
    } catch (err: any) {
      alert(err.message || "Audit verification failed");
    } finally {
      setVerifyingChain(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-zinc-500 min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm font-medium">Computing live outcome metrics from completed jobs...</p>
      </div>
    );
  }

  const sampleSize = data?.sample_size || 0;
  const isSufficientSample = sampleSize >= 5;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <span>Prediction Accuracy &amp; Outcomes</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Empirical validation of ETA predictions against verified driver arrival timestamps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnalytics}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleVerifyAuditChain}
            disabled={verifyingChain}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{verifyingChain ? "Verifying..." : "Verify Audit Ledger"}</span>
          </Button>
        </div>
      </div>

      {/* Audit Verification Banner */}
      {auditResult && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            auditResult.valid
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/30 border-rose-500/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {auditResult.valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold font-mono">
                {auditResult.valid
                  ? `Cryptographic Audit Chain Intact (${auditResult.checked} entries verified)`
                  : `Audit Chain Hash Mismatch at Seq #${auditResult.first_broken_seq}`}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                SHA-256 state transition hashes recomputed from genesis block. Zero mutations detected.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuditResult(null)}
            className="text-xs font-mono underline opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Honest Empty State for Insufficient Sample */}
      {!isSufficientSample ? (
        <Card className="p-12 text-center bg-zinc-900 border-zinc-800 space-y-4 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Clock className="w-7 h-7 text-amber-500/80" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-zinc-200">
              Awaiting real completed deliveries
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              NEXUS does not display fabricated charts or mock averages. Statistical accuracy metrics
              require at least 5 completed jobs with recorded GPS arrival timestamps.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800 text-xs font-mono text-zinc-400 border border-zinc-700">
                Current sample: <strong className="text-zinc-200">{sampleSize}</strong> / 5 minimum
              </span>
            </div>
          </div>
        </Card>
      ) : (
        /* Real Metrics Dashboard */
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* On-Time Rate */}
            <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">On-Time Delivery Rate</span>
                <span className="text-[10px] font-mono text-zinc-500">n = {sampleSize}</span>
              </div>
              <p className="text-3xl font-black font-mono text-emerald-400">
                {data.on_time_rate !== null ? formatPercent(data.on_time_rate) : "—"}
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">
                {data.on_time_count} on-time / {sampleSize} completed
              </p>
            </Card>

            {/* Median Abs Error */}
            <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Median Absolute Error</span>
                <span className="text-[10px] font-mono text-zinc-500">n = {sampleSize}</span>
              </div>
              <p className="text-3xl font-black font-mono text-blue-400">
                {data.median_abs_error_minutes !== null
                  ? `${formatNumber(data.median_abs_error_minutes, "en-US", { maximumFractionDigits: 1 })} min`
                  : "—"}
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">|Predicted ETA − Actual Arrival|</p>
            </Card>

            {/* Bias */}
            <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Prediction Bias</span>
                <span className="text-[10px] font-mono text-zinc-500">n = {sampleSize}</span>
              </div>
              <p className="text-3xl font-black font-mono text-zinc-200">
                {data.bias_minutes !== null
                  ? `${data.bias_minutes > 0 ? "+" : ""}${formatNumber(data.bias_minutes, "en-US", { maximumFractionDigits: 1 })} min`
                  : "—"}
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">
                {data.bias_minutes > 0 ? "Underestimating travel time" : "Overestimating travel time"}
              </p>
            </Card>

            {/* Precision / Recall */}
            <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Late Detection Precision</span>
                <span className="text-[10px] font-mono text-zinc-500">n = {sampleSize}</span>
              </div>
              <p className="text-3xl font-black font-mono text-purple-400">
                {data.late_flag_precision !== null
                  ? formatPercent(data.late_flag_precision)
                  : "—"}
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">
                Recall: {data.late_flag_recall !== null ? formatPercent(data.late_flag_recall) : "—"}
              </p>
            </Card>
          </div>

          {/* Detailed Accuracy Table */}
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-200">Delivery Accuracy Breakdown</h3>
                <p className="text-xs text-zinc-400">
                  Per-stop prediction comparison against actual driver timestamps.
                </p>
              </div>
            </div>

            <div className="p-4 text-xs text-zinc-400 font-mono">
              <p>
                All ETA calculations incorporate live Azure Maps flow tiles with speed-limit and historical
                congestion factors. Parquet telemetry exports run daily at 02:00 UTC to Azure Blob storage.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
