'use client';
import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { track } from '@vercel/analytics';

interface AddToCartButtonProps {
  product: {
    id: string;
    reference: string;
    familyName?: string;
    imageUrl?: string;
  };
  dict: any;
  lang: string;
}

export default function AddToCartButton({ product, dict, lang }: AddToCartButtonProps) {
  const [cartons, setCartons] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();

  const isArabic = lang === 'ar';
  const cartDict = dict?.cart || {};

  const handleIncrement = () => setCartons((prev) => prev + 1);
  const handleDecrement = () => setCartons((prev) => Math.max(1, prev - 1));

  const handleAdd = () => {
    addToCart({
      productId: product.id,
      reference: product.reference,
      familyName: product.familyName,
      imageUrl: product.imageUrl,
      cartons,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);

    try {
      track('add_to_cart', {
        reference: product.reference,
        cartons,
        lang,
      });
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Carton Stepper */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            padding: '0.3rem',
          }}
        >
          <button
            type="button"
            onClick={handleDecrement}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'var(--surface)',
              color: 'var(--text-main)',
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            -
          </button>
          <div
            style={{
              padding: '0 0.85rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              minWidth: '100px',
              textAlign: 'center',
              color: 'var(--text-main)',
            }}
          >
            {cartons} {cartDict.carton || 'Carton(s)'}
          </div>
          <button
            type="button"
            onClick={handleIncrement}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'var(--surface)',
              color: 'var(--text-main)',
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={handleAdd}
          className="btn btn-primary"
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '0.85rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: isAdded
              ? '#16a34a'
              : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: '#ffffff',
            border: 'none',
            boxShadow: isAdded
              ? '0 4px 14px rgba(22, 163, 74, 0.35)'
              : '0 4px 14px rgba(79, 70, 229, 0.35)',
            transition: 'all 0.25s ease',
            cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#ffffff' }}>
            {isAdded ? 'check' : 'shopping_bag'}
          </span>
          <span style={{ color: '#ffffff' }}>
            {isAdded
              ? cartDict.addedToCart || 'Ajouté au panier !'
              : `${cartDict.addToCart || 'Ajouter à la Commande'} (${cartons})`}
          </span>
        </button>
      </div>
    </div>
  );
}
