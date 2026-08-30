"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * FadeIn wrapper with tactile physics spring
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.4,
  direction = "up",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}) {
  const getInitial = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 14 };
      case "down":
        return { opacity: 0, y: -14 };
      case "left":
        return { opacity: 0, x: 14 };
      case "right":
        return { opacity: 0, x: -14 };
      case "none":
      default:
        return { opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // Apple / Linear-style cubic bezier
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger list container for sequential card/row entrances
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.06,
  className,
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Tactile Card with subtle spring hover elevation
 */
export function TactileCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={{ scale: 0.99, transition: { duration: 0.1 } }}
      onClick={onClick}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Live LED Pulse Indicator
 */
export function PulseLED({
  color = "emerald",
  size = "md",
  className,
}: {
  color?: "emerald" | "amber" | "rose" | "indigo" | "purple";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const colorMap = {
    emerald: "bg-emerald-500 shadow-emerald-500/50",
    amber: "bg-amber-500 shadow-amber-500/50",
    rose: "bg-rose-500 shadow-rose-500/50",
    indigo: "bg-indigo-500 shadow-indigo-500/50",
    purple: "bg-purple-500 shadow-purple-500/50",
  };

  const pingMap = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
    indigo: "bg-indigo-400",
    purple: "bg-purple-400",
  };

  const sizeMap = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  return (
    <span className={cn("relative flex items-center justify-center", sizeMap[size], className)}>
      <motion.span
        animate={{ scale: [1, 2, 2], opacity: [0.8, 0, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", pingMap[color])}
      />
      <span className={cn("relative inline-flex rounded-full shadow-sm", sizeMap[size], colorMap[color])} />
    </span>
  );
}

/**
 * Animated Smooth Number Counter
 */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 600; // ms
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
