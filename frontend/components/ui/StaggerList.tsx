"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 40,
      mass: 0.6,
    },
  },
};

interface StaggerListProps {
  children: React.ReactNode[];
  className?: string;
  /** Unique key for AnimatePresence re-triggering */
  listKey?: string;
}

/**
 * StaggerList — wraps array children in a stagger-animated list.
 * Each child appears with a spring cascade from top to bottom.
 */
export function StaggerList({ children, className, listKey }: StaggerListProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={listKey}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className={cn("space-y-1", className)}
      >
        {React.Children.map(children, (child, i) => (
          <motion.div key={i} variants={staggerItem}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

/** A single stagger item — use inside custom motion containers */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/** Convenience wrapper for a stagger parent container */
export function StaggerContainer({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.07,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}
