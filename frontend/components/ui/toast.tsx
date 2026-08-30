"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Sparkles, X, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: "success" | "warning" | "critical" | "info" | "simulation" | "ai";
}

interface ToastContextType {
  toast: (msg: Omit<ToastMessage, "id">) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { ...msg, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const icons = {
              success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
              warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
              critical: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />,
              info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />,
              simulation: <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />,
              ai: <BrainCircuit className="h-5 w-5 text-purple-700 dark:text-purple-300 shrink-0" />,
            };

            const borderColors = {
              success: "border-emerald-500/30",
              warning: "border-amber-500/30",
              critical: "border-red-500/30",
              info: "border-blue-500/30",
              simulation: "border-purple-500/40",
              ai: "border-purple-500/50",
            };

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
                className={cn(
                  "pointer-events-auto p-4 rounded-xl bg-nexus-surface-lowest shadow-tactile-lg border flex items-start gap-3 relative",
                  borderColors[t.type || "info"]
                )}
              >
                {icons[t.type || "info"]}
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-semibold text-nexus-on-surface">{t.title}</h4>
                  {t.message && <p className="text-xs text-nexus-on-surface-variant mt-0.5">{t.message}</p>}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-nexus-outline hover:text-nexus-on-surface p-1 rounded transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
