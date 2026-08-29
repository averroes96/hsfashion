'use client';

const STORAGE_KEY_PENDING_ORDERS = 'hsfashion_pending_orders';

export interface PendingOfflineOrder {
  id: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  customerCity?: string;
  notes?: string;
  items: Array<{
    productId: string;
    reference: string;
    cartons: number;
    pairsPerCarton?: number;
    assortmentRatio?: string;
  }>;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
}

/**
 * Stages an order locally when offline
 */
export function queueOfflineOrder(order: Omit<PendingOfflineOrder, 'id' | 'createdAt' | 'status'>): PendingOfflineOrder {
  const newOrder: PendingOfflineOrder = {
    ...order,
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  const current = getPendingOfflineOrders();
  current.push(newOrder);

  try {
    localStorage.setItem(STORAGE_KEY_PENDING_ORDERS, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save offline order to localStorage:', err);
  }

  return newOrder;
}

/**
 * Gets all pending offline orders from local storage
 */
export function getPendingOfflineOrders(): PendingOfflineOrder[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Removes a synced order by ID
 */
export function removePendingOfflineOrder(id: string): void {
  const current = getPendingOfflineOrders().filter((o) => o.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_PENDING_ORDERS, JSON.stringify(current));
  } catch {}
}

/**
 * Attempts to post all pending offline orders to the server once online
 */
export async function syncPendingOfflineOrders(
  onStatus?: (syncedCount: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const pending = getPendingOfflineOrders().filter((o) => o.status !== 'synced');
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const order = pending[i];
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: order.customerName || 'Client Showroom (Hors-ligne)',
          customerPhone: order.customerPhone || '',
          customerCity: order.customerCity || '',
          notes: order.notes ? `[Commande Hors-Ligne Showroom] ${order.notes}` : '[Commande Hors-Ligne Showroom]',
          items: order.items.map((it) => ({
            productId: it.productId,
            cartons: it.cartons,
          })),
        }),
      });

      if (res.ok) {
        synced++;
        removePendingOfflineOrder(order.id);
        onStatus?.(synced, pending.length);
      } else {
        failed++;
      }
    } catch (err) {
      console.warn('Failed to sync offline order:', order.id, err);
      failed++;
    }
  }

  return { synced, failed };
}
