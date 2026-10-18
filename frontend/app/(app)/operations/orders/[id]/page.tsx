'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import {
  ArrowLeft,
  Package,
  Clock,
  DollarSign,
  Truck,
  Building2,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { OrderItem, VehicleItem, WarehouseItem } from '@/lib/mock-data';
import { dataProvider } from '@/lib/data-provider';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { FadeIn, SpringCard } from '@/components/motion';
import { tactileAudio } from '@/lib/sound-effects';
import { useToast } from '@/components/ui/toast';
import { usePermissions } from '@/components/providers/AuthProvider';
import { ConfirmActionModal } from '@/components/ui/ConfirmActionModal';
import { DataProvenanceBadge } from '@/components/ui/DataProvenanceBadge';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { canDecommission } = usePermissions();

  const [order, setOrder] = React.useState<OrderItem | null>(null);
  const [vehicles, setVehicles] = React.useState<VehicleItem[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      dataProvider.getOrder(orderId),
      dataProvider.getVehicles(),
      dataProvider.getWarehouses(),
    ])
      .then(([ord, vList, wList]) => {
        if (mounted) {
          setOrder(ord);
          setVehicles(vList);
          setWarehouses(wList);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch order details:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = React.useState(false);

  const executeDelete = async () => {
    if (!order) return;

    setDeleting(true);
    tactileAudio.playCriticalAlert();

    try {
      await dataProvider.deleteOrder(order.id);

      toast({
        title: "Order Consignment Cancelled",
        message: `${order.orderNumber} (${order.customerName}) removed from active manifest and database.`,
        type: "success",
      });
      router.push('/operations/orders');
    } catch {
      toast({
        title: "Action Failed",
        message: "Unable to remove order consignment.",
        type: "critical",
      });
    } finally {
      setDeleting(false);
    }
  };

  const vehicle = order ? vehicles.find((v) => v.id === order.vehicleId) : null;
  const warehouse = order ? warehouses.find((w) => w.id === order.warehouseId) : null;

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 font-mono text-sm text-nexus-on-surface-variant">
          Loading order details...
        </div>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell>
        <div className="p-8 space-y-4 font-mono text-sm">
          <p className="text-nexus-on-surface">Order &apos;{orderId}&apos; was not found.</p>
          <Link href="/operations/orders">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/operations/orders">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="h-4 w-4" /> Back to Orders
              </Button>
            </Link>
            <div className="h-4 w-px bg-nexus-outline-variant/30" />
            <h1 className="text-xl font-bold font-mono text-nexus-on-surface">
              {order.orderNumber}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {canDecommission && (
              <Button
                variant="critical"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleting}
                className="font-mono text-xs gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> {deleting ? "Cancelling..." : "Cancel Order"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Delivery Status</span>
              <DataProvenanceBadge
                status={order.status === 'DELIVERED' ? 'CONFIRMED' : order.status === 'DELAYED' ? 'ESTIMATED' : 'REPORTED'}
              />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">{order.status}</div>
            <p className="text-xs text-nexus-on-surface-variant">Priority: {order.priority}</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Total Value</span>
              <DollarSign className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">{formatCurrency(order.totalCost)}</div>
            <p className="text-xs text-nexus-on-surface-variant">Insured high-value freight</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Items Count</span>
              <Package className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">{order.itemsCount} pkgs</div>
            <p className="text-xs text-nexus-on-surface-variant">SLA Compliant: {order.slaCompliant ? 'Yes' : 'At Risk'}</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>SLA Promised ETA</span>
              <DataProvenanceBadge status="PREDICTED" />
            </div>
            <div className="text-xs font-bold font-mono text-nexus-on-surface">{formatDateTime(order.deadline)}</div>
            <p className="text-xs text-nexus-on-surface-variant">Est: {formatDateTime(order.estimatedEta)} (Local)</p>
          </SpringCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Consignee & Fulfillment Metadata
              </h3>
              <div className="p-4 rounded-xl bg-nexus-surface-container/60 border border-nexus-outline-variant/30 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-nexus-on-surface-variant block">Customer / Consignee</span>
                  <span className="font-bold text-sm">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-nexus-on-surface-variant block">Destination Metro</span>
                  <span className="font-bold text-sm">{order.destination}</span>
                </div>
                <div>
                  <span className="text-nexus-on-surface-variant block">Origin Distribution Hub</span>
                  <span className="font-bold">{warehouse?.name || order.warehouseName || 'Central Hub'}</span>
                </div>
                <div>
                  <span className="text-nexus-on-surface-variant block">Assigned Transport Vehicle</span>
                  <span className="font-bold">{vehicle?.code || order.vehicleCode || 'Unassigned'}</span>
                </div>
              </div>
            </SpringCard>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Chain of Custody Events
              </h3>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Picked & Manifested at Hub</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Loaded onto {vehicle?.code || 'Vehicle'}</span>
                </div>
                <div className="flex items-center gap-2 text-nexus-secondary">
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>En Route to {order.destination}</span>
                </div>
              </div>
            </SpringCard>
          </div>
        </div>

        {/* Destructive Cancel Modal — Blueprint §35 */}
        <ConfirmActionModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={executeDelete}
          title={`Cancel Consignment ${order.orderNumber}`}
          description={`Are you sure you want to cancel consignment ${order.orderNumber} for ${order.customerName}?`}
          affectedEntities={[
            {
              type: "Consignment",
              id: order.id,
              name: `${order.orderNumber} (${order.destination})`,
            },
          ]}
          consequenceWarning="This will remove the shipment from active vehicle manifests and cancel scheduled destination dock check-in."
          confirmLabel="Cancel Consignment"
          confirmVariant="danger"
          isLoading={deleting}
        />
      </FadeIn>
    </AppShell>
  );
}
