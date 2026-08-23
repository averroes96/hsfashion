'use client';
import React from 'react';
import { useCart } from '@/context/CartContext';

interface CartButtonProps {
  lang: string;
  dict?: any;
}

export default function CartButton({ lang, dict }: CartButtonProps) {
  const { openCart, totalCartons, totalItems } = useCart();
  const isArabic = lang === 'ar';

  return (
    <button
      type="button"
      onClick={openCart}
      className="cart-nav-button"
      aria-label="Shopping Cart"
      title={isArabic ? 'سلة الطلبيات' : 'Panier de commande'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        background: 'var(--surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-full)',
        padding: '0.5rem 0.9rem',
        color: 'var(--text-main)',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '0.875rem',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>
        shopping_bag
      </span>
      <span className="cart-btn-label" style={{ display: 'inline-block' }}>
        {isArabic ? 'الطلبية' : 'Commande'}
      </span>
      {totalItems > 0 && (
        <span
          style={{
            background: 'var(--primary)',
            color: 'white',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '0.1rem 0.45rem',
            minWidth: '18px',
            textAlign: 'center',
            lineHeight: 1.3,
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.35)',
          }}
        >
          {totalCartons}
        </span>
      )}
    </button>
  );
}
