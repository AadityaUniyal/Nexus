"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "./dialog";
import { Search, Truck, AlertTriangle, Sparkles, LayoutDashboard, Globe2, FileText, ArrowRight, Shield, MapPin } from "lucide-react";
import { INITIAL_VEHICLES, INITIAL_INCIDENTS, INITIAL_WAREHOUSES } from "@/lib/mock-data";
import { tactileAudio } from "@/lib/sound-effects";

export interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      tactileAudio.playTelemetryPing();
    }
  }, [isOpen]);

  const navigateTo = (path: string) => {
    tactileAudio.playClick();
    onClose();
    router.push(path);
  };

  const navItems = [
    { label: "Overview Operations Grid", path: "/overview", icon: <LayoutDashboard className="h-4 w-4 text-emerald-600" /> },
    { label: "Live Spatial GIS World Map", path: "/live-world", icon: <Globe2 className="h-4 w-4 text-nexus-primary" /> },
    { label: "Interactive Simulation Lab", path: "/simulations/new", icon: <Sparkles className="h-4 w-4 text-purple-600" /> },
    { label: "Incident Intelligence & Mitigation", path: "/incidents", icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
    { label: "Fleet Telemetry & Drivers", path: "/operations/vehicles", icon: <Truck className="h-4 w-4 text-blue-600" /> },
    { label: "Executive Decision Briefings", path: "/reports", icon: <FileText className="h-4 w-4 text-stone-600" /> },
    { label: "Admin & Pipeline Governance", path: "/admin", icon: <Shield className="h-4 w-4 text-amber-600" /> },
  ];

  const matchedVehicles = INITIAL_VEHICLES.filter(
    (v) => v.code.toLowerCase().includes(query.toLowerCase()) || v.name.toLowerCase().includes(query.toLowerCase())
  );

  const matchedIncidents = INITIAL_INCIDENTS.filter(
    (i) => i.code.toLowerCase().includes(query.toLowerCase()) || i.title.toLowerCase().includes(query.toLowerCase())
  );

  const matchedWarehouses = INITIAL_WAREHOUSES.filter(
    (w) => w.code.toLowerCase().includes(query.toLowerCase()) || w.name.toLowerCase().includes(query.toLowerCase()) || w.city.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-4">
        {/* Search bar input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-nexus-outline" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, city, vehicle code (NX-101), or incident..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-nexus-surface-container/60 border border-nexus-outline-variant/40 text-sm text-nexus-on-surface focus:outline-none focus:ring-2 focus:ring-nexus-secondary"
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Navigation links */}
          <div>
            <span className="text-[10px] font-mono-data text-nexus-on-surface-variant font-bold uppercase tracking-wider block px-2 mb-1">
              Platform Destinations
            </span>
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigateTo(item.path)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-nexus-surface-container text-nexus-on-surface text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span className="font-semibold">{item.label}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-nexus-outline" />
                </button>
              ))}
            </div>
          </div>

          {/* Matched Warehouses */}
          {matchedWarehouses.length > 0 && (
            <div>
              <span className="text-[10px] font-mono-data text-nexus-on-surface-variant font-bold uppercase tracking-wider block px-2 mb-1">
                Logistics Hubs & Terminals
              </span>
              <div className="space-y-1">
                {matchedWarehouses.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => navigateTo(`/operations/warehouses`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-nexus-surface-container text-nexus-on-surface text-left transition-colors font-mono-data"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-bold">{w.code}</span>
                      <span className="text-nexus-on-surface-variant">({w.city})</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold">{w.efficiencyPct}% Cap</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Vehicles */}
          {matchedVehicles.length > 0 && (
            <div>
              <span className="text-[10px] font-mono-data text-nexus-on-surface-variant font-bold uppercase tracking-wider block px-2 mb-1">
                Fleet Vehicles
              </span>
              <div className="space-y-1">
                {matchedVehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => navigateTo(`/operations/vehicles`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-nexus-surface-container text-nexus-on-surface text-left transition-colors font-mono-data"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-nexus-secondary" />
                      <span className="font-bold">{v.code}</span>
                      <span className="text-nexus-on-surface-variant">({v.model})</span>
                    </div>
                    <span className="text-[11px] text-nexus-secondary font-semibold">{v.speedKmh} km/h</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Incidents */}
          {matchedIncidents.length > 0 && (
            <div>
              <span className="text-[10px] font-mono-data text-nexus-on-surface-variant font-bold uppercase tracking-wider block px-2 mb-1">
                Active Incidents
              </span>
              <div className="space-y-1">
                {matchedIncidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => navigateTo(`/incidents/${inc.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-nexus-surface-container text-nexus-on-surface text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      <span className="font-bold font-mono-data">{inc.code}</span>
                      <span className="truncate max-w-xs">{inc.title}</span>
                    </div>
                    <span className="text-[11px] text-red-700 font-mono-data font-semibold">+{inc.delayMinutes}m</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
