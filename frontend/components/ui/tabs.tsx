"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "pill" | "line";
  layoutId?: string;
}

export function Tabs({ tabs, activeTab, onChange, className, variant = "pill", layoutId }: TabsProps) {
  const generatedId = React.useId();
  const activeLayoutId = layoutId || generatedId;
  const lineLayoutId = `${activeLayoutId}-activeTabLine`;
  const pillLayoutId = `${activeLayoutId}-activeTabPill`;

  if (variant === "line") {
    return (
      <div className={cn("flex border-b border-nexus-outline-variant/40 space-x-6", className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors flex items-center gap-2 select-none",
                isActive
                  ? "text-nexus-primary font-semibold"
                  : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[11px] rounded-full font-mono-data",
                    isActive
                      ? "bg-nexus-primary-container text-white"
                      : "bg-nexus-surface-container text-nexus-on-surface-variant"
                  )}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId={lineLayoutId}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-nexus-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-xl bg-nexus-surface-container/70 border border-nexus-outline-variant/30 gap-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 select-none",
              isActive
                ? "text-nexus-on-surface font-semibold shadow-tactile"
                : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={pillLayoutId}
                className="absolute inset-0 bg-white rounded-lg border border-black/5 shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] rounded-full font-mono-data",
                    isActive
                      ? "bg-nexus-primary text-white"
                      : "bg-nexus-surface-container-high text-nexus-on-surface-variant"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
