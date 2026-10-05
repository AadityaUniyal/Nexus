"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  Edit3,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export interface GeofenceHazardPainterProps {
  onHazardCreated?: (hazard: { name: string; radiusKm: number; severity: string }) => void;
  className?: string;
}

export function GeofenceHazardPainter({
  onHazardCreated,
  className = "",
}: GeofenceHazardPainterProps) {
  const { toast } = useToast();
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hazardName, setHazardName] = React.useState("I-80 Blizzard Chokepoint");
  const [radiusKm, setRadiusKm] = React.useState(45);
  const [severity, setSeverity] = React.useState<"CRITICAL" | "HIGH" | "MEDIUM">("CRITICAL");
  const [appliedHazards, setAppliedHazards] = React.useState<Array<{ id: string; name: string; radiusKm: number; severity: string }>>([
    { id: "h-1", name: "I-80 Pass Snowdrift", radiusKm: 45, severity: "CRITICAL" },
  ]);

  const handleToggleDraw = () => {
    setIsDrawing(!isDrawing);
    tactileAudio.playClick();
    if (!isDrawing) {
      toast({
        title: "Hazard Painter Activated",
        message: "Click & drag on the 3D globe / map to establish dynamic avoidance zone.",
        type: "warning",
      });
    }
  };

  const handleCommitHazard = () => {
    tactileAudio.playSuccess();
    const newHazard = {
      id: `h-${Date.now()}`,
      name: hazardName || "Custom Avoidance Zone",
      radiusKm,
      severity,
    };
    setAppliedHazards([newHazard, ...appliedHazards]);
    setIsDrawing(false);
    onHazardCreated?.(newHazard);
    toast({
      title: "Geofence Hazard Enforced",
      message: `Autonomous engine simulated avoidance path around ${radiusKm}km perimeter.`,
      type: "success",
    });
  };

  const handleRemoveHazard = (id: string) => {
    tactileAudio.playClick();
    setAppliedHazards(appliedHazards.filter((h) => h.id !== id));
    toast({
      title: "Geofence Cleared",
      message: "Resumed standard operational corridor routing.",
      type: "info",
    });
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-nexus-surface-container/90 backdrop-blur-xl border border-nexus-outline/30 shadow-tactile ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-nexus-on-surface uppercase tracking-wider">
              Spatial Geofence Hazard Painter
            </h4>
            <p className="text-[11px] text-nexus-on-surface-variant">
              Draw dynamic avoidance perimeters to trigger automatic AI fleet rerouting.
            </p>
          </div>
        </div>

        <Button
          variant={isDrawing ? "danger" : "secondary"}
          size="sm"
          onClick={handleToggleDraw}
          className="font-mono text-xs shadow-tactile"
        >
          <Edit3 className="w-3.5 h-3.5 mr-1" />
          {isDrawing ? "Drawing Active..." : "Paint Hazard Zone"}
        </Button>
      </div>

      {isDrawing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-3.5 rounded-xl bg-nexus-surface-container-high border border-nexus-outline/30 space-y-3 mb-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-mono text-nexus-on-surface-variant uppercase block mb-1">
                Hazard Title
              </label>
              <input
                type="text"
                value={hazardName}
                onChange={(e) => setHazardName(e.target.value)}
                className="w-full text-xs font-mono p-2 rounded-lg bg-nexus-surface border border-nexus-outline/40 text-nexus-on-surface focus:outline-none focus:border-nexus-secondary"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-nexus-on-surface-variant uppercase block mb-1">
                Avoidance Radius ({radiusKm} km)
              </label>
              <input
                type="range"
                min={10}
                max={150}
                step={5}
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                className="w-full h-2 bg-nexus-surface-container-highest rounded-lg appearance-none cursor-pointer accent-rose-500 mt-2"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-nexus-on-surface-variant uppercase block mb-1">
                Risk Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full text-xs font-mono p-2 rounded-lg bg-nexus-surface border border-nexus-outline/40 text-nexus-on-surface focus:outline-none focus:border-nexus-secondary"
              >
                <option value="CRITICAL">CRITICAL (No-Go)</option>
                <option value="HIGH">HIGH (Advisory Delay)</option>
                <option value="MEDIUM">MEDIUM (Caution)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDrawing(false)}
              className="text-xs font-mono"
            >
              Cancel
            </Button>
            <Button
              variant="simulation"
              size="sm"
              onClick={handleCommitHazard}
              className="text-xs font-mono shadow-tactile"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Commit & Run Reroute
            </Button>
          </div>
        </motion.div>
      )}

      {/* Active Avoidance Perimeters List */}
      <div className="space-y-1.5">
        {appliedHazards.map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between p-2 rounded-xl bg-nexus-surface-container-high/60 border border-nexus-outline/20 text-xs font-mono"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-bold text-nexus-on-surface">{h.name}</span>
              <span className="text-[10px] text-nexus-on-surface-variant px-1.5 py-0.5 rounded bg-nexus-surface border border-nexus-outline/30">
                {h.radiusKm} km radius
              </span>
            </div>
            <button
              onClick={() => handleRemoveHazard(h.id)}
              className="p-1 rounded-md text-nexus-on-surface-variant hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Remove Hazard Zone"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
