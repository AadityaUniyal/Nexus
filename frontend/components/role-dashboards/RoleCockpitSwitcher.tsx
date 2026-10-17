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
import { cn } from "@/lib/utils";

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
  accent: string;
}> = [
  {
    id: "OPERATIONS_MANAGER",
    label: "Tactical Manager",
    sublabel: "Incident Commander",
    icon: ShieldAlert,
    accent: "text-rose-500",
  },
  {
    id: "OPERATOR",
    label: "Field Operator",
    sublabel: "Driver & Dispatch HUD",
    icon: Truck,
    accent: "text-amber-500",
  },
  {
    id: "ANALYST",
    label: "Data Analyst",
    sublabel: "Predictive Lab",
    icon: LineChart,
    accent: "text-sky-500",
  },
  {
    id: "ADMINISTRATOR",
    label: "Solo Admin / Security",
    sublabel: "Aegis Governance",
    icon: Shield,
    accent: "text-purple-500",
  },
  {
    id: "VIEWER",
    label: "Executive Viewer",
    sublabel: "Boardroom Suite",
    icon: Eye,
    accent: "text-emerald-500",
  },
];

export function normalizeRole(role?: string | null): RoleType {
  if (!role) return "OPERATIONS_MANAGER";
  const r = role.toUpperCase();
  if (r === "SUPERVISOR_L1" || r === "OPERATIONS_MANAGER") return "OPERATIONS_MANAGER";
  if (r === "SUPERVISOR_L2" || r === "SUPERVISOR_L3" || r === "OPERATOR" || r === "FIELD_OPERATOR") return "OPERATOR";
  if (r === "ANALYST" || r === "SUPPLY_CHAIN_ANALYST") return "ANALYST";
  if (r === "ADMINISTRATOR" || r === "ADMIN" || r === "SOLO_ADMIN") return "ADMINISTRATOR";
  if (r === "VIEWER" || r === "GUEST" || r === "AUDITOR") return "VIEWER";
  return "OPERATIONS_MANAGER";
}

export function RoleCockpitSwitcher({
  activeRole,
  onRoleChange,
  className = "",
}: RoleCockpitSwitcherProps) {
  const normalizedActive = normalizeRole(activeRole);

  return (
    <div
      className={cn(
        "p-1 rounded-2xl bg-stone-200/60 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-300/40 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] flex flex-wrap items-center gap-1",
        className
      )}
    >
      <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono text-stone-600 dark:text-stone-400 uppercase font-bold tracking-wider">
        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Cockpit View:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {ROLES.map((r) => {
          const isActive = normalizedActive === r.id;
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
              className={cn(
                "relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-2 select-none",
                isActive
                  ? "text-stone-900 dark:text-white font-semibold"
                  : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeRoleCockpitPill"
                  className="absolute inset-0 rounded-xl bg-white dark:bg-stone-800/95 border border-black/5 dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={cn("w-3.5 h-3.5 transition-colors", isActive ? r.accent : "text-stone-400 dark:text-stone-500")} />
                <span>{r.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
