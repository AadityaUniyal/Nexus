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
  Wifi,
  WifiOff,
} from 'lucide-react';
import { tactileAudio } from '@/lib/sound-effects';
import { useToast } from '@/components/ui/toast';
import { offlineSyncManager } from '@/lib/offline-sync';

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
  const vehicleCode = searchParams.get('v') || '';
  const routeCode = searchParams.get('r') || '';
  const dispatchToken = searchParams.get('token') || '';
  const { toast } = useToast();

  const [manifest, setManifest] = React.useState<ManifestData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = React.useState('');
  const [selectedOrder, setSelectedOrder] = React.useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  // PoD State
  const [recipientName, setRecipientName] = React.useState('');
  const [podNotes, setPodNotes] = React.useState('');
  const [biltiPhoto, setBiltiPhoto] = React.useState<string | null>(null);
  const [isSubmittingPod, setIsSubmittingPod] = React.useState(false);
  const [podResult, setPodResult] = React.useState<{ podId: string; timestamp: string } | null>(null);

  // File input ref for camera capture
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Canvas signature pad ref
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(false);

  // Fetch manifest
  const fetchManifest = React.useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      if (!vehicleCode || !dispatchToken) throw new Error('This driver link is missing its vehicle or dispatch token. Ask dispatch for a new link.');
      const query = new URLSearchParams({ vehicle_code: vehicleCode, token: dispatchToken });
      if (routeCode) query.set('route_code', routeCode);
      const res = await fetch(`/api/v1/driver/manifest?${query}`);
      if (!res.ok) throw new Error(res.status === 401 ? 'This driver link is invalid or has expired. Ask dispatch for a new link.' : 'The dispatch manifest could not be loaded.');
      const data = await res.json();
      setManifest(data);
      setCurrentStatus(data.status || '');
      setSelectedOrder((current) => data.cargo.length === 1 ? (data.cargo[0].order_number || '') : data.cargo.some((item: ManifestData['cargo'][number]) => item.order_number === current) ? current : '');
    } catch (error) {
      setManifest(null);
      setLoadError(error instanceof Error ? error.message : 'The dispatch manifest could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [vehicleCode, routeCode, dispatchToken]);

  React.useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const [isOnline, setIsOnline] = React.useState(true);
  const [pendingQueueCount, setPendingQueueCount] = React.useState(0);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const unsub = offlineSyncManager.subscribe((count) => {
        setPendingQueueCount(count);
      });

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        unsub();
      };
    }
  }, []);

  // Handle status update
  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      tactileAudio.playClick();

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // Enqueue offline immediately
        await offlineSyncManager.enqueue(
          '/api/v1/driver/status',
          'POST',
          { vehicle_code: vehicleCode, status: newStatus, token: dispatchToken },
          'DRIVER_STATUS'
        );
        setCurrentStatus(newStatus);
        tactileAudio.playSuccess();
        toast({
          title: 'Saved in Offline Queue',
          message: `Device is offline. Status "${newStatus}" saved locally and will auto-sync on reconnect.`,
          type: 'info',
        });
        return;
      }

      const res = await fetch('/api/v1/driver/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_code: vehicleCode,
          status: newStatus,
          token: dispatchToken,
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
      } else {
        throw new Error('Status update rejected by dispatch.');
      }
    } catch {
      // Fallback: enqueue offline to preserve driver action
      await offlineSyncManager.enqueue(
        '/api/v1/driver/status',
        'POST',
        { vehicle_code: vehicleCode, status: newStatus, token: dispatchToken },
        'DRIVER_STATUS'
      );
      setCurrentStatus(newStatus);
      tactileAudio.playSuccess();
      toast({
        title: 'Network Interrupted · Queued Offline',
        message: 'Could not reach server. Status queued locally in IndexedDB cache.',
        type: 'warning',
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
    if (!selectedOrder) {
      toast({ title: 'Order Required', message: 'Select the order being delivered.', type: 'warning' });
      return;
    }

    try {
      setIsSubmittingPod(true);
      tactileAudio.playClick();
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Signature capture is unavailable on this device.');
      const signatureData = canvas.toDataURL('image/png');

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await offlineSyncManager.enqueue(
          '/api/v1/driver/pod',
          'POST',
          {
            vehicle_code: vehicleCode,
            order_number: selectedOrder,
            token: dispatchToken,
            recipient_name: recipientName.trim(),
            signature_data: signatureData,
            photo_url: biltiPhoto || undefined,
            notes: podNotes,
          },
          'PROOF_OF_DELIVERY'
        );
        const offlinePodId = `POD-OFFLINE-${Date.now().toString().slice(-6)}`;
        setPodResult({
          podId: offlinePodId,
          timestamp: new Date().toISOString(),
        });
        setCurrentStatus('DELIVERED');
        tactileAudio.playSuccess();
        toast({
          title: 'PoD Recorded in Offline Storage',
          message: 'Recipient signature saved to device. Will auto-sync when cellular signal returns.',
          type: 'info',
        });
        return;
      }

      const res = await fetch('/api/v1/driver/pod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_code: vehicleCode,
          order_number: selectedOrder,
          token: dispatchToken,
          recipient_name: recipientName.trim(),
          signature_data: signatureData,
          photo_url: biltiPhoto || undefined,
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
      try {
        const canvas = canvasRef.current;
        const signatureData = canvas?.toDataURL('image/png') || '';
        await offlineSyncManager.enqueue(
          '/api/v1/driver/pod',
          'POST',
          {
            vehicle_code: vehicleCode,
            order_number: selectedOrder,
            token: dispatchToken,
            recipient_name: recipientName.trim(),
            signature_data: signatureData,
            photo_url: biltiPhoto || undefined,
            notes: podNotes,
          },
          'PROOF_OF_DELIVERY'
        );
        const offlinePodId = `POD-OFFLINE-${Date.now().toString().slice(-6)}`;
        setPodResult({
          podId: offlinePodId,
          timestamp: new Date().toISOString(),
        });
        setCurrentStatus('DELIVERED');
        tactileAudio.playSuccess();
        toast({
          title: 'Network Lost · Signature Preserved',
          message: 'Proof of Delivery saved locally in device cache. Auto-syncing on reconnect.',
          type: 'warning',
        });
      } catch {
        toast({
          title: 'Delivery not recorded',
          message: 'Dispatch did not confirm proof of delivery. Check the connection and retry.',
          type: 'critical',
        });
      }
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

        <div className="flex items-center gap-2">
          {/* Connectivity Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>
              {isOnline
                ? pendingQueueCount > 0
                  ? `Syncing (${pendingQueueCount})...`
                  : 'Live Connected'
                : `Offline (${pendingQueueCount} queued)`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700/60 text-xs font-mono text-zinc-300">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>{manifest?.battery_pct == null ? '—' : `${manifest.battery_pct}%`}</span>
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
              {routeCode || manifest?.route_code || 'Route unavailable'}
            </span>
            <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
              currentStatus === 'DELIVERED'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : currentStatus === 'ARRIVED'
                ? 'bg-blue-950 text-blue-300 border-blue-700'
                : 'bg-amber-950 text-amber-300 border-amber-700'
            }`}>
              {currentStatus ? currentStatus.replace('_', ' ') : 'Status unavailable'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-400 font-mono">Origin Departure</p>
                <p className="text-sm font-semibold text-zinc-100">{manifest?.origin ?? 'Not provided'}</p>
              </div>
            </div>

            <div className="ml-2 border-l-2 border-dashed border-zinc-700 h-4" />

            <div className="flex items-start gap-2.5">
              <Navigation className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-400 font-mono">Target Destination</p>
                <p className="text-sm font-semibold text-zinc-100">{manifest?.destination ?? 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-2 text-center">
            <div className="bg-zinc-800/40 p-2 rounded-xl">
              <p className="text-[10px] text-zinc-400 font-mono">Total Distance</p>
              <p className="text-sm font-bold font-mono text-zinc-200">{manifest?.distance_km == null ? '—' : `${manifest.distance_km} km`}</p>
            </div>
            <div className="bg-zinc-800/40 p-2 rounded-xl">
              <p className="text-[10px] text-zinc-400 font-mono">Est. Transit Time</p>
              <p className="text-sm font-bold font-mono text-zinc-200">{manifest?.estimated_duration_mins == null ? '—' : `${manifest.estimated_duration_mins} min`}</p>
            </div>
          </div>
        </section>

        {loadError && (
          <section role="alert" className="rounded-2xl border border-rose-800/60 bg-rose-950/30 p-4 text-sm text-rose-200">
            <p>{loadError}</p>
            <button onClick={fetchManifest} disabled={loading} className="mt-3 underline underline-offset-4">Retry manifest</button>
          </section>
        )}

        {/* Quick Driver Status Toggles */}
        <section className="space-y-2">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 px-1">
            Dispatch Status Updates
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleUpdateStatus('EN_ROUTE')}
              disabled={isUpdatingStatus || !manifest}
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
              disabled={isUpdatingStatus || !manifest}
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
              disabled={isUpdatingStatus || !manifest}
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
              {manifest?.cargo.length ?? '—'} Items
            </span>
          </div>

          <div className="space-y-2">
            {(manifest?.cargo || []).map((item, idx) => (
              <div key={idx} className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-200">{item.customer_name}</span>
                  <span className="font-mono text-emerald-400 text-[11px]">
                    {item.tracking_number || item.order_number || 'Reference unavailable'}
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
              {!manifest && <p className="text-xs text-zinc-400">A valid dispatch manifest is required before delivery can be recorded.</p>}
              {manifest && <div>
                <label className="mb-1 block text-xs font-mono text-zinc-400">Order being delivered *</label>
                <select required value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)} disabled={!manifest.cargo.length} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100">
                  <option value="">{manifest.cargo.length ? 'Select an assigned order' : 'No assigned orders available'}</option>
                  {manifest.cargo.filter((item) => item.order_number).map((item) => <option key={item.order_number} value={item.order_number}>{item.order_number} · {item.customer_name}</option>)}
                </select>
              </div>}
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

              {/* Camera Photo of Physical Stamped Challan / Bilti */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Physical Stamped Bilti / Paper Challan Photo (Optional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBiltiPhoto(reader.result as string);
                        toast({ title: "Bilti Photo Attached", message: "Physical receipt image captured successfully.", type: "success" });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {biltiPhoto ? (
                  <div className="relative rounded-xl border border-emerald-500/30 overflow-hidden bg-black p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={biltiPhoto} alt="Stamped Bilti Preview" className="w-12 h-12 object-cover rounded-lg border border-zinc-700" />
                      <div>
                        <span className="text-xs font-semibold text-emerald-400 block">✓ Paper Bilti Attached</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Ready to upload to Azure Vault</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBiltiPhoto(null)}
                      className="text-xs font-mono text-rose-400 hover:text-rose-300 px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-700 hover:border-emerald-500 bg-zinc-800/40 hover:bg-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-center gap-2 transition"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Take Photo of Stamped Challan (Bilti)</span>
                  </button>
                )}
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
                  disabled={isSubmittingPod || !manifest || !selectedOrder}
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
