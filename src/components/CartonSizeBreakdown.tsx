'use client';
import React, { useState } from 'react';

export interface SizeItem {
  size: string;
  ratio: number;
}

interface CartonSizeBreakdownProps {
  lang: string;
  dict?: any;
  assortment?: SizeItem[] | null;
  initialCartons?: number;
}

export default function CartonSizeBreakdown({
  lang,
  dict,
  assortment,
  initialCartons = 1,
}: CartonSizeBreakdownProps) {
  const [cartons, setCartons] = useState(initialCartons);
  const isArabic = lang === 'ar';
  const t = dict?.cartonBreakdown || {};

  // If no assortment is set for this product, do NOT show the breakdown
  if (!assortment || !Array.isArray(assortment) || assortment.length === 0) {
    return null;
  }

  const totalPairsPerCarton = assortment.reduce((acc, cur) => acc + (Number(cur.ratio) || 0), 0);
  const totalPairs = cartons * totalPairsPerCarton;

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.15rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-color)',
        border: '1.5px solid var(--border-color)',
        marginBottom: '1.25rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>
            grid_view
          </span>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            {t.title || (isArabic ? 'توزيع المقاسات في الكرتونة' : 'Assortiment des pointures par carton')}
          </h4>
        </div>

        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--primary)',
            background: 'var(--primary-light)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {totalPairsPerCarton} {t.pairs || (isArabic ? 'أزواج' : 'paires')} / {isArabic ? 'كرتونة' : 'carton'}
        </span>
      </div>

      {/* Carton Multiplier Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '0.85rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {isArabic ? 'محاكاة الكمية:' : 'Simuler :'}
        </span>
        {[1, 2, 5, 10].map((qty) => (
          <button
            key={qty}
            type="button"
            onClick={() => setCartons(qty)}
            style={{
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${cartons === qty ? 'var(--primary)' : 'var(--border-color)'}`,
              background: cartons === qty ? 'var(--primary)' : 'var(--surface)',
              color: cartons === qty ? 'white' : 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {qty} {isArabic ? (qty === 1 ? 'كرتونة' : qty === 2 ? 'كرتونتان' : 'كراتين') : (qty === 1 ? 'carton' : 'cartons')}
          </button>
        ))}
      </div>

      {/* Size Distribution Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${Math.min(65, 300 / assortment.length)}px, 1fr))`,
          gap: '0.45rem',
          marginBottom: '0.75rem',
        }}
      >
        {assortment.map((item, index) => {
          const qty = (Number(item.ratio) || 0) * cartons;
          return (
            <div
              key={`${item.size}-${index}`}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.25rem',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '2px',
                  marginBottom: '3px',
                }}
              >
                {item.size}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                {qty}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {isArabic ? 'زوج' : 'pr'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          paddingTop: '0.4rem',
          borderTop: '1px dashed var(--border-color)',
        }}
      >
        <span>
          {isArabic
            ? `الإجمالي لـ ${cartons} كراتين:`
            : `Total pour ${cartons} ${cartons > 1 ? 'cartons' : 'carton'} :`}
        </span>
        <strong style={{ color: 'var(--text-main)', fontWeight: 800 }}>
          {totalPairs} {t.pairs || (isArabic ? 'زوج' : 'paires')}
        </strong>
      </div>
    </div>
  );
}
