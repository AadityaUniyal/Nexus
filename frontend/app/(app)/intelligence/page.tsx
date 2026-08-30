"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, AlertTriangle, TrendingUp, Sparkles, Activity, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PatternIntelligencePage() {
  const patterns = [
    {
      id: "pat-1",
      title: "Seasonal Winter Corridor Disruption on Interstate 80",
      frequency: "High (Recurring between Nov - Mar)",
      confidence: "98.2%",
      impact: "Average +120m delay per westbound transit during blizzard level >= 3.",
      recommendation: "Pre-emptively route high-priority aerospace cargo through I-70 corridor during winter storm watches.",
      status: "ACTIVE_PATTERN",
    },
    {
      id: "pat-2",
      title: "Atlanta Gateway Dock 4-6 Late Afternoon Bottleneck",
      frequency: "Daily between 16:00 - 18:30 UTC",
      confidence: "92.4%",
      impact: "Turnaround time increases by 28% due to concurrent regional feeder arrivals.",
      recommendation: "Stagger feeder dispatch windows by 20 minutes from Dallas-Fort Worth terminal.",
      status: "MONITORED",
    },
    {
      id: "pat-3",
      title: "Electric Class-8 Battery Discharge Variance in High Altitude",
      frequency: "Low Temperature (< -5°C) & Gradient > 4%",
      confidence: "94.6%",
      impact: "Consumption increases by 18% during Denver Mountain ascent.",
      recommendation: "Schedule high-voltage top-up at Cheyenne Gateway before mountain transit.",
      status: "OPTIMIZED",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span>Machine Learning & Heuristics</span>
              <span>·</span>
              <span>Long-Term Spatial Patterns</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Pattern Intelligence & Anomaly Engine
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/simulations/new">
              <Button variant="simulation" size="sm" className="font-mono-data text-xs shadow-tactile">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Simulate Pattern Mitigation
              </Button>
            </Link>
          </div>
        </div>

        {/* Pattern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {patterns.map((pat) => (
            <Card key={pat.id} className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono-data font-bold text-nexus-secondary uppercase">
                      {pat.status}
                    </span>
                    <Badge variant="healthy" size="sm">
                      {pat.confidence} Match
                    </Badge>
                  </div>
                  <CardTitle className="text-sm mt-2">{pat.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono-data text-nexus-on-surface-variant uppercase block">
                      Frequency:
                    </span>
                    <p className="text-nexus-on-surface font-medium">{pat.frequency}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono-data text-nexus-on-surface-variant uppercase block">
                      Operational Impact:
                    </span>
                    <p className="text-nexus-on-surface-variant">{pat.impact}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-nexus-surface-container/60 border border-nexus-outline-variant/30 text-nexus-on-surface font-sans">
                    <span className="font-bold text-nexus-secondary font-mono-data">Action: </span>
                    {pat.recommendation}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 border-t border-nexus-outline-variant/30 flex justify-end">
                <Link href="/simulations/new">
                  <Button variant="ghost" size="sm" className="text-xs font-mono-data">
                    Simulate Rule <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
