"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { dataProvider } from "@/lib/data-provider";
import { Truck, Building2, Package, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

export default function CompanyAdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = React.useState<{ vehicles: number; warehouses: number; orders: number; incidents: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [vehicles, warehouses, orders, incidents] = await Promise.all([
        dataProvider.getVehicles(), dataProvider.getWarehouses(), dataProvider.getOrders(), dataProvider.getIncidents(),
      ]);
      setMetrics({ vehicles: vehicles.length, warehouses: warehouses.length, orders: orders.length, incidents: incidents.length });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workspace data could not be loaded.");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const cards = [
    { label: "Vehicles", count: metrics?.vehicles, icon: Truck, href: "/operations?tab=vehicles" },
    { label: "Locations", count: metrics?.warehouses, icon: Building2, href: "/operations?tab=warehouses" },
    { label: "Orders", count: metrics?.orders, icon: Package, href: "/operations?tab=orders" },
    { label: "Incidents", count: metrics?.incidents, icon: AlertTriangle, href: "/incidents" },
  ];

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-nexus-on-surface-variant">Workspace administration</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-nexus-on-surface">{user?.workspace_name || "Your workspace"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-nexus-on-surface-variant">Manage operational records and account settings. Counts below come from this workspace’s saved records.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </header>

        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300"><span>{error}</span><Button size="sm" variant="outline" onClick={() => void load()}>Retry</Button></div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace record totals">
          {cards.map(({ label, count, icon: Icon, href }) => (
            <Link key={label} href={href} className="group">
              <Card className="h-full transition-colors group-hover:border-nexus-primary/40">
                <CardContent className="flex items-center justify-between p-5">
                  <div><p className="text-sm text-nexus-on-surface-variant">{label}</p><p className="mt-2 text-3xl font-semibold text-nexus-on-surface">{loading ? "…" : count ?? "Unavailable"}</p></div>
                  <Icon className="h-5 w-5 text-nexus-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Workspace setup</CardTitle>
            <CardDescription>Keep the operational records and preferences your team actually uses up to date.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link href="/operations" className="flex items-center justify-between rounded-xl border border-nexus-outline-variant/40 p-4 text-sm hover:bg-nexus-surface-container/40">
              <span>Manage fleet, locations, routes, and orders</span><ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/settings" className="flex items-center justify-between rounded-xl border border-nexus-outline-variant/40 p-4 text-sm hover:bg-nexus-surface-container/40">
              <span>Account and workspace preferences</span><ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
