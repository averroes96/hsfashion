'use client';
import React, { useState, useEffect } from 'react';

export interface SizeAssortmentItem {
  size: string;
  ratio: number;
}

interface AdminAssortmentConfigProps {
  value: SizeAssortmentItem[] | null;
  onChange: (value: SizeAssortmentItem[] | null) => void;
  dict?: any;
  lang?: string;
}

const PRESETS = [
  {
    name: '👠 12 paires (2x 36-41)',
    items: [
      { size: '36', ratio: 2 },
      { size: '37', ratio: 2 },
      { size: '38', ratio: 2 },
      { size: '39', ratio: 2 },
      { size: '40', ratio: 2 },
      { size: '41', ratio: 2 },
    ],
  },
  {
    name: '👡 15 paires (3x 36-40)',
    items: [
      { size: '36', ratio: 3 },
      { size: '37', ratio: 3 },
      { size: '38', ratio: 3 },
      { size: '39', ratio: 3 },
      { size: '40', ratio: 3 },
    ],
  },
  {
    name: '👢 18 paires (3x 36-41)',
    items: [
      { size: '36', ratio: 3 },
      { size: '37', ratio: 3 },
      { size: '38', ratio: 3 },
      { size: '39', ratio: 3 },
      { size: '40', ratio: 3 },
      { size: '41', ratio: 3 },
    ],
  },
  {
    name: '📦 24 paires (4x 36-41)',
    items: [
      { size: '36', ratio: 4 },
      { size: '37', ratio: 4 },
      { size: '38', ratio: 4 },
      { size: '39', ratio: 4 },
      { size: '40', ratio: 4 },
      { size: '41', ratio: 4 },
    ],
  },
];

export default function AdminAssortmentConfig({
  value,
  onChange,
  dict,
  lang = 'fr',
}: AdminAssortmentConfigProps) {
  const [isEnabled, setIsEnabled] = useState(Boolean(value && value.length > 0));
  const [items, setItems] = useState<SizeAssortmentItem[]>(
    value && value.length > 0 ? value : PRESETS[0].items
  );

  useEffect(() => {
    if (value && value.length > 0) {
      setIsEnabled(true);
      setItems(value);
    }
  }, [value]);

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (enabled) {
      const initial = items.length > 0 ? items : PRESETS[0].items;
      setItems(initial);
      onChange(initial);
    } else {
      onChange(null);
    }
  };

  const handleApplyPreset = (presetItems: SizeAssortmentItem[]) => {
    setIsEnabled(true);
    setItems(presetItems);
    onChange(presetItems);
  };

  const handleItemChange = (index: number, field: 'size' | 'ratio', val: string | number) => {
    const updated = [...items];
    if (field === 'size') {
      updated[index].size = String(val);
    } else {
      updated[index].ratio = Math.max(1, Number(val) || 1);
    }
    setItems(updated);
    onChange(updated);
  };

  const handleAddItem = () => {
    const nextSize = items.length > 0 ? String(Number(items[items.length - 1].size) + 1 || '') : '36';
    const updated = [...items, { size: nextSize, ratio: 1 }];
    setItems(updated);
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    if (updated.length === 0) {
      setIsEnabled(false);
      onChange(null);
    } else {
      onChange(updated);
    }
  };

  const totalPairs = isEnabled ? items.reduce((sum, it) => sum + (Number(it.ratio) || 0), 0) : 0;

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1.5px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        marginTop: '1.5rem',
      }}
    >
      {/* Header & Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', margin: 0 }}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
            📦 Répartition des pointures par carton (Assortiment)
          </span>
        </label>

        {isEnabled && (
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: 'var(--primary)',
              background: 'var(--primary-light)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            Total : {totalPairs} paires / carton
          </span>
        )}
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.75rem 0' }}>
        Configurez la répartition exacte des pointures pour la vente en gros par carton.
      </p>

      {isEnabled && (
        <div style={{ marginTop: '0.5rem' }}>
          {/* Presets Shortcuts */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              ⚡ Raccourcis de distribution standard (Presets) :
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset.items)}
                  className="btn btn-outline hover-lift"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                  }}
                >
                  {preset.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleToggle(false)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#ef4444',
                  background: 'transparent',
                  border: '1px solid #fca5a5',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                ✕ Désactiver
              </button>
            </div>
          </div>

          {/* Size & Ratio Rows Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '0.65rem',
              marginBottom: '1rem',
            }}
          >
            {items.map((it, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem',
                  position: 'relative',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '2px 4px',
                  }}
                  title="Supprimer cette pointure"
                >
                  ✕
                </button>

                <div style={{ marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
                    Pointure
                  </label>
                  <input
                    type="text"
                    value={it.size}
                    onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.25rem 0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
                    Nombre de paires
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={it.ratio}
                    onChange={(e) => handleItemChange(idx, 'ratio', parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '0.25rem 0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Size Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="btn btn-outline"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
              add
            </span>
            <span>Ajouter une pointure / option</span>
          </button>
        </div>
      )}
    </div>
  );
}
