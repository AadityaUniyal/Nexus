"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  side?: "right" | "left";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "md",
  side = "right",
}: DrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const widthClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className={cn(
              "relative ml-auto w-full bg-nexus-surface-lowest shadow-2xl border-l border-nexus-outline-variant/30 flex flex-col h-full z-50",
              widthClasses[width]
            )}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-nexus-outline-variant/30 flex items-center justify-between bg-nexus-surface/50">
              <div>
                {title && (
                  <h2 className="text-base font-semibold text-nexus-on-surface tracking-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs text-nexus-on-surface-variant font-mono-data mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-nexus-on-surface-variant hover:text-nexus-on-surface hover:bg-nexus-surface-container transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
