'use client';
import React from 'react';
import { useFavorites } from '@/context/FavoritesContext';

interface FavoritesButtonProps {
  lang: string;
  dict?: any;
}

export default function FavoritesButton({ lang, dict }: FavoritesButtonProps) {
  const { totalFavoritesCount, setIsFavoritesOpen } = useFavorites();
  const isArabic = lang === 'ar';

  return (
    <button
      type="button"
      onClick={() => setIsFavoritesOpen(true)}
      className="btn hover-lift"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.45rem',
        borderRadius: 'var(--radius-full)',
        background: 'var(--surface)',
        border: '1px solid var(--border-color)',
        color: totalFavoritesCount > 0 ? '#e11d48' : 'var(--text-main)',
        cursor: 'pointer',
        minWidth: '40px',
        minHeight: '40px',
      }}
      title={isArabic ? 'عرض المفضلة' : 'Mes Favoris'}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: '1.35rem',
          fontVariationSettings: totalFavoritesCount > 0 ? "'FILL' 1, 'wght' 700" : "'FILL' 0, 'wght' 500",
        }}
      >
        favorite
      </span>

      {totalFavoritesCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: isArabic ? 'auto' : '-4px',
            left: isArabic ? '-4px' : 'auto',
            background: '#e11d48',
            color: 'white',
            borderRadius: '999px',
            padding: '1px 6px',
            fontSize: '0.7rem',
            fontWeight: 900,
            lineHeight: 1.2,
            boxShadow: '0 2px 6px rgba(225, 29, 72, 0.4)',
          }}
        >
          {totalFavoritesCount}
        </span>
      )}
    </button>
  );
}
