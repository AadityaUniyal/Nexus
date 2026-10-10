"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Layers,
  ShieldCheck,
  Zap,
  Lock,
  Globe,
  Database,
  Cpu,
  RefreshCw,
  FileCheck,
  Server,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Activity,
  Radio,
} from "lucide-react";

export default function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState<"loop" | "security" | "pwa" | "audit">("loop");

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">System Architecture & Engineering</h1>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              Live Interactive Twin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Interactive breakdown of the deterministic telemetry pipeline, cryptographic integrity layer, and cloud infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
            Azure Gen2 Entra ID Active
          </Badge>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-muted/40 rounded-lg border border-border/50 max-w-fit">
        <button
          onClick={() => setActiveTab("loop")}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
            activeTab === "loop"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" />
          Closed Decision Loop
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
            activeTab === "security"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          Zero-Trust Security & Identity
        </button>
        <button
          onClick={() => setActiveTab("pwa")}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
            activeTab === "pwa"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          Driver PWA & Edge Ingest
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
            activeTab === "audit"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-purple-400" />
          SHA-256 Audit Chain
        </button>
      </div>

      {/* Tab 1: Closed Decision Loop */}
      {activeTab === "loop" && (
        <div className="space-y-6">
          <Card className="p-6 bg-card border-border space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              The Preemptive Decision Loop Pipeline
            </h3>
            <p className="text-sm text-muted-foreground">
              Unlike legacy TMS dashboards that reactively notify dispatchers after an SLA breach has already occurred, NEXUS deterministically predicts time-window violations in flight and offers one-tap corrective mutations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                  1
                </div>
                <h4 className="font-semibold text-sm text-foreground">GPS Stream & Wake Lock</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Driver phone browser captures high-accuracy geolocation (&le; 100m) with Screen Wake Lock API and IndexedDB offline resilience.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                  2
                </div>
                <h4 className="font-semibold text-sm text-foreground">Live Traffic ETA</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Azure Maps Gen2 directions calculates live traffic delays with 250m/120s throttling and 110m cell caching to fit student budgets.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-xs">
                  3
                </div>
                <h4 className="font-semibold text-sm text-foreground">Risk Classification</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deterministic bounds: on_time, at_risk, late with dynamic confidence margin max(300s, 15% of ETA).
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  4
                </div>
                <h4 className="font-semibold text-sm text-foreground">1-Tap Matrix Fix</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Azure Maps Route Matrix generates atomic reassignments & reorderings executed in 1 transaction and pushed to driver PWAs in &lt;15s.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 bg-card border-border space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                Deterministic Bounds Formula
              </h4>
              <div className="p-3 bg-muted/60 rounded font-mono text-xs text-zinc-300 space-y-1.5">
                <div><span className="text-emerald-400 font-bold">on_time:</span> ETA + Margin &le; Window_End</div>
                <div><span className="text-amber-400 font-bold">at_risk:</span> ETA - Margin &le; Window_End &lt; ETA + Margin</div>
                <div><span className="text-rose-400 font-bold">late:</span> ETA - Margin &gt; Window_End</div>
                <div><span className="text-zinc-500 font-bold">unknown:</span> GPS age &gt; 300s or quota limit reached</div>
              </div>
            </Card>

            <Card className="p-5 bg-card border-border space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Lakehouse Telemetry Export
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Daily async workers partition location pings and predictions into Parquet datasets exported to Azure Blob Storage under <code className="bg-muted px-1 py-0.5 rounded text-zinc-200">telemetry/year=YYYY/month=MM/day=DD/</code> for lakehouse analytics.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Zero-Trust Security */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <Card className="p-6 bg-card border-border space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Zero-Trust Identity & Token Exchange Architecture
            </h3>
            <p className="text-sm text-muted-foreground">
              NEXUS completely eliminates long-lived static API keys in client bundles. Browser map clients communicate via short-lived Entra ID bearer tokens issued by the backend.
            </p>

            <div className="p-4 bg-muted/50 rounded-lg border border-border/80 font-mono text-xs space-y-2 text-zinc-300">
              <div className="text-blue-400 font-bold">{"// 1. User Authenticates with Clerk (RS256 JWKS)"}</div>
              <div>Frontend &rarr; JWT Bearer Token (Sub, Org, Exp) &rarr; FastApi Backend</div>
              <div className="text-blue-400 font-bold pt-2">{"// 2. Backend Exchanges Principal for Scoped Azure Maps Token"}</div>
              <div>Backend Managed Identity &rarr; Entra ID OAuth 2.0 &rarr; Azure Maps Gen2 Bearer Token (60m TTL)</div>
              <div className="text-blue-400 font-bold pt-2">{"// 3. MapLibre GL JS Injects TransformRequest Header"}</div>
              <div>Browser MapLibre &rarr; transformRequest(Bearer Token, x-ms-client-id) &rarr; atlas.microsoft.com</div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border space-y-2">
              <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">OWASP Hardened</Badge>
              <h4 className="font-semibold text-sm text-foreground">Strict Security Headers</h4>
              <p className="text-xs text-muted-foreground">
                CSP (strict child-src / connect-src to atlas.microsoft.com), HSTS 31536000s, X-Frame-Options DENY, X-Content-Type-Options nosniff.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-card border border-border space-y-2">
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">Tenant Scoped</Badge>
              <h4 className="font-semibold text-sm text-foreground">Multi-Tenant Isolation</h4>
              <p className="text-xs text-muted-foreground">
                Every DB query is derived exclusively from verified JWT token context. Foreign workspace lookups yield 404s (zero data leaks).
              </p>
            </div>

            <div className="p-4 rounded-lg bg-card border border-border space-y-2">
              <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">DST Fold</Badge>
              <h4 className="font-semibold text-sm text-foreground">Zoneinfo Temporal Guard</h4>
              <p className="text-xs text-muted-foreground">
                Spring-forward nonexistent gaps return 422, fall-back ambiguous overlap times require explicit PEP 495 fold parameter.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Driver PWA */}
      {activeTab === "pwa" && (
        <div className="space-y-6">
          <Card className="p-6 bg-card border-border space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              Driver PWA: Zero Hardware, Edge Resilience
            </h3>
            <p className="text-sm text-muted-foreground">
              Drivers require zero hardware install and zero app store download. Magic links authenticate ephemeral driver sessions stored as SHA-256 hashes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Screen Wake Lock API
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Acquires <code className="text-primary font-mono">navigator.wakeLock.request(&apos;screen&apos;)</code> on shift start and automatically re-acquires on document visibility change to prevent OS GPS throttling while foregrounded.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  IndexedDB Offline Queue
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Buffers up to 5,000 telemetry pings locally during cellular dead zones (e.g., tunnels, basements) and drains monotonically with client idempotency keys (<code className="text-primary font-mono">client_ping_id</code>).
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: SHA-256 Audit Chain */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <Card className="p-6 bg-card border-border space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-400" />
              Cryptographic SHA-256 Hash Chained Audit Ledger
            </h3>
            <p className="text-sm text-muted-foreground">
              Every mutating operational dispatch event (job creation, driver assignment, 1-tap route approval, stop arrival) is linked into a sequential hash chain.
            </p>

            <div className="p-4 bg-muted/50 rounded-lg border border-border font-mono text-xs space-y-2 text-zinc-300">
              <div className="text-purple-400 font-bold">{"// Canonical Hash Equation:"}</div>
              <div>Hash(seq) = SHA-256( Prev_Hash || Canonical_JSON(Seq, Workspace, Actor, Action, Entity, Payload, Timestamp) )</div>
              <div className="text-zinc-500 pt-1">{"// Genesis Hash: 64 zeros ('0' * 64)"}</div>
            </div>

            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs text-zinc-300 space-y-1">
              <span className="font-semibold text-purple-300">Tamper Detection Guarantee:</span>
              <p className="text-muted-foreground">
                Any retroactive alteration, row deletion, or out-of-order insertion immediately invalidates all subsequent hashes, pinpointing the exact sequence number where the breach occurred.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
