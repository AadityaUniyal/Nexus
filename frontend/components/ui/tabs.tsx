"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { tactileAudio } from "@/lib/sound-effects";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  badge?: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "pill" | "line" | "segmented";
  size?: "sm" | "md" | "lg";
  layoutId?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = "pill",
  size = "md",
  layoutId,
}: TabsProps) {
  const generatedId = React.useId();
  const activeLayoutId = layoutId || generatedId;
  const lineLayoutId = `${activeLayoutId}-activeTabLine`;
  const pillLayoutId = `${activeLayoutId}-activeTabPill`;

  const handleSelect = (id: string) => {
    if (id !== activeTab) {
      tactileAudio.playClick();
      onChange(id);
    }
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-xs gap-2",
    lg: "px-4 py-2 text-sm gap-2.5",
  }[size];

  // LINE VARIANT: Apple macOS style tab strip with glowing accent underline
  if (variant === "line") {
    return (
      <div
        role="tablist"
        className={cn(
          "flex border-b border-stone-200/80 dark:border-stone-800/80 gap-6 overflow-x-auto no-scrollbar",
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const tabKey = `${activeLayoutId}-tab-${tab.id}`;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={tabKey}
              aria-selected={isActive}
              aria-controls={`${activeLayoutId}-panel-${tab.id}`}
              onClick={() => handleSelect(tab.id)}
              className={cn(
                "relative pb-3 text-xs md:text-sm font-medium transition-all flex items-center gap-2 select-none whitespace-nowrap",
                isActive
                  ? "text-stone-900 dark:text-white font-semibold"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              )}
            >
              <span className={cn(
                "transition-colors",
                isActive ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400 dark:text-stone-500"
              )}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>

              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] rounded-full font-mono font-bold transition-all",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200/50 dark:border-stone-700/50"
                  )}
                >
                  {tab.count}
                </span>
              )}

              {tab.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  {tab.badge}
                </span>
              )}

              {isActive && (
                <motion.div
                  layoutId={lineLayoutId}
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // PILL & SEGMENTED VARIANT: Apple Cupertino / macOS Sequoia floating segmented control
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center p-1 rounded-2xl bg-stone-200/60 dark:bg-stone-900/80 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.12] shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] gap-1 max-w-full overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const tabKey = `${activeLayoutId}-tab-${tab.id}`;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabKey}
            aria-selected={isActive}
            aria-controls={`${activeLayoutId}-panel-${tab.id}`}
            onClick={() => handleSelect(tab.id)}
            className={cn(
              "relative font-medium rounded-xl transition-all flex items-center select-none whitespace-nowrap",
              sizeClasses,
              isActive
                ? "text-stone-900 dark:text-white font-semibold"
                : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={pillLayoutId}
                className="absolute inset-0 rounded-xl bg-white dark:bg-stone-800/95 border border-black/[0.08] dark:border-white/[0.12] shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span className={cn(
                "transition-colors",
                isActive ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400 dark:text-stone-500"
              )}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-mono rounded-full font-bold transition-all",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-stone-300/50 dark:bg-stone-700/60 text-stone-600 dark:text-stone-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
