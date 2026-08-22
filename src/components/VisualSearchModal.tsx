'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import SmartImage from './SmartImage';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dict: any;
  lang?: string;
}

export default function VisualSearchModal({
  isOpen,
  onClose,
  dict,
  lang = 'fr',
}: VisualSearchModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [detectedAttributes, setDetectedAttributes] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Support pasting image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) handleProcessFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WEBP).');
      return;
    }

    setErrorMessage(null);
    setResults(null);
    setDetectedAttributes(null);
    setIsAnalyzing(true);

    // Create preview
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setImagePreview(base64Data);

      try {
        const res = await fetch('/api/search/visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
            lang,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Visual search failed');
        }

        const data = await res.json();
        setResults(data.matches || []);
        setDetectedAttributes(data.detectedAttributes || null);
        try {
          track('visual_search_performed', {
            matchCount: data.matches?.length || 0,
            category: data.detectedAttributes?.category || 'unknown'
          });
        } catch {
          // ignore
        }
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'Error analyzing photo. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.onerror = () => {
      setIsAnalyzing(false);
      setErrorMessage('Failed to read image file.');
    };
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setResults(null);
    setDetectedAttributes(null);
    setErrorMessage(null);
    setIsAnalyzing(false);
  };

  const vs = dict?.visualSearch || {};

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card fade-in-up"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              📷
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>
                {vs.modalTitle || 'Visual Search with Gemini AI ✨'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                {vs.modalSubtitle || 'Upload a photo to find matching shoes in our collections.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          {/* Upload Dropzone View */}
          {!imagePreview ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-color)'}`,
                background: isDragging ? 'var(--primary-light)' : 'var(--bg-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '3.5rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessFile(e.target.files[0]);
                  }
                }}
              />
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                📸
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  {vs.dropzoneText || 'Drag & drop a photo here or click to browse'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Supports JPEG, PNG, WEBP, and Camera capture
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Photo Overview & Scanner Banner */}
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'center',
                  background: 'var(--bg-color)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '2rem',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    background: '#fff',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Query"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {isAnalyzing && <div className="laser-scanner" />}
                </div>

                <div style={{ flex: 1, minWidth: '220px' }}>
                  {isAnalyzing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>
                        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>✨</span>
                        <span>{vs.analyzing || 'Analyzing shoe details with Gemini AI...'}</span>
                      </div>
                      <div className="skeleton-bg" style={{ height: '16px', width: '70%', borderRadius: '4px' }} />
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {results && results.length > 0
                            ? `${results.length} ${vs.matchedItems || 'Matched Models'}`
                            : (vs.noMatches || 'No matches found')}
                        </span>
                      </div>
                      {detectedAttributes && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {detectedAttributes.category && (
                            <span className="badge" style={{ fontSize: '0.75rem' }}>
                              🏷️ {detectedAttributes.category}
                            </span>
                          )}
                          {detectedAttributes.color && (
                            <span className="badge" style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569' }}>
                              🎨 {detectedAttributes.color}
                            </span>
                          )}
                          {detectedAttributes.soleType && (
                            <span className="badge" style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569' }}>
                              👟 {detectedAttributes.soleType}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  className="btn btn-outline"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--surface)',
                  }}
                >
                  🔄 {vs.tryAnother || 'Try Another Photo'}
                </button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div
                  style={{
                    padding: '1rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    color: '#b91c1c',
                    fontSize: '0.9rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Loading Skeletons */}
              {isAnalyzing && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={`vs-skel-${i}`}
                      className="glass-card"
                      style={{ overflow: 'hidden', height: '260px', display: 'flex', flexDirection: 'column' }}
                    >
                      <div className="skeleton-bg" style={{ height: '160px' }} />
                      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div className="skeleton-bg" style={{ height: '18px', width: '100px', borderRadius: '4px' }} />
                        <div className="skeleton-bg" style={{ height: '14px', width: '60px', borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Matched Products Grid */}
              {!isAnalyzing && results && (
                <div>
                  {results.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <p>{vs.noMatches || 'No similar shoes found in the active catalog.'}</p>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '1.25rem',
                      }}
                    >
                      {results.map((match: any) => {
                        const product = match.product;
                        const image = product.image;

                        return (
                          <Link
                            key={product.id}
                            href={`/${lang}/product/${encodeURIComponent(product.reference)}`}
                            onClick={onClose}
                            className="glass-card hover-lift"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              overflow: 'hidden',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-color)',
                              position: 'relative',
                            }}
                          >
                            {/* Similarity Badge */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                zIndex: 10,
                                background: 'rgba(79, 70, 229, 0.9)',
                                color: 'white',
                                padding: '0.2rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backdropFilter: 'blur(4px)',
                                boxShadow: 'var(--shadow-sm)',
                              }}
                            >
                              {match.similarityScore ? `${match.similarityScore}% Match` : match.matchHighlight}
                            </div>

                            {/* Image Thumbnail */}
                            <div style={{ height: '180px', background: 'var(--bg-color)', position: 'relative' }}>
                              {image ? (
                                <SmartImage
                                  src={image.mediumUrl || image.thumbnailUrl}
                                  alt={product.reference}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  wrapperStyle={{ width: '100%', height: '100%' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  No Image
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div style={{ padding: '1rem', background: 'var(--surface)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>
                                  {product.reference}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                  {product.family?.name || ''}
                                </div>
                                {match.matchReason && (
                                  <div
                                    style={{
                                      fontSize: '0.78rem',
                                      color: 'var(--primary)',
                                      lineHeight: 1.3,
                                      background: 'var(--primary-light)',
                                      padding: '0.35rem 0.6rem',
                                      borderRadius: 'var(--radius-sm)',
                                      marginBottom: '0.5rem',
                                    }}
                                  >
                                    💡 {match.matchReason}
                                  </div>
                                )}
                              </div>

                              <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                                <span>{vs.viewProduct || 'View Product'}</span>
                                <span>→</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
