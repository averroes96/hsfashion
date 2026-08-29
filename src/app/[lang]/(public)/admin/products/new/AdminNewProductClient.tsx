'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import AdminAssortmentConfig, { SizeAssortmentItem } from '@/components/AdminAssortmentConfig';

export default function AdminNewProductClient({ dict }: { dict: any }) {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const isArabic = lang === 'ar';
  
  const [families, setFamilies] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [familyId, setFamilyId] = useState('');
  const [catalogIds, setCatalogIds] = useState<string[]>([]);
  const [reference, setReference] = useState('');
  const [details, setDetails] = useState('');
  const [description, setDescription] = useState('');
  const [sizeAssortment, setSizeAssortment] = useState<SizeAssortmentItem[] | null>(null);
  const [badge, setBadge] = useState<string | null>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchFamilies();
    fetchCatalogs();
  }, []);

  const fetchFamilies = async () => {
    const res = await fetch('/api/admin/families');
    const data = await res.json();
    setFamilies(data);
    if (data.length > 0) {
      const otherFamily = data.find((f: any) => f.name.toLowerCase() === 'other');
      setFamilyId(otherFamily ? otherFamily.id : data[0].id);
    }
  };

  const fetchCatalogs = async () => {
    const res = await fetch('/api/admin/catalogs');
    const data = await res.json();
    setCatalogs(data);
  };

  const handleFilesAdded = (newFiles: File[]) => {
    const combined = [...files, ...newFiles];
    if (combined.length > 5) {
      alert(dict.admin?.maxImagesError || 'Vous pouvez importer un maximum de 5 images par produit.');
      setFiles(combined.slice(0, 5));
    } else {
      setFiles(combined);
    }
    setAiStatus(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesAdded(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const imageFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        handleFilesAdded(imageFiles);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAiAutoFill = async () => {
    if (files.length === 0) {
      alert(dict.admin?.ai?.selectImageFirst || 'Veuillez d\'abord sélectionner au moins une image.');
      return;
    }

    setIsAiAnalyzing(true);
    setAiStatus(null);

    try {
      const primaryFile = files[0];
      const base64Data = await fileToBase64(primaryFile);

      const res = await fetch('/api/admin/ai/auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: primaryFile.type || 'image/jpeg',
          families,
          lang
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || 'AI Auto-fill failed');
      }

      const aiData = await res.json();

      if (aiData.familyId && (families as any[]).some((f: any) => f.id === aiData.familyId)) {
        setFamilyId(aiData.familyId);
      }
      if (aiData.details) {
        setDetails(aiData.details);
      }
      if (aiData.description) {
        setDescription(aiData.description);
      }
      if (aiData.detectedSku && !reference) {
        setReference(aiData.detectedSku);
      }

      setAiStatus(dict.admin?.ai?.aiSuccess || 'Catégorie détectée et informations générées avec succès !');
    } catch (err: any) {
      console.error(err);
      alert(dict.admin?.ai?.aiError || (err.message || 'Erreur lors de l\'auto-remplissage IA.'));
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const toggleCatalog = (id: string) => {
    setCatalogIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Veuillez ajouter au moins une image.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const uploadedImages = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Échec du téléchargement de l\'image');
        const data = await res.json();
        uploadedImages.push(data);
      }

      const productRes = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          details: details || null,
          description: description || null,
          familyId,
          catalogIds,
          sizeAssortment,
          badge: badge || null,
          images: uploadedImages
        })
      });

      if (!productRes.ok) {
        const errData = await productRes.json().catch(() => ({}));
        throw new Error(errData?.error || 'Échec de la création du produit');
      }
      
      alert('Produit créé avec succès !');
      router.push(`/${lang}/admin/products`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erreur lors de la création du produit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Mode Switch Tabs */}
      <div className="admin-mode-tabs" style={{ marginBottom: '1.5rem' }}>
        <button type="button" className="admin-mode-tab active">
          <span>📄</span>
          <span>{dict?.admin?.singleMode || 'Ajout Unique'}</span>
        </button>
        <Link href={`/${lang}/admin/products/bulk`} className="admin-mode-tab">
          <span>🚀</span>
          <span>{dict?.admin?.bulkMode || 'Ajout par Lot (Multiple)'}</span>
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            {dict.admin.addNewProduct || 'Ajouter un Nouveau Produit'}
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Remplissez les détails du modèle pour l'ajouter au catalogue de vente en gros.
          </p>
        </div>

        {files.length > 0 && (
          <button
            type="button"
            onClick={handleAiAutoFill}
            disabled={isAiAnalyzing || isSubmitting}
            className="btn hover-lift"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 700,
              padding: '0.6rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem', animation: isAiAnalyzing ? 'spin 1s linear infinite' : 'none' }}>
              {isAiAnalyzing ? 'progress_activity' : 'auto_awesome'}
            </span>
            <span>{isAiAnalyzing ? (dict.admin?.ai?.analyzing || 'Analyse IA...') : (dict.admin?.ai?.autoFillBtn || 'Auto-Remplir par IA ✨')}</span>
          </button>
        )}
      </div>

      {/* AI Success Feedback Banner */}
      {aiStatus && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1.15rem',
            background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary)',
            fontWeight: 600,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>check_circle</span>
          <span>{aiStatus}</span>
        </div>
      )}

      {/* Main Card Form */}
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

          {/* 1. Image Upload Dropzone */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>photo_library</span>
                <span>{dict.admin.images || 'Photos du produit'} *</span>
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {files.length} / 5 photos (1ère = photo principale)
              </span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-color)'}`,
                background: isDragging ? 'var(--primary-light)' : '#f8fafc',
                borderRadius: 'var(--radius-md)',
                padding: files.length > 0 ? '1rem' : '2.25rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {files.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(79, 70, 229, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>add_photo_alternate</span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block' }}>
                      Cliquez pour parcourir ou glissez-déposez vos photos ici
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Formats acceptés : JPG, PNG, WEBP (Jusqu'à 5 photos)
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '0.85rem',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    {files.map((file, i) => (
                      <div
                        key={i}
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
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${i}`}
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

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(i);
                          }}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(15, 23, 42, 0.75)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                          }}
                          title="Supprimer la photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {files.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: '2px dashed var(--border-color)',
                          background: 'white',
                          borderRadius: 'var(--radius-sm)',
                          aspectRatio: '1/1',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>add</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Ajouter</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Catalogs Assignment (Modern Pills) */}
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
              {catalogs.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dict.admin.noCatalogs || 'Aucun catalogue actif.'}</span>}
            </div>
          </div>

          {/* 3. Category & Reference Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Category */}
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
                  <option key={f.id} value={f.id}>
                    {lang === 'ar' && f.arabicName ? f.arabicName : f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference SKU */}
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '0.45rem' }}>
                🔖 {dict.admin.reference || 'Référence (SKU)'} *
              </label>
              <input
                className="form-control"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Ex: HS-2026, ART-882"
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

          {/* 4. Short Details */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '0.45rem' }}>
              ✨ {dict.admin.details || 'Détails techniques / Caractéristiques (Court)'}
            </label>
            <input
              className="form-control"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Ex: Cuir suédé, semelle crantée, boucle dorée"
              style={{
                padding: '0.65rem 0.9rem',
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-color)',
                background: 'white',
              }}
            />
          </div>

          {/* 5. Long Description */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '0.45rem' }}>
              📝 {dict.admin.descriptionLong || 'Description commerciale'}
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description détaillée du modèle pour les revendeurs et boutiques..."
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

          {/* 6. Commercial Badge Selector */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
              🏷️ {dict?.badges?.title || 'Badge Commercial / Mise en avant'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                { id: null, label: dict?.badges?.none || 'Aucun', icon: '🚫' },
                { id: 'NEW', label: dict?.badges?.new || 'Nouveau', icon: '✨', bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', color: '#047857' },
                { id: 'BEST_SELLER', label: dict?.badges?.bestSeller || 'Best-Seller', icon: '🔥', bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', color: '#b45309' },
                { id: 'LIMITED_STOCK', label: dict?.badges?.limitedStock || 'Stock Limité', icon: '⚡', bg: 'rgba(225, 29, 72, 0.12)', border: '#e11d48', color: '#be123c' },
                { id: 'PROMO', label: dict?.badges?.promo || 'Offre Spéciale', icon: '🏷️', bg: 'rgba(79, 70, 229, 0.12)', border: '#4f46e5', color: '#4338ca' },
              ].map((b) => {
                const isSelected = badge === b.id;
                return (
                  <button
                    key={b.id || 'none'}
                    type="button"
                    onClick={() => setBadge(b.id)}
                    style={{
                      padding: '0.5rem 0.95rem',
                      borderRadius: 'var(--radius-full)',
                      border: isSelected ? `2px solid ${b.border || 'var(--primary)'}` : '1px solid var(--border-color)',
                      background: isSelected ? (b.bg || 'var(--primary-light)') : 'white',
                      color: isSelected ? (b.color || 'var(--primary)') : 'var(--text-main)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{b.icon}</span>
                    <span>{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Assortment / Packaging Configuration Section */}
          <AdminAssortmentConfig
            value={sizeAssortment}
            onChange={setSizeAssortment}
            dict={dict}
            lang={lang}
          />

          {/* 7. Action Buttons */}
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
              disabled={isSubmitting || isAiAnalyzing}
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
                  <span>{dict.admin.uploading || 'Enregistrement...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>{dict.admin.saveProduct || 'Enregistrer le Produit'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
