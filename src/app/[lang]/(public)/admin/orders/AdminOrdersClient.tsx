'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { exportOrdersToCsv } from '@/lib/csvExporter';

interface OrderItem {
  id: string;
  reference: string;
  cartons: number;
  familyTitle?: string | null;
  imageUrl?: string | null;
  product?: {
    id: string;
    reference: string;
    family?: { name: string; arabicName?: string | null } | null;
    images?: { thumbnailUrl: string; mediumUrl: string }[];
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerPhone: string;
  customerName?: string | null;
  customerCity?: string | null;
  notes?: string | null;
  status: 'PENDING' | 'VALIDATED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  totalCartons: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface AdminOrdersClientProps {
  dict: any;
  lang: string;
}

export default function AdminOrdersClient({ dict, lang }: AdminOrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    ALL: 0,
    PENDING: 0,
    VALIDATED: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  });
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const isArabic = lang === 'ar';
  const ordersDict = dict?.orders || {};
  const cartDict = dict?.cart || {};

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== 'ALL') {
        params.set('status', activeStatus);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setCounts(data.counts || {});
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Refresh orders list
        fetchOrders();
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(ordersDict.deleteConfirm || 'Voulez-vous vraiment supprimer cette commande ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return {
          label: ordersDict.pending || 'En attente',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          icon: '⏳',
        };
      case 'VALIDATED':
        return {
          label: ordersDict.validated || 'Validée',
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.12)',
          icon: '✅',
        };
      case 'PROCESSING':
        return {
          label: ordersDict.processing || 'En préparation',
          color: '#8b5cf6',
          bg: 'rgba(139, 92, 246, 0.12)',
          icon: '📦',
        };
      case 'COMPLETED':
        return {
          label: ordersDict.completed || 'Livrée',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          icon: '🚚',
        };
      case 'CANCELLED':
        return {
          label: ordersDict.cancelled || 'Annulée',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          icon: '❌',
        };
      default:
        return { label: status, color: '#64748b', bg: '#f1f5f9', icon: '•' };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isArabic ? 'ar-MA' : 'fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const tabs = [
    { key: 'ALL', label: ordersDict.all || 'Toutes' },
    { key: 'PENDING', label: `⏳ ${ordersDict.pending || 'En attente'}` },
    { key: 'VALIDATED', label: `✅ ${ordersDict.validated || 'Validées'}` },
    { key: 'PROCESSING', label: `📦 ${ordersDict.processing || 'En préparation'}` },
    { key: 'COMPLETED', label: `🚚 ${ordersDict.completed || 'Livrées'}` },
    { key: 'CANCELLED', label: `❌ ${ordersDict.cancelled || 'Annulées'}` },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
            📦 {ordersDict.title || 'Gestion des Commandes'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0 0', fontSize: '0.95rem' }}>
            {ordersDict.subtitle || 'Traitez, validez et suivez les commandes de gros passées par vos clients.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => exportOrdersToCsv(orders)}
            disabled={orders.length === 0}
            className="btn btn-outline hover-lift"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem', color: '#16a34a' }}>
              table_view
            </span>
            <span>{dict?.analytics?.exportOrders || 'Exporter Excel/CSV'}</span>
          </button>

          <button
            type="button"
            onClick={fetchOrders}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-full)' }}
          >
            <span>🔄</span>
            <span>{dict?.pagination?.retry || 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="admin-mode-tabs"
        style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.key;
          const count = counts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveStatus(tab.key)}
              className={`admin-mode-tab ${isActive ? 'active' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? 'var(--primary)' : 'rgba(100, 116, 139, 0.15)',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  borderRadius: '999px',
                  padding: '1px 6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Toolbar */}
      <div className="admin-card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              top: '50%',
              left: isArabic ? 'auto' : '1rem',
              right: isArabic ? '1rem' : 'auto',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '1.25rem',
            }}
          >
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'بحث برقم الهاتف، اسم المحل أو رقم الطلبية...' : 'Rechercher par téléphone, nom de boutique ou N° commande...'}
            className="form-control"
            style={{
              paddingLeft: isArabic ? '1rem' : '2.75rem',
              paddingRight: isArabic ? '2.75rem' : '1rem',
              fontSize: '0.9rem',
            }}
          />
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '2rem' }}>⏳</span>
          <p style={{ marginTop: '0.5rem' }}>{dict?.pagination?.loadingMore || 'Chargement des commandes...'}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <span style={{ fontSize: '3rem', opacity: 0.5 }}>📦</span>
          <h3 style={{ margin: '1rem 0 0.5rem 0' }}>
            {ordersDict.noOrders || 'Aucune commande trouvée.'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {searchQuery
              ? (isArabic ? 'لا توجد نتائج مطابقة لبحثك.' : 'Aucun résultat pour cette recherche.')
              : (isArabic ? 'ستظهر الطلبيات هنا فور قيام الزوار بطلب موديلات من الكتالوج.' : 'Les commandes passées par vos visiteurs apparaîtront ici.')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
            const whatsappBuyerUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              isArabic
                ? `مرحبا، بخصوص طلبيتك رقم ${order.orderNumber} في HS Fashion...`
                : `Bonjour, concernant votre commande ${order.orderNumber} sur HS Fashion...`
            )}`;

            return (
              <div
                key={order.id}
                className="admin-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderLeft: isArabic ? 'none' : `4px solid ${badge.color}`,
                  borderRight: isArabic ? `4px solid ${badge.color}` : 'none',
                }}
              >
                {/* Top Row: Order Number, Date, Status */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    paddingBottom: '0.85rem',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '0.04em' }}>
                      {order.orderNumber}
                    </span>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        padding: '0.2rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    📅 {formatDate(order.createdAt)}
                  </span>
                </div>

                {/* Buyer Information Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1rem',
                    padding: '0.9rem 0',
                    alignItems: 'center',
                  }}
                >
                  {/* Phone & Direct Contacts */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      📞 {ordersDict.customer || 'Client'}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '2px' }}>
                      {order.customerPhone}
                    </div>
                    {order.customerName && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        🏷️ {order.customerName}
                      </div>
                    )}
                    {order.customerCity && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        📍 {order.customerCity}
                      </div>
                    )}

                    {/* Quick Call & WhatsApp Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', textDecoration: 'none' }}
                      >
                        📞 {ordersDict.call || 'Appeler'}
                      </a>
                      <a
                        href={whatsappBuyerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                        style={{
                          padding: '0.3rem 0.75rem',
                          fontSize: '0.78rem',
                          color: '#10b981',
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                          textDecoration: 'none',
                        }}
                      >
                        💬 {ordersDict.whatsapp || 'WhatsApp'}
                      </a>
                    </div>
                  </div>

                  {/* Summary & Notes */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      📊 {ordersDict.totalCartons || 'Total Cartons'}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', marginTop: '2px' }}>
                      {order.totalCartons} {cartDict.cartons || 'Cartons'} ({order.items.length} {isArabic ? 'موديلات' : 'modèles'})
                    </div>

                    {order.notes && (
                      <div
                        style={{
                          background: 'var(--bg-color)',
                          border: '1px dashed var(--border-color)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.5rem',
                        }}
                      >
                        📝 <strong>Note:</strong> {order.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ordered Items Grid */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginTop: '0.35rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                    👟 {ordersDict.items || 'Articles commandés'}:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
                    {order.items.map((item) => {
                      const thumb =
                        item.imageUrl ||
                        item.product?.images?.[0]?.thumbnailUrl ||
                        item.product?.images?.[0]?.mediumUrl;

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            background: 'var(--bg-color)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={item.reference}
                              style={{
                                width: '42px',
                                height: '42px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '4px',
                                background: 'var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                                flexShrink: 0,
                              }}
                            >
                              👟
                            </div>
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                              {item.reference}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                              {item.cartons} {cartDict.carton || 'Carton(s)'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.85rem',
                    marginTop: '0.85rem',
                  }}
                >
                  {/* Status Transition Actions */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {ordersDict.changeStatus || 'Changer statut'}:
                    </span>

                    {order.status !== 'VALIDATED' && (
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'VALIDATED')}
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        ✅ Valider
                      </button>
                    )}

                    {order.status !== 'PROCESSING' && (
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        📦 En préparation
                      </button>
                    )}

                    {order.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', color: '#10b981' }}
                      >
                        🚚 Livrée
                      </button>
                    )}

                    {order.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                        className="btn-danger-outline"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        ❌ Annuler
                      </button>
                    )}
                  </div>

                  {/* Delete Order (for cancelled or test orders) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                    title="Supprimer la commande"
                  >
                    🗑️ {dict?.admin?.delete || 'Supprimer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
