'use client';
import React, { useEffect } from 'react';

export interface FilterCategoryItem {
  id: string;
  name: string;
  arabicName?: string | null;
  count: number;
}

interface ProductFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  dict?: any;
  categories: FilterCategoryItem[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  selectedAssortment: string;
  onSelectAssortment: (val: string) => void;
  sortBy: string;
  onSelectSort: (val: string) => void;
  totalFilteredCount: number;
  onReset: () => void;
}

export default function ProductFilterDrawer({
  isOpen,
  onClose,
  lang,
  dict,
  categories,
  selectedCategory,
  onSelectCategory,
  selectedAssortment,
  onSelectAssortment,
  sortBy,
  onSelectSort,
  totalFilteredCount,
  onReset,
}: ProductFilterDrawerProps) {
  const isArabic = lang === 'ar';
  const t = dict?.filters || {};

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const assortmentOptions = [
    { value: 'all', label: t.allAssortments || 'Tous les formats', icon: 'all_inclusive' },
    { value: '12', label: t.pairs12 || '12 paires (2x 36-41)', icon: 'package_2' },
    { value: '15', label: t.pairs15 || '15 paires (3x 36-40)', icon: 'package_2' },
    { value: '18', label: t.pairs18 || '18 paires (3x 36-41)', icon: 'package_2' },
    { value: '24', label: t.pairs24 || '24 paires (4x 36-41)', icon: 'package_2' },
  ];

  const sortOptions = [
    { value: 'newest', label: t.sortNewest || '✨ Plus récents', icon: 'auto_awesome' },
    { value: 'popular', label: t.sortPopular || '🔥 Plus populaires', icon: 'local_fire_department' },
    { value: 'ref_asc', label: t.sortRefAsc || '🔤 Référence (A-Z)', icon: 'sort_by_alpha' },
    { value: 'ref_desc', label: t.sortRefDesc || '🔤 Référence (Z-A)', icon: 'sort_by_alpha' },
  ];

  const isFiltered = selectedCategory !== 'all' || selectedAssortment !== 'all' || sortBy !== 'newest';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: isArabic ? 'flex-start' : 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.25s ease-out forwards',
        }}
      />

      {/* Slide-over Drawer Panel */}
      <div
        className="glass-card"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: 'var(--surface)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          animation: isArabic ? 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '1.5rem',
                color: 'var(--primary)',
                padding: '6px',
                borderRadius: '8px',
                background: 'var(--primary-light)',
              }}
            >
              tune
            </span>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                {t.drawerTitle || 'Filtrer & Trier la Collection'}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {totalFilteredCount} {t.product || 'modèles trouvés'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: '6px',
              borderRadius: '50%',
              transition: 'background 0.2s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>
              close
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
          }}
        >
          {/* Section 1: Sorting */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                swap_vert
              </span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {t.sortTitle || 'Trier les modèles'}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {sortOptions.map((opt) => {
                const isActive = sortBy === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelectSort(opt.value)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isActive ? 'var(--primary-light)' : 'var(--bg-color)',
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: isArabic ? 'right' : 'left',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Assortment Filter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                package_2
              </span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {t.assortmentTitle || 'Conditionnement Carton (Assortiment)'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {assortmentOptions.map((opt) => {
                const isActive = selectedAssortment === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelectAssortment(opt.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isActive ? 'var(--primary-light)' : 'var(--bg-color)',
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '1.15rem',
                          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                        }}
                      >
                        {opt.icon}
                      </span>
                      <span>{opt.label}</span>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Categories / Families Filter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                category
              </span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {t.categoryTitle || 'Catégories / Familles'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  border: selectedCategory === 'all' ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  background: selectedCategory === 'all' ? 'var(--primary-light)' : 'var(--bg-color)',
                  color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: selectedCategory === 'all' ? 800 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {t.allCategories || 'Toutes les catégories'}
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const catName = isArabic && cat.arabicName ? cat.arabicName : cat.name;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    style={{
                      padding: '0.5rem 0.9rem',
                      borderRadius: 'var(--radius-full)',
                      border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isActive ? 'var(--primary-light)' : 'var(--bg-color)',
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{catName}</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: isActive ? 'var(--primary)' : 'var(--border-color)',
                        color: isActive ? 'white' : 'var(--text-muted)',
                        fontWeight: 700,
                      }}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '0.75rem',
            background: 'var(--surface)',
          }}
        >
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="btn btn-outline"
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
              }}
            >
              {t.reset || 'Réinitialiser'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn"
            style={{
              flex: 2,
              padding: '0.75rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            }}
          >
            {(t.apply || 'Voir les {count} modèles').replace('{count}', String(totalFilteredCount))}
          </button>
        </div>
      </div>
    </div>
  );
}
