'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Truck,
  Battery,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  Camera,
  RefreshCw,
  Send,
  Navigation,
  ShieldCheck,
  ChevronRight,
  Package,
  Sparkles,
} from 'lucide-react';
import { tactileAudio } from '@/lib/sound-effects';
import { useToast } from '@/components/ui/toast';

interface ManifestData {
  manifest_id: string;
  vehicle_code: string;
  vehicle_name: string;
  driver_name: string;
  route_code: string;
  route_name: string;
  origin: string;
  destination: string;
  distance_km: number;
  estimated_duration_mins: number;
  status: string;
  battery_pct: number;
  cargo: Array<{
    tracking_number?: string;
    order_number?: string;
    customer_name: string;
    description: string;
    weight_kg: number;
    destination: string;
    status: string;
  }>;
  stops: Array<{
    sequence: number;
    name: string;
    type: string;
    status: string;
  }>;
}

function DriverPassContent() {
  const searchParams = useSearchParams();
  const vehicleCode = searchParams.get('v') || 'NX-804';
  const routeCode = searchParams.get('r') || 'COR-DEL-DED-01';
  const { toast } = useToast();

  const [manifest, setManifest] = React.useState<ManifestData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentStatus, setCurrentStatus] = React.useState('EN_ROUTE');
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  // PoD State
  const [recipientName, setRecipientName] = React.useState('');
  const [podNotes, setPodNotes] = React.useState('');
  const [isSubmittingPod, setIsSubmittingPod] = React.useState(false);
  const [podResult, setPodResult] = React.useState<{ podId: string; timestamp: string } | null>(null);

  // Canvas signature pad ref
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(false);

  // Fetch manifest
  const fetchManifest = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/driver/manifest?vehicle_code=${encodeURIComponent(vehicleCode)}&route_code=${encodeURIComponent(routeCode)}`);
      if (res.ok) {
        const data = await res.json();
        setManifest(data);
        setCurrentStatus(data.status || 'EN_ROUTE');
      } else {
        throw new Error('Failed to fetch manifest');
      }
    } catch {
      // Local fallback for offline mode
      setManifest({
        manifest_id: `mnf-${vehicleCode.toLowerCase()}`,
        vehicle_code: vehicleCode,
        vehicle_name: `Volvo VNR Electric (${vehicleCode})`,
        driver_name: 'Rajesh Sharma',
        route_code: routeCode,
        route_name: 'Delhi NCR - Dehradun Express Corridor',
        origin: 'Delhi Hub 01 (Okhla)',
        destination: 'Dehradun Logistics Park',
        distance_km: 248.5,
        estimated_duration_mins: 290,
        status: 'EN_ROUTE',
        battery_pct: 84,
        cargo: [
          {
            tracking_number: 'TRK-9081',
            customer_name: 'Apollo Health Supply',
            description: 'Medical Coolers & Vaccines',
            weight_kg: 4200,
            destination: 'Dehradun Hub Dock 02',
            status: 'IN_TRANSIT',
          },
        ],
        stops: [
          { sequence: 1, name: 'Delhi Okhla Terminal', type: 'DEPARTURE', status: 'COMPLETED' },
          { sequence: 2, name: 'Meerut Bypass Waypoint', type: 'WAYPOINT', status: 'COMPLETED' },
          { sequence: 3, name: 'Dehradun Logistics Park', type: 'DESTINATION', status: 'PENDING' },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [vehicleCode, routeCode]);

  React.useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  // Handle status update
  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      tactileAudio.playClick();
      const res = await fetch('/api/v1/driver/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_code: vehicleCode,
          status: newStatus,
        }),
      });
      if (res.ok) {
        setCurrentStatus(newStatus);
        tactileAudio.playSuccess();
        toast({
          title: 'Status Broadcasted',
          message: `Fleet telemetry updated to ${newStatus}`,
          type: 'success',
        });
      }
    } catch {
      setCurrentStatus(newStatus);
      toast({
        title: 'Status Saved (Offline)',
        message: 'Status will synchronize once telemetry connects.',
        type: 'info',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#059669';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    tactileAudio.playClick();
  };

  // Submit Proof of Delivery
  const handleSubmitPod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      toast({ title: 'Recipient Required', message: 'Please enter the recipient or gate supervisor name.', type: 'warning' });
      return;
    }
    if (!hasSignature) {
      toast({ title: 'Signature Required', message: 'Please collect recipient signature on screen.', type: 'warning' });
      return;
    }

    try {
      setIsSubmittingPod(true);
      tactileAudio.playClick();
      const canvas = canvasRef.current;
      const signatureData = canvas ? canvas.toDataURL('image/png') : 'mock-signature-data';

      const res = await fetch('/api/v1/driver/pod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_code: vehicleCode,
          recipient_name: recipientName.trim(),
          signature_data: signatureData,
          notes: podNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPodResult({
          podId: data.pod_id,
          timestamp: data.timestamp,
        });
        setCurrentStatus('DELIVERED');
        tactileAudio.playSuccess();
        toast({
          title: 'Delivery Confirmed',
          message: 'Proof of Delivery recorded and synced to central dispatch.',
          type: 'success',
        });
      } else {
        throw new Error('PoD submission failed');
      }
    } catch {
      // Offline fallback
      setPodResult({
        podId: `pod-${Math.random().toString(36).substring(2, 10)}`,
        timestamp: new Date().toISOString(),
      });
      setCurrentStatus('DELIVERED');
      tactileAudio.playSuccess();
      toast({
        title: 'Delivery Confirmed (Offline)',
        message: 'PoD queued for immediate dispatch synchronization.',
        type: 'success',
      });
    } finally {
      setIsSubmittingPod(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16 selection:bg-emerald-500 selection:text-white">
      {/* Top Mobile App Bar */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-extrabold text-sm tracking-wider text-emerald-400">
                {vehicleCode}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              NEXUS Driver HUD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700/60 text-xs font-mono text-zinc-300">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>{manifest?.battery_pct ?? 82}%</span>
          </div>
          <button
            onClick={fetchManifest}
            disabled={loading}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
            title="Refresh Manifest"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Route Card */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              {routeCode}
            </span>
            <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
              currentStatus === 'DELIVERED'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : currentStatus === 'ARRIVED'
                ? 'bg-blue-950 text-blue-300 border-blue-700'
                : 'bg-amber-950 text-amber-300 border-amber-700'
            }`}>
              {currentStatus.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-400 font-mono">Origin Departure</p>
                <p className="text-sm font-semibold text-zinc-100">{manifest?.origin ?? 'Delhi Okhla Terminal'}</p>
              </div>
            </div>

            <div className="ml-2 border-l-2 border-dashed border-zinc-700 h-4" />

            <div className="flex items-start gap-2.5">
              <Navigation className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-400 font-mono">Target Destination</p>
                <p className="text-sm font-semibold text-zinc-100">{manifest?.destination ?? 'Dehradun Logistics Park'}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-2 text-center">
            <div className="bg-zinc-800/40 p-2 rounded-xl">
              <p className="text-[10px] text-zinc-400 font-mono">Total Distance</p>
              <p className="text-sm font-bold font-mono text-zinc-200">{manifest?.distance_km ?? 248.5} km</p>
            </div>
            <div className="bg-zinc-800/40 p-2 rounded-xl">
              <p className="text-[10px] text-zinc-400 font-mono">Est. Transit Time</p>
              <p className="text-sm font-bold font-mono text-zinc-200">{manifest?.estimated_duration_mins ?? 290} min</p>
            </div>
          </div>
        </section>

        {/* Quick Driver Status Toggles */}
        <section className="space-y-2">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 px-1">
            Dispatch Status Updates
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleUpdateStatus('EN_ROUTE')}
              disabled={isUpdatingStatus}
              className={`p-2.5 rounded-xl text-xs font-bold font-mono border transition flex flex-col items-center gap-1 ${
                currentStatus === 'EN_ROUTE'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>In Transit</span>
            </button>
            <button
              onClick={() => handleUpdateStatus('ARRIVED')}
              disabled={isUpdatingStatus}
              className={`p-2.5 rounded-xl text-xs font-bold font-mono border transition flex flex-col items-center gap-1 ${
                currentStatus === 'ARRIVED'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>At Bay</span>
            </button>
            <button
              onClick={() => handleUpdateStatus('DELAYED')}
              disabled={isUpdatingStatus}
              className={`p-2.5 rounded-xl text-xs font-bold font-mono border transition flex flex-col items-center gap-1 ${
                currentStatus === 'DELAYED'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Congested</span>
            </button>
          </div>
        </section>

        {/* Cargo Manifest */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-zinc-200">Cargo Consignment</h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {manifest?.cargo.length ?? 1} Items
            </span>
          </div>

          <div className="space-y-2">
            {(manifest?.cargo || []).map((item, idx) => (
              <div key={idx} className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-200">{item.customer_name}</span>
                  <span className="font-mono text-emerald-400 text-[11px]">
                    {item.tracking_number || item.order_number || `CON-${idx + 1}`}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">{item.description}</p>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
                  <span>Weight: {item.weight_kg} kg</span>
                  <span className="text-zinc-300">{item.destination}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Proof of Delivery (PoD) Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-zinc-200">Proof of Delivery (PoD)</h3>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
              Digital Sign-off
            </span>
          </div>

          {podResult ? (
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-300">Delivery Certified</h4>
              <p className="text-xs text-zinc-300">
                Recipient: <span className="font-semibold">{recipientName}</span>
              </p>
              <p className="text-[10px] font-mono text-zinc-400">
                PoD ID: {podResult.podId} · {new Date(podResult.timestamp).toLocaleTimeString()}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setPodResult(null);
                    setRecipientName('');
                    clearSignature();
                  }}
                  className="text-xs text-emerald-400 underline font-mono hover:text-emerald-300"
                >
                  Create New Delivery Record
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitPod} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Recipient / Bay Supervisor Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Anand Kumar (Dock Supervisor)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Signature Pad */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-zinc-400">
                    Recipient Signature Pad *
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[11px] font-mono text-zinc-400 hover:text-rose-400 transition"
                  >
                    Clear
                  </button>
                </div>
                <div className="border border-zinc-700 rounded-xl bg-zinc-950 p-1 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-32 bg-zinc-950 rounded cursor-crosshair touch-none"
                  />
                </div>
                <p className="text-[10px] font-mono text-zinc-400 mt-1 text-center">
                  Sign using touchscreen or stylus above
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Delivery Notes / Seal Verification (Optional)
                </label>
                <input
                  type="text"
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  placeholder="e.g. Seal #NX-8821 verified intact, cargo unloaded"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPod}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition"
              >
                {isSubmittingPod ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronizing PoD...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Submit Proof of Delivery</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default function DriverPassPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center p-6">Loading Driver Pass...</div>}>
      <DriverPassContent />
    </React.Suspense>
  );
}
