"use client";

import * as React from "react";
import Link from "next/link";
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
        "bg-brand-700 text-white shadow-tactile hover:bg-brand-800 active:bg-brand-900 dark:bg-brand-600 dark:hover:bg-brand-500",
      secondary:
        "bg-nexus-surface-lowest text-nexus-on-surface hover:bg-nexus-surface-container border border-nexus-outline-variant shadow-tactile",
      outline:
        "border border-nexus-outline-variant bg-transparent text-nexus-on-surface hover:bg-nexus-surface-low hover:border-nexus-outline",
      ghost:
        "bg-transparent text-nexus-on-surface hover:bg-nexus-surface-container hover:text-nexus-primary",
      danger:
        "bg-nexus-error text-white shadow-tactile hover:bg-red-700 active:bg-red-800",
      simulation:
        "bg-[#3a55c0] text-white shadow-tactile hover:bg-[#324aab] active:bg-[#2b3f93]",
      ai:
        "bg-brand-700 text-white shadow-tactile hover:bg-brand-800 active:bg-brand-900",
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

const LINK_VARIANTS = {
  primary: "bg-brand-700 text-white shadow-tactile hover:bg-brand-800 active:bg-brand-900 dark:bg-brand-600 dark:hover:bg-brand-500",
  secondary: "bg-nexus-surface-lowest text-nexus-on-surface hover:bg-nexus-surface-container border border-nexus-outline-variant shadow-tactile",
  inverse: "bg-white text-brand-800 hover:bg-brand-50 active:bg-brand-100 shadow-tactile",
} as const;

const LINK_SIZES = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl font-semibold",
} as const;

export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: keyof typeof LINK_VARIANTS;
  size?: keyof typeof LINK_SIZES;
}

/** A link styled as a button (avoids invalid <a><button> nesting). */
export function ButtonLink({ href, variant = "primary", size = "md", className, children, ...props }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-secondary focus-visible:ring-offset-2",
        LINK_VARIANTS[variant],
        LINK_SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
