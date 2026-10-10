"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api/client";
import { queuePing, getPendingPings, clearPendingPings } from "@/lib/driver-db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Navigation,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Lock,
  Sun,
  Loader2,
  Radio,
  Power,
  RefreshCw,
} from "lucide-react";

export default function DriverPwaPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [driver, setDriver] = useState<any>(null);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [isOnDuty, setIsOnDuty] = useState(false);

  // Status & Telemetry Indicators
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [lastPingSentAt, setLastPingSentAt] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // 1. Initialize or Redeem Session Token
  useEffect(() => {
    async function initSession() {
      try {
        let token = "";
        // Check hash or query param
        if (typeof window !== "undefined") {
          const hashMatch = window.location.hash.match(/token=([^&]+)/);
          const queryMatch = window.location.search.match(/token=([^&]+)/);
          const linkToken = hashMatch ? hashMatch[1] : queryMatch ? queryMatch[1] : null;

          if (linkToken) {
            // Redeem token
            const res = await api.driverRedeem(linkToken, navigator.userAgent);
            token = res.session_token;
            localStorage.setItem("nexus_driver_session_token", token);
            setDriver(res.driver);
            // Clear token from URL without reloading
            window.history.replaceState(null, "", "/driver");
          } else {
            token = localStorage.getItem("nexus_driver_session_token") || "";
          }
        }

        if (token) {
          setSessionToken(token);
          // Fetch active job
          try {
            const jobRes = await api.driverGetActiveJob(token);
            setActiveJob(jobRes.job);
            if (jobRes.driver) {
              setDriver(jobRes.driver);
              setIsOnDuty(jobRes.driver.status === "on_duty");
            }
          } catch {
            // Token might be invalid or expired
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to initialize driver session");
      } finally {
        setInitLoading(false);
      }
    }

    initSession();
  }, []);

  // 2. Request Wake Lock
  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        const lock = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current = lock;
        setWakeLockActive(true);
        lock.addEventListener("release", () => {
          setWakeLockActive(false);
        });
      }
    } catch {
      setWakeLockActive(false);
    }
  }, []);

  // 3. Release Wake Lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  }, []);

  // 4. Duty Toggle
  const handleToggleDuty = async () => {
    if (!sessionToken) return;
    const newStatus = isOnDuty ? "off_duty" : "on_duty";
    try {
      await api.driverDuty(newStatus, sessionToken);
      setIsOnDuty(newStatus === "on_duty");
      if (newStatus === "on_duty") {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update duty status");
    }
  };

  // 5. Flush Pending Pings
  const flushPings = useCallback(async () => {
    if (!sessionToken) return;
    const pings = await getPendingPings();
    setPendingCount(pings.length);
    if (pings.length === 0) return;

    try {
      const payload = pings.map((p) => ({
        lat: p.lat,
        lon: p.lon,
        heading: p.heading,
        speed_mps: p.speed_mps,
        accuracy_meters: p.accuracy_meters,
        recorded_at: p.recorded_at,
      }));

      await api.driverSendPings(payload, sessionToken);
      const ids = pings.map((p) => p.id);
      await clearPendingPings(ids);
      setPendingCount(0);
      setLastPingSentAt(new Date().toLocaleTimeString());
    } catch {
      // Keep in queue for next flush
    }
  }, [sessionToken]);

  // 6. GPS Tracking Watcher
  useEffect(() => {
    if (!isOnDuty || !sessionToken) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    requestWakeLock();

    // Start geolocation watch
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, heading, speed, accuracy } = position.coords;
          setGpsAccuracy(Math.round(accuracy));

          await queuePing({
            lat: latitude,
            lon: longitude,
            heading: isNaN(heading as number) ? null : heading,
            speed_mps: isNaN(speed as number) ? null : speed,
            accuracy_meters: accuracy,
            recorded_at: new Date(position.timestamp).toISOString(),
          });

          flushPings();
        },
        (err) => {
          console.error("GPS watch error", err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );
    }

    // Periodic flush timer
    const interval = setInterval(flushPings, 5000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      clearInterval(interval);
    };
  }, [isOnDuty, sessionToken, requestWakeLock, flushPings]);

  // 7. Stop Action Buttons (Start, Arrived, Delivered)
  const handleStopAction = async (action: "start" | "arrived" | "delivered", stopId: string) => {
    if (!sessionToken) return;
    try {
      setActionLoading(true);
      const recordedAt = new Date().toISOString();

      let curLat: number | undefined;
      let curLon: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        curLat = pos.coords.latitude;
        curLon = pos.coords.longitude;
      } catch {}

      await api.driverStopAction(action, stopId, recordedAt, sessionToken, curLat, curLon);
      // Refresh active job
      const jobRes = await api.driverGetActiveJob(sessionToken);
      setActiveJob(jobRes.job);
    } catch (err: any) {
      alert(err.message || "Failed to submit stop action");
    } finally {
      setActionLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm font-medium">Opening Driver Portal...</p>
      </div>
    );
  }

  if (!sessionToken) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-amber-500">
          <Smartphone className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold mb-2">Driver Link Required</h1>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-6">
          To start GPS tracking and view assigned deliveries, open the one-time link provided by your dispatcher.
        </p>
        <div className="text-[11px] font-mono text-zinc-500 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
          No app download or account creation is required.
        </div>
      </div>
    );
  }

  const nextPendingStop = activeJob?.stops?.find((s: any) => s.status !== "completed");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 max-w-lg mx-auto space-y-4 pb-12">
      {/* Header & Driver Info */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
            {driver?.name?.charAt(0) || "D"}
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100">{driver?.name || "Driver Portal"}</h1>
            <p className="text-[11px] text-zinc-400 font-mono">NEXUS Mobile Tracking</p>
          </div>
        </div>

        {/* Duty Button */}
        <Button
          size="sm"
          onClick={handleToggleDuty}
          className={`h-9 px-3.5 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-md ${
            isOnDuty
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isOnDuty ? "On Duty" : "Go On Duty"}</span>
        </Button>
      </div>

      {/* Honest Screen Notice (N5 Requirement) */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 space-y-1">
        <div className="flex items-center gap-2 font-semibold">
          <Sun className="w-4 h-4 text-amber-400" />
          <span>Keep Screen Open &amp; Unlocked</span>
        </div>
        <p className="text-[11px] text-amber-200/75 leading-relaxed">
          Browser PWAs cannot stream GPS when the screen is locked or backgrounded. Wake Lock is{" "}
          <strong className="text-amber-200">{wakeLockActive ? "ACTIVE" : "INACTIVE"}</strong>.
        </p>
      </div>

      {/* Live Telemetry Status Bar */}
      <Card className="p-3.5 bg-zinc-900 border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <span className="text-[10px] text-zinc-500 block uppercase font-mono">GPS Accuracy</span>
          <span className="font-mono font-semibold text-zinc-200">
            {gpsAccuracy !== null ? `±${gpsAccuracy}m` : "—"}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block uppercase font-mono">Last Sent</span>
          <span className="font-mono font-semibold text-zinc-200">
            {lastPingSentAt || "Pending"}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block uppercase font-mono">Queue</span>
          <span className="font-mono font-semibold text-zinc-200">{pendingCount}</span>
        </div>
      </Card>

      {/* Active Job & Stop Card */}
      {!activeJob ? (
        <Card className="p-8 text-center bg-zinc-900 border-zinc-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto" />
          <h2 className="text-sm font-bold text-zinc-300">No Active Deliveries Assigned</h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            When your dispatcher assigns a job, route details and one-tap stop actions will appear here.
          </p>
        </Card>
      ) : (
        <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">
                Active Job
              </span>
              <h2 className="text-base font-bold text-zinc-100 mt-1">{activeJob.title}</h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
              {activeJob.status}
            </span>
          </div>

          {/* Current Target Stop */}
          {nextPendingStop ? (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-zinc-400 uppercase">
                  Stop #{nextPendingStop.sequence} ({nextPendingStop.stop_type})
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    nextPendingStop.status === "in_progress"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {nextPendingStop.status.replace("_", " ")}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-200 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{nextPendingStop.address}</span>
                </p>
                <p className="text-[11px] text-zinc-400 font-mono mt-1 ml-5">
                  Window: {new Date(nextPendingStop.window_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                  {new Date(nextPendingStop.window_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                {nextPendingStop.status === "pending" && (
                  <Button
                    onClick={() => handleStopAction("start", nextPendingStop.id)}
                    disabled={actionLoading}
                    className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3"
                  >
                    Start En Route to Stop
                  </Button>
                )}

                {nextPendingStop.status === "in_progress" && (
                  <>
                    <Button
                      onClick={() => handleStopAction("arrived", nextPendingStop.id)}
                      disabled={actionLoading}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs py-3"
                    >
                      I Have Arrived
                    </Button>

                    <Button
                      onClick={() => handleStopAction("delivered", nextPendingStop.id)}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3"
                    >
                      {nextPendingStop.stop_type === "pickup" ? "Pickup Complete" : "Delivered"}
                    </Button>
                  </>
                )}

                {nextPendingStop.status === "arrived" && (
                  <Button
                    onClick={() => handleStopAction("delivered", nextPendingStop.id)}
                    disabled={actionLoading}
                    className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3"
                  >
                    Complete {nextPendingStop.stop_type === "pickup" ? "Pickup" : "Delivery"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-center text-xs font-medium">
              All stops on this job are completed!
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
