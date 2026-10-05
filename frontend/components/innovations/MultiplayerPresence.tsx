"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Eye, Shield, Cpu, Radio, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ActiveCollaborator {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  activeSection: string;
  isInspectingIncident?: boolean;
}

const SAMPLE_COLLABORATORS: ActiveCollaborator[] = [
  {
    id: "collab-1",
    name: "Elena Rostova",
    role: "Operations Manager",
    avatarBg: "bg-emerald-600",
    activeSection: "Corridor I-80 Triage",
    isInspectingIncident: true,
  },
  {
    id: "collab-2",
    name: "Marcus Vance",
    role: "Field Dispatcher",
    avatarBg: "bg-blue-600",
    activeSection: "Dehradun Dock Hub",
  },
  {
    id: "collab-3",
    name: "Aegis AI Copilot",
    role: "Autonomous Agent",
    avatarBg: "bg-purple-600",
    activeSection: "Neural Reroute Optim.",
  },
];

export function MultiplayerPresence() {
  const [collaborators] = React.useState<ActiveCollaborator[]>(SAMPLE_COLLABORATORS);
  const [showTooltip, setShowTooltip] = React.useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-nexus-surface-container-high/90 backdrop-blur-md border border-nexus-outline/30 shadow-xs">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-mono font-medium text-nexus-on-surface-variant hidden sm:inline">
          Live War Room:
        </span>
      </div>

      {/* Avatars Pile */}
      <div className="flex -space-x-2 overflow-hidden items-center">
        {collaborators.map((c) => (
          <div
            key={c.id}
            className="relative cursor-pointer group"
            onMouseEnter={() => setShowTooltip(c.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <div
              className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold text-white ring-2 ring-nexus-surface-container ${c.avatarBg} shadow-xs transition-transform hover:scale-110`}
            >
              {c.name.substring(0, 2).toUpperCase()}
            </div>

            {/* Hover Pill Tooltip */}
            <AnimatePresence>
              {showTooltip === c.id && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-8 z-50 min-w-[180px] p-2.5 rounded-xl bg-nexus-surface-container-highest border border-nexus-outline/40 shadow-xl text-left pointer-events-none"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-nexus-on-surface">
                      {c.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-nexus-surface border border-nexus-outline/30 text-nexus-on-surface-variant">
                      {c.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    <Eye className="w-3 h-3" />
                    <span>{c.activeSection}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <span className="text-[10px] font-mono font-semibold text-nexus-secondary px-1.5 py-0.5 rounded bg-nexus-secondary/10">
        3 Co-Triage
      </span>
    </div>
  );
}
