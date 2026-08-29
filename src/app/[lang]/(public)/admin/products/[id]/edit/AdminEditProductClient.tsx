'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import AdminAssortmentConfig, { SizeAssortmentItem } from '@/components/AdminAssortmentConfig';

export default function AdminEditProductClient({ dict, productId }: { dict: any, productId: string }) {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  
  const [families, setFamilies] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [familyId, setFamilyId] = useState('');
  const [catalogIds, setCatalogIds] = useState<string[]>([]);
  const [reference, setReference] = useState('');
  const [details, setDetails] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sizeAssortment, setSizeAssortment] = useState<SizeAssortmentItem[] | null>(null);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    setIsLoading(true);
    const [famRes, catRes, prodRes] = await Promise.all([
      fetch('/api/admin/families'),
      fetch('/api/admin/catalogs'),
      fetch(`/api/admin/products/${productId}`)
    ]);
    
    const [famData, catData, prodData] = await Promise.all([
      famRes.json(),
      catRes.json(),
      prodRes.json()
    ]);

    setFamilies(famData);
    setCatalogs(catData);
    
    if (prodData && !prodData.error) {
      setReference(prodData.reference);
      setDetails(prodData.details || '');
      setDescription(prodData.description || '');
      setFamilyId(prodData.familyId);
      setIsActive(prodData.isActive);
      setSizeAssortment(prodData.sizeAssortment || null);
      setCatalogIds(prodData.catalogs.map((c: any) => c.id));
      setExistingImages(prodData.images || []);
    }
    setIsLoading(false);
  };

  const toggleCatalog = (id: string) => {
    setCatalogIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const productRes = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          details: details || null,
          description: description || null,
          familyId,
          catalogIds,
          sizeAssortment,
          isActive
        })
      });

      if (!productRes.ok) {
        const errData = await productRes.json().catch(() => ({}));
        throw new Error(errData?.error || 'Échec de la mise à jour du produit');
      }
      
      alert('Produit mis à jour avec succès !');
      router.push(`/${lang}/admin/products`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erreur lors de la mise à jour du produit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', gap: '0.5rem', color: 'var(--text-muted)' }}>
        <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
        <span>Chargement du produit...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            {dict.admin.editProduct || 'Modifier le Produit'}
          </h1>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            SKU : <strong style={{ color: 'var(--primary)' }}>{reference}</strong>
          </span>
        </div>

        <Link href={`/${lang}/admin/products`} className="btn btn-outline" style={{ borderRadius: 'var(--radius-md)' }}>
          ← Retour aux Produits
        </Link>
      </div>

      {/* Main Card */}
      <div
        className="admin-card glass-card"
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          background: 'var(--surface)',
          border: '1px solid var(--border-color)',
        }}
      >
        <form onSubmit={handleSubmit}>
          
          {/* Status Toggle */}
          <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 800, color: isActive ? '#15803d' : 'var(--text-muted)' }}>
                {isActive ? '✅ Produit Actif (Visible)' : '⏸️ Produit Inactif (Masqué)'}
              </span>
            </label>
          </div>

          {/* Current Images Gallery */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>photo_library</span>
              <span>Images actuelles</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.85rem' }}>
              {existingImages.map((img, i) => (
                <div
                  key={img.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '1/1',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: i === 0 ? '2.5px solid var(--primary)' : '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <img
                    src={img.mediumUrl || img.thumbnailUrl}
                    alt={`Current ${i}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {i === 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        right: '4px',
                        background: 'var(--primary)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '4px',
                        textAlign: 'center',
                      }}
                    >
                      Principale
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Catalogs Pills */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>auto_stories</span>
              <span>{dict.admin.catalogs || 'Catalogues associés'}</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {catalogs.map((c: any) => {
                const isSelected = catalogIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCatalog(c.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.9rem',
                      borderRadius: 'var(--radius-full)',
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: isSelected ? 'var(--primary)' : '#f8fafc',
                      color: isSelected ? 'white' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category & Reference Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '0.45rem' }}>
                🏷️ {dict.admin.familyCategory || 'Catégorie / Famille'} *
              </label>
              <select
                className="form-control"
                value={familyId}
                onChange={e => setFamilyId(e.target.value)}
                required
                style={{
                  padding: '0.65rem 0.9rem',
                  fontSize: '0.92rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-color)',
                  background: 'white',
                  fontWeight: 600,
                }}
              >
                {families.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '0.45rem' }}>
                🔖 {dict.admin.reference || 'Référence (SKU)'} *
              </label>
              <input
                className="form-control"
                value={reference}
                onChange={e => setReference(e.target.value)}
                required
                style={{
                  padding: '0.65rem 0.9rem',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-color)',
                  background: 'white',
                }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '0.45rem' }}>
              ✨ {dict.admin.details || 'Détails techniques (Court)'}
            </label>
            <input
              className="form-control"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Ex: Cuir suédé, semelle crantée"
              style={{
                padding: '0.65rem 0.9rem',
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-color)',
                background: 'white',
              }}
            />
          </div>

          {/* Long Description */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '0.45rem' }}>
              📝 {dict.admin.descriptionLong || 'Description commerciale'}
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                padding: '0.75rem 0.9rem',
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-color)',
                background: 'white',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Assortment / Packaging Configuration Section */}
          <AdminAssortmentConfig
            value={sizeAssortment}
            onChange={setSizeAssortment}
            dict={dict}
            lang={lang}
            productContext={{
              hasImage: existingImages.length > 0,
              imageUrl: existingImages[0]?.mediumUrl || existingImages[0]?.thumbnailUrl || null,
              categoryName: (families as any[]).find((f: any) => f.id === familyId)?.name || '',
              reference,
              details,
              description,
            }}
          />

          {/* Actions Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <Link
              href={`/${lang}/admin/products`}
              className="btn btn-outline"
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
              }}
            >
              ← Annuler
            </Link>

            <button
              type="submit"
              className="btn hover-lift"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: 800,
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary)',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
                  <span>{dict.admin.uploading || 'Mise à jour...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>{dict.admin.update || 'Mettre à jour le Produit'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
