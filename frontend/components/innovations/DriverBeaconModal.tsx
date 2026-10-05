"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  QrCode,
  Smartphone,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export interface DriverBeaconModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleCode?: string;
  driverName?: string;
  routeCode?: string;
}

export function DriverBeaconModal({
  isOpen,
  onClose,
  vehicleCode = "NX-804",
  driverName = "Rajesh Sharma",
  routeCode = "COR-DEL-DED-01",
}: DriverBeaconModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const beaconUrl = typeof window !== "undefined"
    ? `${window.location.origin}/driver-pass?v=${vehicleCode}&r=${routeCode}`
    : `https://nexus.logistics/driver-pass?v=${vehicleCode}&r=${routeCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(beaconUrl);
    setCopied(true);
    tactileAudio.playSuccess();
    toast({
      title: "Driver Beacon Link Copied",
      message: "Contracted driver can open turn-by-turn guidance without installing any app.",
      type: "success",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md p-6 rounded-3xl bg-nexus-surface-container border border-nexus-outline/30 shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-nexus-on-surface-variant hover:text-nexus-on-surface hover:bg-nexus-surface-container-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-nexus-secondary text-white shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-nexus-on-surface">
                Instant Driver Beacon Pass
              </h3>
              <p className="text-xs text-nexus-on-surface-variant font-mono">
                Zero-Install PWA & Apple Wallet Dispatch
              </p>
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="my-5 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-nexus-outline/20 text-center flex flex-col items-center justify-center shadow-inner">
            <div className="w-44 h-44 rounded-xl bg-gradient-to-tr from-nexus-secondary/10 to-emerald-500/10 border border-nexus-secondary/20 flex flex-col items-center justify-center relative p-3">
              <QrCode className="w-32 h-32 text-nexus-secondary" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 shadow-md border border-nexus-outline/30">
                  <Truck className="w-5 h-5 text-nexus-secondary" />
                </div>
              </div>
            </div>
            <p className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mt-3 font-semibold">
              Scan with phone camera to launch live telemetry HUD
            </p>
          </div>

          {/* Freight Metadata */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-nexus-surface-container-high text-xs font-mono mb-4 border border-nexus-outline/20">
            <div>
              <span className="text-nexus-on-surface-variant text-[10px] block">VEHICLE CODE</span>
              <span className="font-bold text-nexus-on-surface">{vehicleCode}</span>
            </div>
            <div>
              <span className="text-nexus-on-surface-variant text-[10px] block">ASSIGNED PILOT</span>
              <span className="font-bold text-nexus-on-surface">{driverName}</span>
            </div>
            <div>
              <span className="text-nexus-on-surface-variant text-[10px] block">ACTIVE CORRIDOR</span>
              <span className="font-bold text-nexus-on-surface">{routeCode}</span>
            </div>
            <div>
              <span className="text-nexus-on-surface-variant text-[10px] block">PROOF OF DELIVERY</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Geo-Verified
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleCopy}
              className="flex-1 font-mono text-xs shadow-tactile"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" /> Copied Link
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" /> Copy Dispatch URL
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="font-mono text-xs"
            >
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
