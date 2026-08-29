'use client';
import React, { useState, useEffect } from 'react';
import {
  syncEntireCatalogOffline,
  getOfflineShowroomStatus,
  clearOfflineShowroomCache,
  OfflineShowroomStatus,
  OfflineSyncProgress,
} from '@/lib/offlineShowroomManager';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  dict?: any;
  lang?: string;
}

export default function OfflineSyncModal({
  isOpen,
  onClose,
  dict,
  lang = 'fr',
}: OfflineSyncModalProps) {
  const isArabic = lang === 'ar';
  const t = dict?.pwa || {};

  const [status, setStatus] = useState<OfflineShowroomStatus>({
    isSynced: false,
    productCount: 0,
    storageMb: 0,
    lastSyncDate: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<OfflineSyncProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    stepName: '',
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    const s = await getOfflineShowroomStatus();
    setStatus(s);
  };

  const handleStartSync = async () => {
    setIsSyncing(true);
    setFeedback(null);
    setProgress({
      current: 0,
      total: 100,
      percentage: 2,
      stepName: 'Initialisation...',
    });

    try {
      const res = await syncEntireCatalogOffline((p) => {
        setProgress(p);
      });

      setFeedback(t.syncSuccess || (isArabic ? 'تم تحميل الكتالوج بنجاح!' : 'Catalogue hors-ligne prêt avec succès !'));
      await loadStatus();
    } catch (err: any) {
      console.error(err);
      setFeedback(err?.message || 'Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm(isArabic ? 'هل ترغب في مسح بيانات الكتالوج المحفوظة محلياً؟' : 'Voulez-vous vraiment vider le cache hors-ligne ?')) {
      await clearOfflineShowroomCache();
      await loadStatus();
      setFeedback(t.clearSuccess || (isArabic ? 'تم مسح البيانات المحفوظة' : 'Cache vidé'));
    }
  };

  if (!isOpen) return null;

  const formattedDate = status.lastSyncDate
    ? new Date(status.lastSyncDate).toLocaleDateString(isArabic ? 'ar-MA' : 'fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)',
          padding: '2rem 1.75rem',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        {!isSyncing && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: isArabic ? 'auto' : '1rem',
              left: isArabic ? '1rem' : 'auto',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            ✕
          </button>
        )}

        {/* Header Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(16, 185, 129, 0.15) 100%)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.2)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: '#4f46e5' }}>
              cloud_sync
            </span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem 0', textAlign: 'center', color: 'var(--text-main)' }}>
          {t.syncTitle || 'Showroom Hors-Ligne'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.5rem 0', textAlign: 'center', lineHeight: 1.5 }}>
          {t.syncSubtitle || 'Téléchargez l\'intégralité du catalogue pour présenter les modèles et préparer des commandes sans connexion internet.'}
        </p>

        {/* Current Cache Status Card */}
        <div
          style={{
            background: 'var(--bg-color)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Modèles enregistrés</span>
            <strong style={{ fontSize: '1.1rem', color: status.isSynced ? '#059669' : 'var(--text-main)' }}>
              {status.productCount} modèles
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Espace utilisé</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>
              {status.storageMb > 0 ? `${status.storageMb} Mo` : '0 Mo'}
            </strong>
          </div>

          {formattedDate && (
            <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {t.lastSync ? t.lastSync.replace('{date}', formattedDate) : `Dernière synchro : ${formattedDate}`}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar during Sync */}
        {isSyncing && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--primary)' }}>{progress.stepName}</span>
              <span>{progress.percentage}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress.percentage}%`,
                  background: 'linear-gradient(90deg, #4f46e5 0%, #10b981 100%)',
                  borderRadius: '999px',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {feedback && !isSyncing && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#047857',
              fontSize: '0.85rem',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '1.25rem',
            }}
          >
            {feedback}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleStartSync}
            disabled={isSyncing}
            className="btn hover-lift"
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              border: 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }}>
              {isSyncing ? 'progress_activity' : 'download_for_offline'}
            </span>
            <span>{isSyncing ? (t.syncing || 'Synchronisation...') : (t.startSync || 'Télécharger tout le catalogue')}</span>
          </button>

          {status.isSynced && !isSyncing && (
            <button
              type="button"
              onClick={handleClearCache}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.4rem',
                textDecoration: 'underline',
              }}
            >
              {t.clearCache || 'Vider le cache hors-ligne'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
