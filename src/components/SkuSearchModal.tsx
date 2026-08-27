'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';

interface SearchProduct {
  id: string;
  reference: string;
  details?: string | null;
  family: {
    id: string;
    name: string;
    arabicName?: string | null;
    slug: string;
  };
  images: {
    thumbnailUrl: string;
    mediumUrl: string;
  }[];
}

interface SkuSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  dict: any;
}

export default function SkuSearchModal({
  isOpen,
  onClose,
  lang,
  dict,
}: SkuSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isArabic = lang === 'ar';
  const searchDict = dict?.search || {};

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || []);
          try {
            track('sku_search_performed', { query: query.trim(), count: data.products?.length || 0, lang });
          } catch {}
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, lang]);

  const handleSelectProduct = (reference: string) => {
    onClose();
    router.push(`/${lang}/product/${encodeURIComponent(reference)}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelectProduct(results[0].reference);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(1rem, 5vh, 4rem) 1rem',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Search Header Form */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-color)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '1.5rem',
              color: 'var(--primary)',
              marginRight: isArabic ? 0 : '0.75rem',
              marginLeft: isArabic ? '0.75rem' : 0,
            }}
          >
            search
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isArabic
                ? 'ابحث برقم المرجع SKU (مثال: A2210, Jm598...)'
                : 'Rechercher par référence SKU (ex: A2210, Jm598...)'
            }
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              outline: 'none',
              fontFamily: 'inherit',
              padding: '0.25rem 0',
            }}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'rgba(100, 116, 139, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginRight: isArabic ? 0 : '0.5rem',
                marginLeft: isArabic ? '0.5rem' : 0,
              }}
            >
              ✕
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.3rem 0.65rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Esc
          </button>
        </form>

        {/* Search Results Area */}
        <div
          style={{
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', animation: 'spin 1s infinite linear' }}>
                sync
              </span>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                {isArabic ? 'جاري البحث...' : 'Recherche en cours...'}
              </p>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.5rem',
                  padding: '0 0.5rem',
                }}
              >
                {results.length} {isArabic ? 'موديلات مطابقة' : 'modèles trouvés'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {results.map((product) => {
                  const familyName =
                    isArabic && product.family.arabicName
                      ? product.family.arabicName
                      : product.family.name;
                  const thumb =
                    product.images?.[0]?.thumbnailUrl || product.images?.[0]?.mediumUrl;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product.reference)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-color)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Thumbnail */}
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.reference}
                          style={{
                            width: '52px',
                            height: '52px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            flexShrink: 0,
                            backgroundColor: '#f1f5f9',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            flexShrink: 0,
                          }}
                        >
                          👟
                        </div>
                      )}

                      {/* Product Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {product.reference}
                          </span>
                          <span
                            style={{
                              background: 'var(--primary-light)',
                              color: 'var(--primary-hover)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {familyName}
                          </span>
                        </div>

                        {product.details && (
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              marginTop: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {product.details}
                          </div>
                        )}
                      </div>

                      {/* Arrow Icon */}
                      <span
                        className="material-symbols-outlined"
                        style={{
                          color: 'var(--primary)',
                          fontSize: '1.25rem',
                          transform: isArabic ? 'rotate(180deg)' : 'none',
                        }}
                      >
                        arrow_forward
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : hasSearched ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.4 }}>
                search_off
              </span>
              <h3 style={{ margin: '0.75rem 0 0.25rem 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                {isArabic ? 'لا توجد نتائج مطابقة' : 'Aucun produit trouvé'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                {isArabic
                  ? `لم نتمكن من العثور على أي حذاء بالمرجع "${query}". جرب جزءاً من الرقم.`
                  : `Aucun modèle ne correspond à la référence "${query}".`}
              </p>
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--primary)', opacity: 0.8 }}>
                manage_search
              </span>
              <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>
                {isArabic ? 'ابحث برقم الموديل أو المرجع' : 'Recherche Rapide par Référence'}
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isArabic
                  ? 'اكتب رقم المرجع (SKU) للانتقال المباشر إلى الحذاء ومواصفاته.'
                  : 'Tapez une référence pour accéder instantanément au modèle et passer commande.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
