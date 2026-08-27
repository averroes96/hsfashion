'use client';
import { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';
import SkuSearchModal from './SkuSearchModal';

interface SearchBarProps {
  dict: any;
  lang?: string;
}

export default function SearchBar({ dict, lang = 'fr' }: SearchBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isArabic = lang === 'ar';

  const handleOpen = () => {
    setIsModalOpen(true);
    try {
      track('sku_search_opened', { source: 'header', lang });
    } catch {}
  };

  // Keyboard shortcut (Cmd+K or Ctrl+K) to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleOpen}
          className="app-tap-target hover-lift"
          title={isArabic ? 'بحث بالمرجع (⌘K)' : 'Rechercher par référence (⌘K)'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '1.15rem', color: 'var(--primary)' }}
          >
            search
          </span>
          <span className="search-btn-label" style={{ color: 'var(--text-muted)' }}>
            {isArabic ? 'بحث بالمرجع...' : 'Rechercher par réf...'}
          </span>
          <kbd
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '0.05rem 0.35rem',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              marginLeft: isArabic ? 0 : '0.25rem',
              marginRight: isArabic ? '0.25rem' : 0,
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      <SkuSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dict={dict}
        lang={lang}
      />
    </>
  );
}
