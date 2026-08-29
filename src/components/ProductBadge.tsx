'use client';
import React from 'react';

interface ProductBadgeProps {
  badge?: string | null;
  lang?: string;
  dict?: any;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export default function ProductBadge({
  badge,
  lang = 'fr',
  dict,
  size = 'md',
  style,
}: ProductBadgeProps) {
  if (!badge || badge === 'NONE') return null;

  const isArabic = lang === 'ar';
  const t = dict?.badges || {};

  const badgeConfig: Record<
    string,
    {
      label: string;
      icon: string;
      bg: string;
      color: string;
      border: string;
      shadow: string;
    }
  > = {
    NEW: {
      label: t.new || (isArabic ? 'جديد' : 'Nouveau'),
      icon: '✨',
      bg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      color: '#ffffff',
      border: 'rgba(255, 255, 255, 0.3)',
      shadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
    },
    BEST_SELLER: {
      label: t.bestSeller || (isArabic ? 'الأكثر طلباً' : 'Best-Seller'),
      icon: '🔥',
      bg: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)',
      color: '#ffffff',
      border: 'rgba(255, 255, 255, 0.3)',
      shadow: '0 2px 8px rgba(234, 88, 12, 0.35)',
    },
    LIMITED_STOCK: {
      label: t.limitedStock || (isArabic ? 'كمية محدودة' : 'Stock Limité'),
      icon: '⚡',
      bg: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
      color: '#ffffff',
      border: 'rgba(255, 255, 255, 0.3)',
      shadow: '0 2px 8px rgba(225, 29, 72, 0.35)',
    },
    PROMO: {
      label: t.promo || (isArabic ? 'عرض خاص' : 'Promo'),
      icon: '🏷️',
      bg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      color: '#ffffff',
      border: 'rgba(255, 255, 255, 0.3)',
      shadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
    },
  };

  const current = badgeConfig[badge.toUpperCase()];
  if (!current) return null;

  const sizeStyles = {
    sm: {
      fontSize: '0.65rem',
      padding: '2px 7px',
      gap: '3px',
    },
    md: {
      fontSize: '0.74rem',
      padding: '3px 9px',
      gap: '4px',
    },
    lg: {
      fontSize: '0.85rem',
      padding: '4px 12px',
      gap: '5px',
    },
  }[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        borderRadius: '999px',
        fontWeight: 800,
        boxShadow: current.shadow,
        letterSpacing: '0.02em',
        lineHeight: 1.2,
        userSelect: 'none',
        ...sizeStyles,
        ...style,
      }}
    >
      <span>{current.icon}</span>
      <span>{current.label}</span>
    </span>
  );
}
