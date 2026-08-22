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
          className="hover-lift"
          title={vs.buttonTooltip || 'Search by Photo 📷'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>📷</span>
          <span style={{ display: 'none', md: 'inline' } as any} className="hide-mobile">
            {vs.photoSearch || 'Photo Search'}
          </span>
          <span
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
              color: 'white',
              fontSize: '0.65rem',
              padding: '0.15rem 0.4rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
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
