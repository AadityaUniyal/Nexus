import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: "py-8",
      icon: "h-8 w-8",
      title: "text-sm",
      description: "text-xs",
    },
    md: {
      container: "py-12",
      icon: "h-12 w-12",
      title: "text-base",
      description: "text-sm",
    },
    lg: {
      container: "py-16",
      icon: "h-16 w-16",
      title: "text-lg",
      description: "text-base",
    },
  };

  const sizeStyles = sizes[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeStyles.container,
        className
      )}
    >
      {Icon && (
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-nexus-primary/5 rounded-full blur-xl" />
          <div className="relative p-4 rounded-2xl bg-nexus-surface-container border border-nexus-outline-variant/40">
            <Icon
              className={cn(
                sizeStyles.icon,
                "text-nexus-on-surface-variant"
              )}
            />
          </div>
        </div>
      )}
      
      <h3
        className={cn(
          "font-semibold text-nexus-on-surface tracking-tight",
          sizeStyles.title
        )}
      >
        {title}
      </h3>
      
      <p
        className={cn(
          "mt-2 text-nexus-on-surface-variant max-w-sm leading-relaxed",
          sizeStyles.description
        )}
      >
        {description}
      </p>
      
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
