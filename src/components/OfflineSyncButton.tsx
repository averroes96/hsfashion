'use client';
import React, { useState } from 'react';
import OfflineSyncModal from './OfflineSyncModal';

interface OfflineSyncButtonProps {
  lang?: string;
  dict?: any;
}

export default function OfflineSyncButton({
  lang = 'fr',
  dict,
}: OfflineSyncButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isArabic = lang === 'ar';
  const t = dict?.pwa || {};

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-icon hover-lift"
        title={t.syncTitle || (isArabic ? 'مزامنة الكتالوج بدون إنترنت' : 'Mode Showroom Hors-Ligne')}
        aria-label={t.syncTitle || 'Mode Showroom Hors-Ligne'}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1px solid var(--border-color)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-main)',
          transition: 'all 0.2s ease',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#4f46e5' }}>
          cloud_sync
        </span>
      </button>

      <OfflineSyncModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        dict={dict}
        lang={lang}
      />
    </>
  );
}
