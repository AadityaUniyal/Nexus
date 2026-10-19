"use client";

import * as React from "react";
import { Activity, Database, HardDrive, Radio, RefreshCw, Server } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Service = { status: string; eventsReceived?: number; lastEventAt?: string | null };
type Telemetry = { services?: Record<string, Service>; timestamp?: string };

const labels: Record<string, { name: string; description: string; icon: React.ElementType }> = {
  iotHub: { name: "Azure IoT Hub", description: "Device telemetry ingestion", icon: Radio },
  blobStorage: { name: "Azure Blob Storage", description: "Raw telemetry archive and checkpoints", icon: HardDrive },
  applicationInsights: { name: "Application Insights", description: "Backend traces and diagnostics", icon: Activity },
  database: { name: "Application database", description: "Production operational records", icon: Database },
  fabric: { name: "Microsoft Fabric", description: "Analytics warehouse", icon: Server },
};

export function AzureCloudAnalytics() {
  const [data, setData] = React.useState<Telemetry | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const refresh = React.useCallback(async () => {
    try {
      const response = await fetch("/api/v1/admin/azure/telemetry", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Admin access is required to view integration status." : `Status request failed (${response.status}).`);
      setData(await response.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load integration status.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);
  const services = data?.services ?? {};

  return (
    <div className="space-y-6">
      <Card className="border-nexus-outline/30 shadow-tactile">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-nexus-outline/20">
          <div>
            <CardTitle className="text-base">Cloud integrations</CardTitle>
            <CardDescription>Live configuration and ingestion state reported by the production API.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {Object.entries(labels).map(([key, item]) => {
            const service = services[key];
            const state = service?.status ?? (loading ? "CHECKING" : "UNKNOWN");
            const Icon = item.icon;
            return (
              <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-nexus-outline/20 bg-nexus-surface-container-high/40 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-nexus-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-nexus-on-surface-variant">{item.description}{key === "iotHub" && service?.eventsReceived != null ? ` · ${service.eventsReceived} events consumed` : ""}</p>
                  </div>
                </div>
                <Badge variant={state === "CONNECTED" || state === "CONFIGURED" ? "healthy" : "neutral"}>{state.replaceAll("_", " ")}</Badge>
              </div>
            );
          })}
          {data?.timestamp && <p className="text-right text-xs text-nexus-on-surface-variant">Checked {new Date(data.timestamp).toLocaleString()}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
