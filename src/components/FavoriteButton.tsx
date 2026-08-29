'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useFavorites } from '@/context/FavoritesContext';

interface FavoriteButtonProps {
  product: {
    id: string;
    reference: string;
    familyName: string;
    imageUrl?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'floating' | 'inline';
  dict?: any;
  lang?: string;
}

export default function FavoriteButton({
  product,
  size = 'md',
  variant = 'floating',
  dict,
  lang: propLang,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimate, setIsAnimate] = useState(false);
  const params = useParams();
  
  const currentLang = propLang || (params?.lang as string) || 'fr';
  const isArabic = currentLang === 'ar';

  const addText = dict?.favorites?.add || (isArabic ? 'إضافة إلى المفضلة' : 'Ajouter aux favoris');
  const addedText = dict?.favorites?.added || (isArabic ? 'في المفضلة' : 'Favori');
  const removeText = dict?.favorites?.remove || (isArabic ? 'حذف من المفضلة' : 'Retirer des favoris');

  const favorited = isFavorite(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimate(true);
    toggleFavorite(product);
    setTimeout(() => setIsAnimate(false), 300);
  };

  const buttonDimensions = size === 'sm' ? '30px' : size === 'lg' ? '44px' : '36px';
  const iconSize = size === 'sm' ? '1.15rem' : size === 'lg' ? '1.55rem' : '1.3rem';

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="btn hover-lift"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: favorited ? '#ffe4e6' : 'var(--surface)',
          border: `1.5px solid ${favorited ? '#f43f5e' : 'var(--border-color)'}`,
          color: favorited ? '#e11d48' : 'var(--text-main)',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isAnimate ? 'scale(1.15)' : 'scale(1)',
        }}
        title={favorited ? removeText : addText}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: iconSize,
            color: favorited ? '#e11d48' : 'var(--text-muted)',
            fontVariationSettings: favorited ? "'FILL' 1, 'wght' 700" : "'FILL' 0, 'wght' 500",
            transition: 'transform 0.2s ease',
          }}
        >
          favorite
        </span>
        <span>{favorited ? addedText : addText}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: '8px',
        right: isArabic ? 'auto' : '8px',
        left: isArabic ? '8px' : 'auto',
        zIndex: 15,
        width: buttonDimensions,
        height: buttonDimensions,
        borderRadius: '50%',
        background: favorited ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `1.5px solid ${favorited ? '#f43f5e' : 'rgba(226, 232, 240, 0.8)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: favorited
          ? '0 4px 12px rgba(225, 29, 72, 0.25)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        transform: isAnimate ? 'scale(1.25)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      title={favorited ? removeText : addText}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: iconSize,
          color: favorited ? '#e11d48' : '#64748b',
          fontVariationSettings: favorited ? "'FILL' 1, 'wght' 700" : "'FILL' 0, 'wght' 500",
          transition: 'all 0.15s ease',
        }}
      >
        favorite
      </span>
    </button>
  );
}
