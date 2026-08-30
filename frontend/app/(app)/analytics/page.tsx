"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric-tile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Download, Calendar, Activity, Truck, Building2 } from "lucide-react";
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
} from "recharts";

const SLA_TREND_DATA = [
  { time: "00:00", adherence: 98.2, target: 95 },
  { time: "04:00", adherence: 99.0, target: 95 },
  { time: "08:00", adherence: 96.4, target: 95 },
  { time: "12:00", adherence: 94.8, target: 95 },
  { time: "16:00", adherence: 95.2, target: 95 },
  { time: "20:00", adherence: 97.4, target: 95 },
  { time: "24:00", adherence: 98.0, target: 95 },
];

const HUB_THROUGHPUT_DATA = [
  { hub: "Chicago", volume: 12450, capacity: 15000 },
  { hub: "Dallas", volume: 14200, capacity: 18000 },
  { hub: "Atlanta", volume: 11100, capacity: 14000 },
  { hub: "Denver", volume: 7200, capacity: 10000 },
  { hub: "Seattle", volume: 8900, capacity: 12000 },
  { hub: "New York", volume: 17800, capacity: 20000 },
];

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span>Operational Analytics</span>
              <span>·</span>
              <span>PostgreSQL & Fabric Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Performance & SLA Analytics
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" className="font-mono-data text-xs">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Top Analytics Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricTile
            title="SLA Compliance Rate"
            value="97.4%"
            subtitle="+2.4% above 95.0% contract target"
            trend="up"
            status="HEALTHY"
            icon={Activity}
          />
          <MetricTile
            title="Avg Turnaround Time"
            value="42 mins"
            subtitle="-8 mins vs 30-day baseline"
            trend="up"
            status="HEALTHY"
            icon={Truck}
          />
          <MetricTile
            title="Total Network Volume"
            value="71,650"
            subtitle="Units processed across 6 superhubs"
            trend="neutral"
            status="OPERATIONAL"
            icon={Building2}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SLA Adherence 24-Hour Timeline */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-sm">24-Hour SLA Compliance Adherence</CardTitle>
                <CardDescription>Target SLA benchmark threshold at 95.0%</CardDescription>
              </div>
              <Badge variant="healthy" size="sm">
                97.4% Current
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SLA_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="slaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2d6955" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2d6955" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e2e0" opacity={0.6} />
                    <XAxis dataKey="time" stroke="#757872" fontSize={11} fontFamily="JetBrains Mono" />
                    <YAxis domain={[90, 100]} stroke="#757872" fontSize={11} fontFamily="JetBrains Mono" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#c5c7c1",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        fontFamily: "JetBrains Mono",
                      }}
                    />
                    <Area type="monotone" dataKey="adherence" stroke="#2d6955" strokeWidth={2.5} fillOpacity={1} fill="url(#slaGradient)" name="SLA %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Hub Capacity & Volume Bar Chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-sm">Warehouse Volume vs Available Capacity</CardTitle>
                <CardDescription>Live storage utilization across primary hubs</CardDescription>
              </div>
              <Badge variant="neutral" size="sm">
                6 Facilities
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={HUB_THROUGHPUT_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e2e0" opacity={0.6} />
                    <XAxis dataKey="hub" stroke="#757872" fontSize={11} fontFamily="JetBrains Mono" />
                    <YAxis stroke="#757872" fontSize={11} fontFamily="JetBrains Mono" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#c5c7c1",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        fontFamily: "JetBrains Mono",
                      }}
                    />
                    <Bar dataKey="volume" fill="#20231f" radius={[4, 4, 0, 0]} name="Current Load" />
                    <Bar dataKey="capacity" fill="#dcd9d8" radius={[4, 4, 0, 0]} name="Total Capacity" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
