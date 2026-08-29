'use client';
import React from 'react';

export interface PdfProgressState {
  isOpen: boolean;
  isGenerating: boolean;
  isComplete: boolean;
  current: number;
  total: number;
  stepName: string;
  percentage: number;
  error?: string | null;
}

interface PdfLookbookModalProps {
  progress: PdfProgressState;
  onClose: () => void;
  onRetry?: () => void;
  dict?: any;
  lang?: string;
}

export default function PdfLookbookModal({
  progress,
  onClose,
  onRetry,
  dict,
  lang = 'fr',
}: PdfLookbookModalProps) {
  if (!progress.isOpen) return null;

  const isArabic = lang === 'ar';
  const t = dict?.lookbook || {};

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
          maxWidth: '460px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)',
          padding: '2rem 1.75rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Close Button when done or on error */}
        {(progress.isComplete || progress.error) && (
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

        {/* Icon State */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
          {progress.error ? (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
                error
              </span>
            </div>
          ) : progress.isComplete ? (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(22, 163, 74, 0.25)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '2.2rem' }}>
                check_circle
              </span>
            </div>
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(99, 102, 241, 0.25) 100%)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '2.2rem',
                  animation: 'spin 1.5s linear infinite',
                }}
              >
                auto_stories
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: 'var(--text-main)' }}>
          {progress.error
            ? 'Erreur lors de la génération'
            : progress.isComplete
            ? 'Catalogue PDF Prêt !'
            : t.generatingTitle || 'Génération du Catalogue PDF'}
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
          {progress.error
            ? progress.error
            : progress.isComplete
            ? 'Votre Lookbook haute résolution avec QR codes et fiches complètes a été téléchargé.'
            : t.generatingSubtitle || 'Création de votre Lookbook haute résolution avec QR codes et assortiments...'}
        </p>

        {/* Progress Bar (During generation) */}
        {progress.isGenerating && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '0.45rem',
              }}
            >
              <span style={{ color: 'var(--primary)' }}>{progress.stepName}</span>
              <span>{progress.percentage}%</span>
            </div>

            <div
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '999px',
                background: 'var(--border-color)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(5, progress.percentage)}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, #4f46e5 0%, #818cf8 100%)',
                  transition: 'width 0.25s ease',
                  boxShadow: '0 0 12px rgba(79, 70, 229, 0.5)',
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
          {progress.isComplete && (
            <>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="btn btn-outline"
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  🔄 {t.retryDownload || 'Télécharger à nouveau'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="btn hover-lift"
                style={{
                  padding: '0.6rem 1.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                }}
              >
                Fermer
              </button>
            </>
          )}

          {progress.error && (
            <>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="btn btn-primary"
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  Réessayer
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
