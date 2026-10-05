"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  Truck,
  LineChart,
  Shield,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { tactileAudio } from "@/lib/sound-effects";

export type RoleType =
  | "OPERATIONS_MANAGER"
  | "OPERATOR"
  | "ANALYST"
  | "ADMINISTRATOR"
  | "VIEWER";

export interface RoleCockpitSwitcherProps {
  activeRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  className?: string;
}

const ROLES: Array<{
  id: RoleType;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}> = [
  {
    id: "OPERATIONS_MANAGER",
    label: "Tactical Manager",
    sublabel: "Incident Commander",
    icon: ShieldAlert,
  },
  {
    id: "OPERATOR",
    label: "Field Operator",
    sublabel: "Driver & Dispatch HUD",
    icon: Truck,
  },
  {
    id: "ANALYST",
    label: "Data Analyst",
    sublabel: "Predictive Lab",
    icon: LineChart,
  },
  {
    id: "ADMINISTRATOR",
    label: "Admin / Security",
    sublabel: "Aegis Governance",
    icon: Shield,
  },
  {
    id: "VIEWER",
    label: "Executive Viewer",
    sublabel: "Boardroom Suite",
    icon: Eye,
  },
];

export function RoleCockpitSwitcher({
  activeRole,
  onRoleChange,
  className = "",
}: RoleCockpitSwitcherProps) {
  return (
    <div
      className={`p-1.5 rounded-2xl bg-nexus-surface-container-high/80 backdrop-blur-md border border-nexus-outline/30 shadow-xs flex flex-wrap items-center gap-1 ${className}`}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-nexus-on-surface-variant uppercase font-semibold">
        <SlidersHorizontal className="w-3.5 h-3.5 text-nexus-secondary" />
        <span>Cockpit View:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {ROLES.map((r) => {
          const isActive = activeRole === r.id;
          const Icon = r.icon;

          return (
            <button
              key={r.id}
              onClick={() => {
                if (!isActive) {
                  tactileAudio.playClick();
                  onRoleChange(r.id);
                }
              }}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? "text-nexus-on-surface font-bold shadow-xs"
                  : "text-nexus-on-surface-variant hover:text-nexus-on-surface hover:bg-nexus-surface-container-highest/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeRoleCockpitPill"
                  className="absolute inset-0 rounded-xl bg-nexus-surface border border-nexus-outline/40 shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-nexus-secondary" : "text-nexus-on-surface-variant"}`} />
                <span>{r.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
