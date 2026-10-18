"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface AppleCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  className?: string;
  /** Whether to add the spring hover lift effect */
  interactive?: boolean;
  /** Glass material style */
  glass?: boolean;
}

/**
 * AppleCard — a frosted-glass surface card with spring hover lift.
 * Matches apple.com's material language: translucency, subtle shadow, thin border.
 */
export function AppleCard({
  children,
  className,
  interactive = true,
  glass = false,
  ...props
}: AppleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.7 }}
      whileHover={
        interactive
          ? {
              y: -2,
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
              transition: { type: "spring", stiffness: 500, damping: 35 },
            }
          : undefined
      }
      className={cn(
        "rounded-2xl border overflow-hidden",
        glass
          ? "bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border-white/30 dark:border-white/10 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.04)]"
          : "bg-white dark:bg-stone-900 border-stone-200/60 dark:border-stone-800/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface AppleCardHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function AppleCardHeader({
  title,
  description,
  icon,
  action,
  className,
}: AppleCardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-5 pt-5 pb-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 tracking-[-0.014em]">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function AppleCardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-5 pb-5", className)}>{children}</div>
  );
}
