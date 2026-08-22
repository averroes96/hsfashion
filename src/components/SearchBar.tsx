'use client';
import { useState } from 'react';
import { track } from '@vercel/analytics';
import VisualSearchModal from './VisualSearchModal';

interface SearchBarProps {
  dict: any;
  lang?: string;
}

export default function SearchBar({ dict, lang = 'fr' }: SearchBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const vs = dict?.visualSearch || {};

  const handleOpen = () => {
    setIsModalOpen(true);
    try {
      track('visual_search_modal_opened', { lang });
    } catch {}
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={handleOpen}
          className="header-ai-search-btn app-tap-target hover-lift"
          title={vs.buttonTooltip || 'Search by Photo 📷'}
          style={{
            padding: '0.45rem 0.95rem',
            fontSize: '0.82rem',
          }}
        >
          <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>📷</span>
          <span>
            {lang === 'ar' ? 'بحث بالذكاء' : 'Recherche IA'}
          </span>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              color: 'white',
              fontSize: '0.62rem',
              padding: '0.12rem 0.35rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              backdropFilter: 'blur(4px)',
            }}
          >
            AI
          </span>
        </button>
      </div>

      <VisualSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dict={dict}
        lang={lang}
      />
    </>
  );
}
