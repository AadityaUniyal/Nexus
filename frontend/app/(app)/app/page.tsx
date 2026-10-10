"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useJobs, useDrivers, useWorkspace } from "@/lib/queries";
import { api } from "@/lib/api/client";
import { MapLibreMap, DriverMarkerData, StopMarkerData, RouteGeometry } from "@/components/map/MapLibreMap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  ArrowRight,
  Navigation,
  Loader2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { formatDate, formatDistance, formatDuration } from "@/lib/format";

export default function DispatcherCockpitPage() {
  const { data: workspace } = useWorkspace();
  const { data: initialJobs, refetch: refetchJobs } = useJobs();
  const { data: initialDrivers, refetch: refetchDrivers } = useDrivers();

  const [jobs, setJobs] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // SSE Realtime State
  const [connectionState, setConnectionState] = useState<"live" | "reconnecting" | "offline">("live");
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);

  // Job Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [assignedDriverId, setAssignedDriverId] = useState("");

  // Pickup Stop
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLon, setPickupLon] = useState<number | null>(null);
  const [pickupStart, setPickupStart] = useState("");
  const [pickupEnd, setPickupEnd] = useState("");

  // Dropoff Stop
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLon, setDropoffLon] = useState<number | null>(null);
  const [dropoffStart, setDropoffStart] = useState("");
  const [dropoffEnd, setDropoffEnd] = useState("");

  // Geocoding search states
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [searchingGeo, setSearchingGeo] = useState(false);

  // Route preview geometry
  const [routePreview, setRoutePreview] = useState<RouteGeometry | null>(null);

  // Sync initial query data
  useEffect(() => {
    if (initialJobs) setJobs(initialJobs);
  }, [initialJobs]);

  useEffect(() => {
    if (initialDrivers) setDrivers(initialDrivers);
  }, [initialDrivers]);

  // Connect to SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connectSSE() {
      const wsId = typeof window !== "undefined" ? localStorage.getItem("nexus_workspace_id") : null;
      const url = `/api/v1/stream${wsId ? `?workspace_id=${wsId}` : ""}`;

      setConnectionState("reconnecting");
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setConnectionState("live");
      };

      eventSource.addEventListener("location_ping", (e) => {
        try {
          const ping = JSON.parse(e.data);
          setLastPingTime(new Date().toLocaleTimeString());
          setDrivers((prev) =>
            prev.map((d) =>
              d.id === ping.driver_id
                ? {
                    ...d,
                    current_lat: ping.lat,
                    current_lon: ping.lon,
                    current_heading: ping.heading,
                    last_ping_at: ping.recorded_at,
                  }
                : d
            )
          );
        } catch {}
      });

      eventSource.addEventListener("prediction_updated", (e) => {
        try {
          const data = JSON.parse(e.data);
          setJobs((prev) =>
            prev.map((j) =>
              j.id === data.job_id
                ? {
                    ...j,
                    latest_prediction: {
                      status: data.status,
                      eta_at: data.eta_at,
                      uncertainty_margin_seconds: data.uncertainty_margin_seconds,
                      reason: data.reason,
                    },
                  }
                : j
            )
          );
        } catch {}
      });

      eventSource.addEventListener("recommendation_created", () => {
        refetchJobs();
      });

      eventSource.onerror = () => {
        setConnectionState("offline");
        eventSource?.close();
        reconnectTimeout = setTimeout(connectSSE, 4000);
      };
    }

    connectSSE();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [refetchJobs]);

  // Transform drivers for MapLibre
  const mapDrivers: DriverMarkerData[] = useMemo(() => {
    return drivers
      .filter((d) => d.current_lat !== null && d.current_lon !== null)
      .map((d) => ({
        id: d.id,
        name: d.name,
        lat: d.current_lat!,
        lon: d.current_lon!,
        heading: d.current_heading,
        status: d.status,
        lastPingAt: d.last_ping_at,
      }));
  }, [drivers]);

  // Selected job stops for MapLibre
  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  const mapStops: StopMarkerData[] = useMemo(() => {
    if (selectedJob && selectedJob.stops) {
      return selectedJob.stops.map((s: any) => ({
        id: s.id,
        stopType: s.stop_type,
        sequence: s.sequence,
        address: s.address,
        lat: s.lat,
        lon: s.lon,
        status: s.status,
        windowStart: s.window_start,
        windowEnd: s.window_end,
      }));
    }
    // Otherwise show all active stops across jobs
    const stopsList: StopMarkerData[] = [];
    jobs.forEach((j) => {
      if (j.stops) {
        j.stops.forEach((s: any) => {
          stopsList.push({
            id: s.id,
            stopType: s.stop_type,
            sequence: s.sequence,
            address: s.address,
            lat: s.lat,
            lon: s.lon,
            status: s.status,
            windowStart: s.window_start,
            windowEnd: s.window_end,
          });
        });
      }
    });
    return stopsList;
  }, [jobs, selectedJob]);

  // Geocoding Autocomplete for creation modal
  const handleAddressSearch = async (query: string, type: "pickup" | "dropoff") => {
    if (type === "pickup") setPickupAddress(query);
    else setDropoffAddress(query);

    if (query.trim().length < 3) {
      if (type === "pickup") setPickupSuggestions([]);
      else setDropoffSuggestions([]);
      return;
    }

    try {
      setSearchingGeo(true);
      const results = await api.searchGeo(query);
      if (type === "pickup") setPickupSuggestions(results);
      else setDropoffSuggestions(results);
    } catch {
      // Ignore search error
    } finally {
      setSearchingGeo(false);
    }
  };

  // Select suggestion
  const selectSuggestion = (item: any, type: "pickup" | "dropoff") => {
    if (type === "pickup") {
      setPickupAddress(item.address);
      setPickupLat(item.lat);
      setPickupLon(item.lon);
      setPickupSuggestions([]);
    } else {
      setDropoffAddress(item.address);
      setDropoffLat(item.lat);
      setDropoffLon(item.lon);
      setDropoffSuggestions([]);
    }
  };

  // Preview Route calculation
  useEffect(() => {
    async function loadRoutePreview() {
      if (pickupLat && pickupLon && dropoffLat && dropoffLon) {
        try {
          const res = await api.previewRoute(pickupLat, pickupLon, dropoffLat, dropoffLon);
          if (res?.route_geometry?.coordinates) {
            setRoutePreview({ coordinates: res.route_geometry.coordinates });
          }
        } catch {
          setRoutePreview(null);
        }
      } else {
        setRoutePreview(null);
      }
    }
    loadRoutePreview();
  }, [pickupLat, pickupLon, dropoffLat, dropoffLon]);

  // Create Job Submit
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !pickupLat || !pickupLon || !dropoffLat || !dropoffLon) return;

    try {
      setCreatingJob(true);
      const tz = workspace?.timezone || "UTC";

      // Form ISO dates with timezone
      const pStart = pickupStart ? new Date(pickupStart).toISOString() : new Date().toISOString();
      const pEnd = pickupEnd
        ? new Date(pickupEnd).toISOString()
        : new Date(Date.now() + 3600000).toISOString();
      const dStart = dropoffStart
        ? new Date(dropoffStart).toISOString()
        : new Date(Date.now() + 3600000).toISOString();
      const dEnd = dropoffEnd
        ? new Date(dropoffEnd).toISOString()
        : new Date(Date.now() + 7200000).toISOString();

      await api.createJob({
        title: jobTitle,
        driver_id: assignedDriverId || null,
        stops: [
          {
            stop_type: "pickup",
            sequence: 1,
            address: pickupAddress,
            lat: pickupLat,
            lon: pickupLon,
            tz,
            window_start: pStart,
            window_end: pEnd,
          },
          {
            stop_type: "dropoff",
            sequence: 2,
            address: dropoffAddress,
            lat: dropoffLat,
            lon: dropoffLon,
            tz,
            window_start: dStart,
            window_end: dEnd,
          },
        ],
      });

      setShowCreateModal(false);
      // Reset
      setJobTitle("");
      setAssignedDriverId("");
      setPickupAddress("");
      setPickupLat(null);
      setPickupLon(null);
      setDropoffAddress("");
      setDropoffLat(null);
      setDropoffLon(null);
      setRoutePreview(null);
      refetchJobs();
    } catch (err: any) {
      alert(err.message || "Failed to create job");
    } finally {
      setCreatingJob(false);
    }
  };

  // One-tap approve recommendation
  const handleApproveRec = async (recId: string) => {
    try {
      await api.approveRecommendation(recId);
      refetchJobs();
    } catch (err: any) {
      alert(err.message || "Failed to approve recommendation");
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden bg-zinc-950">
      {/* Left / Top Panel: Active Jobs, Risk Feed & Recommendations */}
      <div className="w-full md:w-[420px] lg:w-[460px] h-1/2 md:h-full flex flex-col border-r border-zinc-800 bg-zinc-900/95 z-10 shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>Dispatcher Cockpit</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono">
                {jobs.length} Active
              </span>
            </h1>
            <p className="text-xs text-zinc-400">Live GPS &amp; Predictive Risk Engine</p>
          </div>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Job</span>
          </Button>
        </div>

        {/* Jobs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {jobs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
              <Truck className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm font-medium text-zinc-400">No active jobs</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Create a job to assign a driver, stream real GPS, and monitor arrival risk.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-xs border-zinc-700 hover:bg-zinc-800"
              >
                Create First Job
              </Button>
            </div>
          ) : (
            jobs.map((job) => {
              const isSelected = job.id === selectedJobId;
              const pred = job.latest_prediction;
              const isRisk = pred?.status === "at_risk" || pred?.status === "late";
              const assignedDriver = drivers.find((d) => d.id === job.driver_id);

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(isSelected ? null : job.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/30"
                      : "bg-zinc-900 border-zinc-800/80 hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-200">{job.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                          {job.status}
                        </span>
                      </div>

                      {assignedDriver ? (
                        <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{assignedDriver.name}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-amber-400/90 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Unassigned</span>
                        </p>
                      )}
                    </div>

                    {/* Prediction Badge */}
                    {pred && (
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            pred.status === "on_time"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : pred.status === "at_risk"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                              : pred.status === "late"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {pred.status.replace("_", " ")}
                        </span>
                        {pred.eta_at && (
                          <span className="text-[10px] text-zinc-400 font-mono">
                            ETA {new Date(pred.eta_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Prediction Reason */}
                  {pred?.reason && (
                    <div className="mt-2.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-300">
                      <p className="text-[11px] font-mono text-zinc-400">{pred.reason}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Uncertainty: ±{Math.round(pred.uncertainty_margin_seconds / 60)} min
                      </p>
                    </div>
                  )}

                  {/* Active Recommendations with One-Tap Approval */}
                  {job.active_recommendations && job.active_recommendations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {job.active_recommendations.map((rec: any) => (
                        <div
                          key={rec.id}
                          className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-center justify-between gap-2"
                        >
                          <div className="text-xs">
                            <span className="font-semibold text-blue-300 block">
                              Suggested: {rec.action_type.replace("_", " ")}
                            </span>
                            <span className="text-[11px] text-blue-200/80">
                              Target ETA: {new Date(rec.projected_eta_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveRec(rec.id);
                            }}
                            className="h-7 bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 shadow-sm"
                          >
                            Approve
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right / Main Panel: Live Azure Map */}
      <div className="flex-1 h-1/2 md:h-full relative">
        <MapLibreMap
          drivers={mapDrivers}
          stops={mapStops}
          routeGeometry={routePreview}
          selectedDriverId={selectedDriverId}
          selectedJobId={selectedJobId}
          onDriverSelect={(id) => setSelectedDriverId(id)}
        />
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl bg-zinc-900 border-zinc-800 p-6 text-zinc-100 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-lg font-bold">Create New Job</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Job Reference / Title
                </label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Expedited Medical Sample #982"
                  required
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Assign Driver (Optional)
                </label>
                <select
                  value={assignedDriverId}
                  onChange={(e) => setAssignedDriverId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stop 1: Pickup */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Stop 1: Pickup
                </span>

                <div className="relative">
                  <Input
                    value={pickupAddress}
                    onChange={(e) => handleAddressSearch(e.target.value, "pickup")}
                    placeholder="Search global pickup address..."
                    required
                    className="bg-zinc-900 border-zinc-800 text-xs"
                  />
                  {pickupSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-30 max-h-40 overflow-y-auto">
                      {pickupSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectSuggestion(item, "pickup")}
                          className="p-2 text-xs hover:bg-zinc-800 cursor-pointer border-b border-zinc-800 last:border-0"
                        >
                          {item.address}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Window Start</label>
                    <Input
                      type="datetime-local"
                      value={pickupStart}
                      onChange={(e) => setPickupStart(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Window End</label>
                    <Input
                      type="datetime-local"
                      value={pickupEnd}
                      onChange={(e) => setPickupEnd(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Stop 2: Dropoff */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" /> Stop 2: Dropoff
                </span>

                <div className="relative">
                  <Input
                    value={dropoffAddress}
                    onChange={(e) => handleAddressSearch(e.target.value, "dropoff")}
                    placeholder="Search global delivery address..."
                    required
                    className="bg-zinc-900 border-zinc-800 text-xs"
                  />
                  {dropoffSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-30 max-h-40 overflow-y-auto">
                      {dropoffSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectSuggestion(item, "dropoff")}
                          className="p-2 text-xs hover:bg-zinc-800 cursor-pointer border-b border-zinc-800 last:border-0"
                        >
                          {item.address}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Window Start</label>
                    <Input
                      type="datetime-local"
                      value={dropoffStart}
                      onChange={(e) => setDropoffStart(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Window End</label>
                    <Input
                      type="datetime-local"
                      value={dropoffEnd}
                      onChange={(e) => setDropoffEnd(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingJob || !pickupLat || !dropoffLat}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  {creatingJob ? "Creating Job..." : "Create & Dispatch"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
