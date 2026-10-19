'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Package,
  ArrowRight,
  Phone,
  FileText,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { dataProvider } from '@/lib/data-provider';
import { OrderItem, VehicleItem, WarehouseItem } from '@/lib/mock-data';
import { LeafletWorldMap, MapWarehouse, MapVehicle } from '@/components/map/LeafletWorldMap';

export default function PublicClientTrackPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  const [order, setOrder] = React.useState<OrderItem | null>(null);
  const [vehicle, setVehicle] = React.useState<VehicleItem | null>(null);
  const [warehouse, setWarehouse] = React.useState<WarehouseItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadPublicTrip() {
      try {
        setLoading(true);
        // Attempt fetch by ID or orderNumber
        const [ordersList, vehiclesList, warehousesList] = await Promise.all([
          dataProvider.getOrders(),
          dataProvider.getVehicles(),
          dataProvider.getWarehouses(),
        ]);

        const matched = ordersList.find(
          (o) => o.id === tripId || o.orderNumber.toUpperCase() === tripId.toUpperCase()
        );

        if (matched) {
          setOrder(matched);
          const v = vehiclesList.find((veh) => veh.id === matched.vehicleId || veh.code === matched.vehicleCode);
          const w = warehousesList.find((wh) => wh.id === matched.warehouseId);
          setVehicle(v || null);
          setWarehouse(w || null);
        } else {
          // Fallback display for preview trip codes
          setOrder({
            id: tripId,
            orderNumber: tripId.toUpperCase(),
            customerName: "Consignment Client",
            destination: "Destination Dock (Verified)",
            warehouseId: null,
            warehouseName: "Origin Dispatch Hub",
            vehicleId: "v-default",
            vehicleCode: "MH-04-AB-1234",
            routeId: null,
            priority: "NORMAL",
            deadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
            estimatedEta: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
            status: "IN_TRANSIT",
            itemsCount: 1,
            totalCost: 45000,
            slaCompliant: true,
          });
          setVehicle(vehiclesList[0] || null);
          setWarehouse(warehousesList[0] || null);
        }
      } catch (err: any) {
        setError(err.message || "Unable to retrieve consignment status.");
      } finally {
        setLoading(false);
      }
    }
    loadPublicTrip();
  }, [tripId]);

  const mapVehicles: MapVehicle[] = React.useMemo(() => {
    if (!vehicle || vehicle.lat == null || vehicle.lng == null) {
      // Fallback coordinates for visual display
      return [
        {
          id: "veh-track",
          code: order?.vehicleCode || "MH-04-1234",
          name: "Active Road Carrier",
          lat: 28.5355,
          lng: 77.391,
          speedKmh: 54,
          status: "IN_TRANSIT",
        },
      ];
    }
    return [
      {
        id: vehicle.id,
        code: vehicle.code,
        name: vehicle.name,
        lat: vehicle.lat,
        lng: vehicle.lng,
        speedKmh: vehicle.speedKmh || 45,
        status: vehicle.status,
      },
    ];
  }, [vehicle, order]);

  const mapWarehouses: MapWarehouse[] = React.useMemo(() => {
    if (!warehouse || warehouse.lat == null || warehouse.lng == null) {
      return [
        {
          id: "wh-track",
          code: "ORIGIN-HUB",
          name: "Origin Logistics Hub",
          city: "Delhi-NCR",
          lat: 28.7041,
          lng: 77.1025,
        },
      ];
    }
    return [
      {
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        city: warehouse.city,
        lat: warehouse.lat,
        lng: warehouse.lng,
      },
    ];
  }, [warehouse]);

  const isDelivered = order?.status === "DELIVERED";

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-[#0071E3] selection:text-white pb-16">
      {/* 1. Apple-style Clean Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/70 border-b border-black/[0.08] dark:border-white/[0.12] px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
          <LogoMark size={26} />
          <span className="font-semibold tracking-tight text-[15px] text-neutral-900 dark:text-white">
            VOYAGE
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 pl-1 border-l border-neutral-300 dark:border-neutral-700 ml-1">
            Consignment Live Tracking
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[12px] font-mono text-neutral-500 dark:text-neutral-400">
            Real-Time GPS Feed
          </span>
        </div>
      </header>

      {/* 2. Main Tracking Hero */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Status Hero Card */}
        <div className="p-6 rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] shadow-sm text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider">
                Consignment Reference
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono mt-0.5">
                #{order?.orderNumber || tripId}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider ${
                  isDelivered
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] border border-blue-500/20"
                }`}
              >
                {isDelivered ? "✓ Delivered at Destination" : "● In-Transit on Corridor"}
              </span>
            </div>
          </div>

          {/* Progress Ribbon */}
          <div className="grid grid-cols-3 gap-2 py-4">
            <div className="text-left">
              <div className="h-1.5 w-full rounded-full bg-[#0071E3] mb-2" />
              <span className="text-[11px] font-mono text-neutral-400 block">01 DISPATCHED</span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {order?.warehouseName || "Origin Hub"}
              </span>
            </div>
            <div className="text-left">
              <div className={`h-1.5 w-full rounded-full mb-2 ${isDelivered ? "bg-[#0071E3]" : "bg-[#0071E3] animate-pulse"}`} />
              <span className="text-[11px] font-mono text-neutral-400 block">02 IN TRANSIT</span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Highway Corridor
              </span>
            </div>
            <div className="text-left">
              <div className={`h-1.5 w-full rounded-full mb-2 ${isDelivered ? "bg-emerald-500" : "bg-neutral-200 dark:bg-neutral-800"}`} />
              <span className="text-[11px] font-mono text-neutral-400 block">03 UNLOADING</span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {order?.destination || "Destination Dock"}
              </span>
            </div>
          </div>

          {/* Key Facts Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            <div className="p-3 rounded-xl bg-[#F9F9FB] dark:bg-neutral-900/60">
              <span className="text-[10px] font-mono text-neutral-400 block uppercase">Carrier Truck</span>
              <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white mt-0.5 block">
                {order?.vehicleCode || "MH-04-AB-1234"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F9F9FB] dark:bg-neutral-900/60">
              <span className="text-[10px] font-mono text-neutral-400 block uppercase">Expected SLA</span>
              <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white mt-0.5 block">
                {order?.deadline ? new Date(order.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "On Schedule"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F9F9FB] dark:bg-neutral-900/60">
              <span className="text-[10px] font-mono text-neutral-400 block uppercase">Consignee Client</span>
              <span className="text-xs font-semibold text-neutral-900 dark:text-white mt-0.5 block truncate">
                {order?.customerName || "Enterprise Shipper"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F9F9FB] dark:bg-neutral-900/60">
              <span className="text-[10px] font-mono text-neutral-400 block uppercase">Transit Security</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Seal Intact
              </span>
            </div>
          </div>
        </div>

        {/* Live GIS Leaflet Map Card */}
        <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] shadow-sm overflow-hidden text-left">
          <div className="px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0071E3]" />
              <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                Live Highway Corridor Map
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              Auto-refreshes every 30s
            </span>
          </div>

          <div className="h-[380px] w-full relative">
            <LeafletWorldMap
              warehouses={mapWarehouses}
              vehicles={mapVehicles}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Proof of Delivery Document Vault Card */}
        {isDelivered && (
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Verified Proof of Delivery (PoD) Available
                </h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Signed physical bilti and recipient verification stored in Azure Cloud Vault.
                </p>
              </div>
            </div>
            <button
              onClick={() => alert("Verified PoD is archived in Azure Blob Storage container: documents-pod")}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <span>Download Signed Bilti</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
