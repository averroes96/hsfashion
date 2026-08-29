'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { SizeAssortmentItem } from '@/components/AdminAssortmentConfig';

export const BULK_ASSORTMENT_PRESETS: { id: string; label: string; shortLabel: string; items: SizeAssortmentItem[] | null }[] = [
  { id: 'none', label: 'Aucun (Non configuré)', shortLabel: 'Sans', items: null },
  {
    id: '12',
    label: '👠 12 paires (2x 36-41)',
    shortLabel: '12 paires',
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
    id: '15',
    label: '👡 15 paires (3x 36-40)',
    shortLabel: '15 paires',
    items: [
      { size: '36', ratio: 3 },
      { size: '37', ratio: 3 },
      { size: '38', ratio: 3 },
      { size: '39', ratio: 3 },
      { size: '40', ratio: 3 },
    ],
  },
  {
    id: '18',
    label: '👢 18 paires (3x 36-41)',
    shortLabel: '18 paires',
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
    id: '24',
    label: '📦 24 paires (4x 36-41)',
    shortLabel: '24 paires',
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

interface StagedProduct {
  id: string;
  file: File;
  previewUrl: string;
  reference: string;
  familyId: string;
  catalogIds: string[];
  sizeAssortment: SizeAssortmentItem[] | null;
  details: string;
  description: string;
  status: 'ready' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export default function AdminBulkUploadClient({ dict }: { dict: any }) {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const [families, setFamilies] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  
  // Global Presets
  const [globalFamilyId, setGlobalFamilyId] = useState('');
  const [globalCatalogIds, setGlobalCatalogIds] = useState<string[]>([]);
  const [globalAssortmentId, setGlobalAssortmentId] = useState<string>('none');
  
  // Staging Queue
  const [queue, setQueue] = useState<StagedProduct[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBatchAiRunning, setIsBatchAiRunning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [famRes, catRes] = await Promise.all([
        fetch('/api/admin/families'),
        fetch('/api/admin/catalogs'),
      ]);
      if (famRes.ok) {
        const famData = await famRes.json();
        setFamilies(famData);
        if (famData.length > 0) {
          const other = famData.find((f: any) => f.name.toLowerCase() === 'other');
          setGlobalFamilyId(other ? other.id : famData[0].id);
        }
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCatalogs(catData);
      }
    } catch (err) {
      console.error('Failed to load initial families/catalogs:', err);
    }
  };

  const getGlobalAssortmentItems = () => {
    return BULK_ASSORTMENT_PRESETS.find((p) => p.id === globalAssortmentId)?.items || null;
  };

  const handleAddFiles = (selectedFiles: File[]) => {
    const defaultAssortment = getGlobalAssortmentItems();
    const newItems: StagedProduct[] = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      file,
      previewUrl: URL.createObjectURL(file),
      reference: '',
      familyId: globalFamilyId,
      catalogIds: [...globalCatalogIds],
      sizeAssortment: defaultAssortment ? JSON.parse(JSON.stringify(defaultAssortment)) : null,
      details: '',
      description: '',
      status: 'ready',
    }));

    setQueue((prev) => [...prev, ...newItems]);
  };

  // Drag and Drop
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
      const filesArray = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (filesArray.length > 0) {
        handleAddFiles(filesArray);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (filesArray.length > 0) {
        handleAddFiles(filesArray);
      }
      e.target.value = '';
    }
  };

  // Global Presets Controls
  const toggleGlobalCatalog = (id: string) => {
    setGlobalCatalogIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const applyGlobalPresetsToAll = () => {
    const defaultAssortment = getGlobalAssortmentItems();
    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        familyId: globalFamilyId,
        catalogIds: [...globalCatalogIds],
        sizeAssortment: defaultAssortment ? JSON.parse(JSON.stringify(defaultAssortment)) : null,
      }))
    );
  };

  // Per-Item Queue Controls
  const updateQueueItem = (id: string, updates: Partial<StagedProduct>) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        // If item was in error state and user is editing it, revert to ready
        if (item.status === 'error' && !updates.status) {
          updated.status = 'ready';
          updated.errorMessage = undefined;
        }
        return updated;
      })
    );
  };

  const toggleItemCatalog = (itemId: string, catalogId: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.catalogIds.includes(catalogId);
        const newCatalogs = exists
          ? item.catalogIds.filter((c) => c !== catalogId)
          : [...item.catalogIds, catalogId];
        return {
          ...item,
          catalogIds: newCatalogs,
          status: item.status === 'error' ? 'ready' : item.status,
          errorMessage: item.status === 'error' ? undefined : item.errorMessage,
        };
      })
    );
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearQueue = () => {
    if (confirm('Voulez-vous vraiment vider la file d\'attente ?')) {
      setQueue([]);
    }
  };

  // Batch AI Classification Helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleBatchAiDetect = async () => {
    const readyItems = queue.filter((item) => item.status === 'ready');
    if (readyItems.length === 0) return;

    setIsBatchAiRunning(true);
    for (const item of readyItems) {
      try {
        const base64Data = await fileToBase64(item.file);
        const res = await fetch('/api/admin/ai/auto-fill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: item.file.type || 'image/jpeg',
            families,
            lang,
          }),
        });

        if (res.ok) {
          const aiData = await res.json();
          updateQueueItem(item.id, {
            familyId: aiData.familyId || item.familyId,
            details: aiData.details || item.details,
            description: aiData.description || item.description,
            reference: aiData.detectedSku || item.reference,
          });
        }
      } catch (err) {
        console.warn('AI detect failed for item:', item.reference, err);
      }
    }
    setIsBatchAiRunning(false);
  };

  // Start Bulk Upload Engine
  const handleStartBulkUpload = async () => {
    const itemsToUpload = queue.filter((item) => item.status !== 'success');
    if (itemsToUpload.length === 0) return;

    // Check if any product is missing SKU reference
    const missingSkus = itemsToUpload.filter((item) => !item.reference.trim());
    if (missingSkus.length > 0) {
      alert(
        lang === 'ar'
          ? 'يرجى إدخال المرجع (SKU) لجميع المنتجات في القائمة قبل بدء الاستيراد.'
          : 'Veuillez saisir une référence (SKU) pour chaque produit avant de lancer l\'importation.'
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: itemsToUpload.length });

    let completedCount = 0;

    for (const item of itemsToUpload) {
      updateQueueItem(item.id, { status: 'uploading', errorMessage: undefined });

      try {
        // Step 1: Upload Image
        const formData = new FormData();
        formData.append('file', item.file);

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Image upload failed');
        }

        const uploadedImage = await uploadRes.json();

        // Step 2: Create Product in DB
        const productRes = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: item.reference,
            details: item.details || null,
            description: item.description || null,
            familyId: item.familyId,
            catalogIds: item.catalogIds,
            sizeAssortment: item.sizeAssortment || null,
            images: [uploadedImage],
          }),
        });

        if (!productRes.ok) {
          const errBody = await productRes.json();
          throw new Error(errBody?.error || 'Failed to create product');
        }

        updateQueueItem(item.id, { status: 'success' });
      } catch (err: any) {
        console.error('Error uploading product:', item.reference, err);
        updateQueueItem(item.id, {
          status: 'error',
          errorMessage: err?.message || 'Upload failed',
        });
      } finally {
        completedCount++;
        setUploadProgress({ current: completedCount, total: itemsToUpload.length });
      }
    }

    setIsUploading(false);
  };

  const pendingCount = queue.filter((i) => i.status !== 'success').length;
  const readyCount = queue.filter((i) => i.status === 'ready').length;
  const successCount = queue.filter((i) => i.status === 'success').length;
  const errorCount = queue.filter((i) => i.status === 'error').length;
  const percentComplete =
    uploadProgress.total > 0
      ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
      : 0;

  return (
    <div>
      {/* Mode Switch Tabs */}
      <div className="admin-mode-tabs">
        <Link href={`/${lang}/admin/products/new`} className="admin-mode-tab">
          <span>📄</span>
          <span>{dict?.admin?.singleMode || 'Ajout Unique'}</span>
        </Link>
        <button type="button" className="admin-mode-tab active">
          <span>🚀</span>
          <span>{dict?.admin?.bulkMode || 'Ajout par Lot (Multiple)'}</span>
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>{dict?.admin?.bulkTitle || 'Import Multiple de Produits'}</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0 0', fontSize: '0.95rem' }}>
          {dict?.admin?.bulkSubtitle ||
            'Importez facilement des dizaines de modèles de chaussures à partir de leurs photos.'}
        </p>
      </div>

      {/* 1. Global Presets Card */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>
            ⚙️ {dict?.admin?.globalConfig || 'Configuration Globale'}
          </h3>
          {queue.length > 0 && (
            <button
              type="button"
              onClick={applyGlobalPresetsToAll}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
              title="Apply selected category and catalogs to all queued items"
            >
              🔄 {dict?.admin?.applyToAll || 'Appliquer à toute la file'}
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Default Category */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>{dict?.admin?.defaultFamily || 'Catégorie par défaut'}</label>
            <select
              value={globalFamilyId}
              onChange={(e) => setGlobalFamilyId(e.target.value)}
              className="form-control"
            >
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {lang === 'ar' && f.arabicName ? f.arabicName : f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Default Catalogs Checkbox Chips */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>{dict?.admin?.defaultCatalogs || 'Catalogues par défaut'}</label>
            <div className="catalog-chip-grid">
              {catalogs.map((c) => {
                const isSelected = globalCatalogIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleGlobalCatalog(c.id)}
                    className={`catalog-chip ${isSelected ? 'selected' : ''}`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Carton Assortment */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>📦 Assortiment par carton par défaut</label>
            <div className="catalog-chip-grid">
              {BULK_ASSORTMENT_PRESETS.map((preset) => {
                const isSelected = globalAssortmentId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setGlobalAssortmentId(preset.id)}
                    className={`catalog-chip ${isSelected ? 'selected' : ''}`}
                    style={{
                      borderColor: isSelected ? 'var(--primary)' : undefined,
                    }}
                  >
                    <span>{isSelected ? '✓' : ''}</span>
                    <span>{preset.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Drag & Drop Zone */}
      <div
        className={`bulk-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <div className="bulk-dropzone-icon">📸</div>
        <div>
          <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>
            {dict?.admin?.dropzoneBulk ||
              'Glissez-déposez vos photos de chaussures ici (ou cliquez pour parcourir)'}
          </strong>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {dict?.admin?.dropzoneBulkSub ||
              'Chaque photo générera automatiquement un modèle dans la file d\'attente (jusqu\'à 50 modèles).'}
          </p>
        </div>
      </div>

      {/* 3. Staging Queue List */}
      {queue.length > 0 && (
        <div className="admin-card" style={{ marginTop: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                📋 {dict?.admin?.queueTitle || 'File d\'attente des produits'} ({queue.length})
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {readyCount} prêts, {successCount} importés, {errorCount} erreurs
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleBatchAiDetect}
                disabled={isBatchAiRunning || isUploading || readyCount === 0}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem',
                  borderRadius: 'var(--radius-full)',
                  opacity: isBatchAiRunning || isUploading || readyCount === 0 ? 0.6 : 1,
                }}
              >
                {isBatchAiRunning
                  ? dict?.admin?.batchAiAnalyzing || 'Analyse par l\'IA...'
                  : dict?.admin?.batchAiDetect || 'Auto-Détection par l\'IA ✨'}
              </button>

              <button
                type="button"
                onClick={clearQueue}
                disabled={isUploading}
                className="btn-danger-outline"
              >
                🗑️ {dict?.admin?.clearQueue || 'Vider la file'}
              </button>
            </div>
          </div>

          {/* Progress Bar while Uploading */}
          {isUploading && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>
                  {dict?.admin?.uploadingProgress || 'Importation en cours...'} ({uploadProgress.current}/{uploadProgress.total})
                </span>
                <span>{percentComplete}%</span>
              </div>
              <div className="bulk-progress-bar">
                <div className="bulk-progress-fill" style={{ width: `${percentComplete}%` }} />
              </div>
            </div>
          )}

          {/* Staged Cards List */}
          <div>
            {queue.map((item, index) => (
              <div key={item.id} className="bulk-card">
                {/* Thumbnail */}
                <img
                  src={item.previewUrl}
                  alt={item.reference}
                  className="bulk-card-thumb"
                />

                {/* Form Fields */}
                <div className="bulk-card-fields">
                  {/* SKU Reference */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      {dict?.admin?.reference || 'Référence (SKU)'} *
                    </label>
                    <input
                      type="text"
                      value={item.reference}
                      placeholder={lang === 'ar' ? 'أدخل المرجع (مثال: HS-1000)' : 'Ex: HS-1000, 3355-102'}
                      disabled={item.status === 'success' || isUploading}
                      onChange={(e) => updateQueueItem(item.id, { reference: e.target.value })}
                      className="form-control"
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.875rem',
                        borderColor: !item.reference.trim() ? '#f59e0b' : undefined,
                      }}
                      required
                    />
                  </div>

                  {/* Category / Family */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      {dict?.admin?.familyCategory || 'Catégorie'}
                    </label>
                    <select
                      value={item.familyId}
                      disabled={item.status === 'success' || isUploading}
                      onChange={(e) => updateQueueItem(item.id, { familyId: e.target.value })}
                      className="form-control"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      {families.map((f) => (
                        <option key={f.id} value={f.id}>
                          {lang === 'ar' && f.arabicName ? f.arabicName : f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Details / Specs */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      {dict?.admin?.details || 'Détails (Optionnel)'}
                    </label>
                    <input
                      type="text"
                      value={item.details}
                      disabled={item.status === 'success' || isUploading}
                      onChange={(e) => updateQueueItem(item.id, { details: e.target.value })}
                      placeholder="Ex: Cuir suédé, semelle crantée"
                      className="form-control"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
                    />
                  </div>

                  {/* Catalogs Pills */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginInlineEnd: '0.25rem' }}>
                        Catalogues:
                      </span>
                      {catalogs.map((c) => {
                        const checked = item.catalogIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            disabled={item.status === 'success' || isUploading}
                            onClick={() => toggleItemCatalog(item.id, c.id)}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              border: '1px solid var(--border-color)',
                              background: checked ? 'var(--primary)' : 'var(--bg-color)',
                              color: checked ? 'white' : 'var(--text-muted)',
                              cursor: item.status === 'success' || isUploading ? 'default' : 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {checked ? '✓ ' : ''}{c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Carton Assortment Selector */}
                  <div style={{ gridColumn: '1 / -1', marginTop: '2px' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginInlineEnd: '0.25rem' }}>
                        📦 Carton:
                      </span>
                      {BULK_ASSORTMENT_PRESETS.map((preset) => {
                        const itemAssortmentCount = item.sizeAssortment
                          ? item.sizeAssortment.reduce((sum, s) => sum + (Number(s.ratio) || 0), 0)
                          : 0;
                        const presetCount = preset.items
                          ? preset.items.reduce((sum, s) => sum + (Number(s.ratio) || 0), 0)
                          : 0;
                        const isSelected =
                          (!item.sizeAssortment && preset.id === 'none') ||
                          (item.sizeAssortment && presetCount === itemAssortmentCount && preset.id !== 'none');

                        return (
                          <button
                            key={preset.id}
                            type="button"
                            disabled={item.status === 'success' || isUploading}
                            onClick={() =>
                              updateQueueItem(item.id, {
                                sizeAssortment: preset.items ? JSON.parse(JSON.stringify(preset.items)) : null,
                              })
                            }
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                              background: isSelected ? 'var(--primary-light)' : 'var(--bg-color)',
                              color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                              cursor: item.status === 'success' || isUploading ? 'default' : 'pointer',
                              fontWeight: isSelected ? 800 : 500,
                            }}
                          >
                            {isSelected ? '✓ ' : ''}{preset.shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  {item.status === 'ready' && (
                    <span className="status-pill ready">⏳ Prêt</span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="status-pill uploading">🔄 Envoi...</span>
                  )}
                  {item.status === 'success' && (
                    <span className="status-pill success">✅ Importé</span>
                  )}
                  {item.status === 'error' && (
                    <div style={{ textAlign: 'right' }}>
                      <span className="status-pill error">❌ Erreur</span>
                      {item.errorMessage && (
                        <div style={{ fontSize: '0.72rem', color: '#ef4444', maxWidth: '140px', marginTop: '2px' }}>
                          {item.errorMessage}
                        </div>
                      )}
                    </div>
                  )}

                  {item.status !== 'success' && (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => removeItem(item.id)}
                      className="btn-danger-outline"
                      title="Remove item"
                    >
                      🗑️ Retirer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <Link href={`/${lang}/admin/products`} className="btn btn-outline">
              ← {dict?.admin?.productsList || 'Retour aux Produits'}
            </Link>

            {successCount === queue.length && queue.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#15803d', fontWeight: 700 }}>
                  🎉 {dict?.admin?.bulkSuccess || 'Tous les produits ont été importés avec succès !'}
                </span>
                <Link href={`/${lang}/admin/products`} className="btn">
                  {dict?.admin?.productsList || 'Voir la Liste'} →
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartBulkUpload}
                disabled={isUploading || pendingCount === 0}
                className="btn"
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  opacity: isUploading || pendingCount === 0 ? 0.6 : 1,
                }}
              >
                {isUploading
                  ? `🚀 ${dict?.admin?.uploadingProgress || 'Importation...'} (${uploadProgress.current}/${uploadProgress.total})`
                  : errorCount > 0
                  ? `🚀 ${dict?.admin?.retryBulkUpload || 'Réessayer l\'Importation'} (${pendingCount})`
                  : `🚀 ${dict?.admin?.startBulkUpload || 'Lancer l\'Importation'} (${pendingCount})`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
