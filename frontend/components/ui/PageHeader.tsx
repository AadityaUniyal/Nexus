"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Apple-style page header — tight tracking, thin weight, spring entrance.
 * Used on every app page for consistent visual rhythm.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.8 }}
      className={cn(
        "flex flex-col md:flex-row md:items-start justify-between gap-4 pb-2",
        className
      )}
    >
      <div className="space-y-1">
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500"
          >
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 500, damping: 40 }}
          className="text-2xl md:text-3xl font-semibold text-stone-900 dark:text-stone-50 tracking-[-0.024em] leading-tight"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className="text-sm text-stone-500 dark:text-stone-400 max-w-2xl leading-relaxed"
          >
            {description}
          </motion.p>
        )}
      </div>

      {actions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 500, damping: 35 }}
          className="flex items-center gap-2 shrink-0"
        >
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
}
