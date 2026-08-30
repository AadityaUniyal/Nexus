"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "simulation" | "ai";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer rounded-lg";

    const variantStyles = {
      primary:
        "bg-nexus-primary-container text-white shadow-tactile hover:bg-nexus-primary hover:shadow-tactile-md active:bg-black",
      secondary:
        "bg-nexus-surface-container text-nexus-on-surface hover:bg-nexus-surface-high border border-nexus-outline-variant/60 shadow-sm",
      outline:
        "border border-nexus-outline-variant bg-transparent text-nexus-on-surface hover:bg-nexus-surface-low hover:border-nexus-outline",
      ghost:
        "bg-transparent text-nexus-on-surface hover:bg-nexus-surface-container hover:text-nexus-primary",
      danger:
        "bg-nexus-error text-white shadow-tactile hover:bg-red-700 active:bg-red-800",
      simulation:
        "bg-nexus-simulation text-white shadow-tactile hover:bg-purple-700 active:bg-purple-800 border border-purple-400/30",
      ai:
        "bg-nexus-ai text-white shadow-tactile hover:bg-indigo-700 active:bg-indigo-800",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5 rounded-xl font-semibold",
      icon: "h-9 w-9 p-0 text-sm",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
