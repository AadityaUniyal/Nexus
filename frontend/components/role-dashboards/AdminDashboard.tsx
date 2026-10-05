"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ShieldCheck,
  Cpu,
  KeyRound,
  Users,
  Lock,
  Radio,
  FileCode,
  CheckCircle2,
  Server,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricTile } from "@/components/ui/metric-tile";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export function AdminDashboard() {
  const { toast } = useToast();
  const [passkeyBound, setPasskeyBound] = React.useState(true);

  const sampleLedger = [
    {
      id: "tx-8901",
      action: "REROUTE_DISPATCHED",
      actor: "Nexus Neural Engine",
      target: "Vehicle NX-804",
      hash: "8f4a...92b1",
      time: "2 mins ago",
    },
    {
      id: "tx-8900",
      action: "ROLE_PERMISSION_UPDATED",
      actor: "Elena Rostova (Admin)",
      target: "User ID u-3829",
      hash: "3c7e...64d2",
      time: "18 mins ago",
    },
    {
      id: "tx-8899",
      action: "SIMULATION_COMMITTED",
      actor: "Operations Manager",
      target: "Scenario I-80 Detour",
      hash: "e1a9...55ff",
      time: "1 hour ago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Infrastructure Telemetry KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Data Pipeline Health"
          value="18ms"
          subtitle="Azure IoT Ingest Latency"
          change="99.99% throughput"
          trend="up"
          status="HEALTHY"
          icon={Cpu}
          variant="default"
        />
        <MetricTile
          title="Cryptographic Ledger"
          value="100%"
          subtitle="SHA-256 Signed"
          change="0 tampered blocks"
          trend="up"
          status="HEALTHY"
          icon={ShieldCheck}
          variant="default"
        />
        <MetricTile
          title="Active Tenant Workspaces"
          value="14"
          subtitle="Multi-Tenant Enclaves"
          change="Isolated RLS schemas"
          trend="up"
          status="HEALTHY"
          icon={Server}
          variant="default"
        />
        <MetricTile
          title="Hardware Passkeys"
          value="28/28"
          subtitle="FIDO2 / WebAuthn"
          change="Zero weak passwords"
          trend="up"
          status="HEALTHY"
          icon={KeyRound}
          variant="default"
        />
      </div>

      {/* Admin Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pipeline Health & Security Policy */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile bg-nexus-surface-container">
            <CardHeader className="pb-3 border-b border-nexus-outline/20">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-nexus-secondary text-white shadow-xs">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-mono font-bold">
                    Aegis Security & Policy Matrix
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Multi-tenant workspace governance and hardware security
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                <div>
                  <div className="font-bold text-nexus-on-surface">WebAuthn / Passkey Enforcement</div>
                  <div className="text-[10px] text-nexus-on-surface-variant">Require TouchID / Yubikey on login</div>
                </div>
                <Badge variant="healthy">ACTIVE</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                <div>
                  <div className="font-bold text-nexus-on-surface">PostgreSQL Row-Level Security (RLS)</div>
                  <div className="text-[10px] text-nexus-on-surface-variant">Strict tenant isolation on workspace_id</div>
                </div>
                <Badge variant="healthy">ENFORCED</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                <div>
                  <div className="font-bold text-nexus-on-surface">API Gateway Rate Limit Governor</div>
                  <div className="text-[10px] text-nexus-on-surface-variant">Max 2,400 requests / min per IP</div>
                </div>
                <span className="text-[10px] text-nexus-on-surface-variant font-bold">2,400 req/m</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Cryptographic Immutable Action Ledger */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-nexus-outline/30 shadow-tactile">
            <CardHeader className="pb-3 border-b border-nexus-outline/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-mono font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-nexus-secondary" />
                  Immutable Cryptographic Action Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  SHA-256 hash chained proof of human and autonomous decisions
                </CardDescription>
              </div>
              <Badge variant="simulation" className="font-mono text-[10px]">
                Chain Verified ✓
              </Badge>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-nexus-surface-container-high/60 border-b border-nexus-outline/20 text-nexus-on-surface-variant text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Proof Hash</th>
                    <th className="py-2.5 px-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-outline/10">
                  {sampleLedger.map((tx) => (
                    <tr key={tx.id} className="hover:bg-nexus-surface-container-high/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-nexus-on-surface">{tx.action}</td>
                      <td className="py-3 px-3 text-nexus-on-surface-variant">{tx.actor}</td>
                      <td className="py-3 px-3 text-nexus-secondary font-semibold">{tx.target}</td>
                      <td className="py-3 px-3">
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-nexus-surface border border-nexus-outline/30">
                          {tx.hash}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-right text-nexus-on-surface-variant">{tx.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
