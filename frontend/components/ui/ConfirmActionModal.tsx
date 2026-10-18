"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  affectedEntities?: Array<{ type: string; id: string; name: string }>;
  consequenceWarning?: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger" | "simulation";
  isLoading?: boolean;
}

/**
 * ConfirmActionModal — Blueprint §35 ("Confirmation and destructive-action policy")
 * Enforces clear operational confirmation before executing any real dispatch change,
 * deletion, or plan application:
 * 1. What will happen.
 * 2. Which records or people are affected.
 * 3. Whether the action can be undone.
 * 4. Safe cancel action.
 */
export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  affectedEntities = [],
  consequenceWarning,
  confirmLabel = "Confirm Action",
  confirmVariant = "primary",
  isLoading = false,
}: ConfirmActionModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} description={description} maxWidth="md">
      <div className="space-y-4">
        {/* Affected Entities Summary */}
        {affectedEntities.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase font-semibold text-stone-500 dark:text-stone-400">
              Affected Operational Entities ({affectedEntities.length})
            </span>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 space-y-1.5 max-h-36 overflow-y-auto">
              {affectedEntities.map((e, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{e.name}</span>
                  <span className="text-stone-400 text-[10px]">[{e.type}: {e.id}]</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consequence Warning Callout */}
        {consequenceWarning && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{consequenceWarning}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-200/50 dark:border-stone-800">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="font-mono text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting || isLoading}
            className="font-mono text-xs gap-1.5"
          >
            <span>{confirmLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
