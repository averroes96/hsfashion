'use client';
import React, { useState, useEffect } from 'react';
import { syncPendingOfflineOrders } from '@/lib/offlineOrderQueue';

interface NetworkStatusIndicatorProps {
  dict?: any;
  lang?: string;
}

export default function NetworkStatusIndicator({
  dict,
  lang = 'fr',
}: NetworkStatusIndicatorProps) {
  const isArabic = lang === 'ar';
  const t = dict?.pwa || {};

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      setToastMessage(t.online || (isArabic ? 'تمت استعادة الاتصال بالإنترنت' : 'Connexion rétablie !'));
      setShowToast(true);

      // Auto-sync any queued offline orders
      try {
        const res = await syncPendingOfflineOrders();
        if (res.synced > 0) {
          setToastMessage(t.ordersSynced || (isArabic ? 'تمت مزامنة الطلبيات المحفوظة' : `${res.synced} commande(s) synchronisée(s)`));
        }
      } catch (e) {}

      setTimeout(() => setShowToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastMessage(t.offlineModeNotice || (isArabic ? 'وضع عدم الاتصال: الكتالوج المحفوظ متاح' : 'Mode Hors-Ligne Showroom actif'));
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isArabic, t]);

  // If online and no toast, render nothing
  if (isOnline && !showToast) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px', // Above bottom navigation bar on mobile
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.45rem 1rem',
        borderRadius: '999px',
        background: isOnline ? '#059669' : '#d97706',
        color: '#ffffff',
        fontSize: '0.8rem',
        fontWeight: 700,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        animation: 'fadeIn 0.25s ease-out',
        maxWidth: '90vw',
        textAlign: 'center',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
        {isOnline ? 'wifi' : 'wifi_off'}
      </span>
      <span>{toastMessage}</span>
      {!isOnline && (
        <button
          type="button"
          onClick={() => setShowToast(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            opacity: 0.8,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
