'use client';

import React from 'react';
import { LifeBuoy, X } from 'lucide-react';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportTicketModal({ isOpen, onClose }: SupportTicketModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-dialog-title"
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-800 dark:bg-stone-900"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <LifeBuoy aria-hidden="true" className="h-5 w-5 text-stone-600 dark:text-stone-300" />
            <h2 id="support-dialog-title" className="text-base font-semibold text-stone-950 dark:text-white">
              Support
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close support dialog"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-stone-800"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-300">
          Support requests and ticket history are not available in Nexus yet. Contact your workspace administrator for help.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
