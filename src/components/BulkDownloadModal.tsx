'use client';
import React from 'react';
import { DownloadProgress } from '@/lib/zipDownloader';

interface BulkDownloadModalProps {
  isOpen: boolean;
  progress: DownloadProgress | null;
  onClose: () => void;
  lang: string;
}

export default function BulkDownloadModal({
  isOpen,
  progress,
  onClose,
  lang,
}: BulkDownloadModalProps) {
  if (!isOpen || !progress) return null;

  const isArabic = lang === 'ar';
  const isCompleted = progress.status === 'completed';
  const isZipping = progress.status === 'zipping';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
          padding: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          animation: 'scaleUp 0.25s ease-out',
        }}
      >
        {/* Animated Icon Header */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: isCompleted ? '#ecfdf5' : 'var(--primary-light)',
            color: isCompleted ? '#10b981' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            fontSize: '2rem',
            transition: 'all 0.3s ease',
          }}
        >
          {isCompleted ? (
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>
              check_circle
            </span>
          ) : (
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '2.2rem',
                animation: isZipping ? 'pulse 1.5s infinite' : 'bounce 1s infinite',
              }}
            >
              folder_zip
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            margin: '0 0 0.5rem 0',
            color: 'var(--text-main)',
          }}
        >
          {isCompleted
            ? isArabic
              ? 'تم حفظ الصور بنجاح! 🎉'
              : 'Photos enregistrées ! 🎉'
            : isZipping
            ? isArabic
              ? 'جاري ضغط الصور في ملف ZIP...'
              : 'Création du fichier ZIP...'
            : isArabic
            ? 'جاري تنزيل الصور...'
            : 'Téléchargement des images...'}
        </h3>

        {/* Subtitle / Filename */}
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            margin: '0 0 1.25rem 0',
            minHeight: '1.2rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isCompleted
            ? isArabic
              ? 'تم حفظ الصور في معرض الصور / التنزيلات بهاتفك.'
              : 'Les photos ont été enregistrées dans votre galerie / dossier.'
            : isZipping
            ? isArabic
              ? 'لحظات فقط لاكتمال الأرشيف...'
              : 'Finalisation et compression...'
            : progress.currentFile
            ? `${progress.currentFile} (${progress.current} / ${progress.total})`
            : `${progress.current} / ${progress.total}`}
        </p>

        {/* Progress Bar Container */}
        <div
          style={{
            width: '100%',
            height: '10px',
            background: 'var(--bg-color)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '0.75rem',
            border: '1px solid var(--border-color)',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress.percentage}%`,
              background: isCompleted
                ? '#10b981'
                : 'linear-gradient(90deg, #4f46e5, #8b5cf6)',
              borderRadius: '999px',
              transition: 'width 0.25s ease',
            }}
          />
        </div>

        {/* Percentage Counter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            marginBottom: '1.5rem',
          }}
        >
          <span>{progress.current} / {progress.total} {isArabic ? 'صورة' : 'photos'}</span>
          <span>{progress.percentage}%</span>
        </div>

        {/* Close Button when completed */}
        {isCompleted ? (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            {isArabic ? 'إغلاق' : 'Fermer'}
          </button>
        ) : (
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            {isArabic
              ? 'يرجى عدم إغلاق هذه الصفحة حتى يكتمل التنزيل...'
              : 'Veuillez patienter pendant la préparation du téléchargement...'}
          </div>
        )}
      </div>
    </div>
  );
}
