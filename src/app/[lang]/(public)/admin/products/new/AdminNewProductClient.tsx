'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function AdminNewProductClient({ dict }: { dict: any }) {
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
  
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 5) {
        alert(dict.admin?.maxImagesError || 'You can only upload a maximum of 5 images per product.');
        e.target.value = ''; // Reset the input
        setFiles([]);
      } else {
        setFiles(selectedFiles);
        setAiStatus(null);
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
      alert(dict.admin?.ai?.selectImageFirst || 'Please select at least one image first.');
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

      if (aiData.familyId && families.some((f: any) => f.id === aiData.familyId)) {
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

      setAiStatus(dict.admin?.ai?.aiSuccess || 'Detected category and generated details successfully!');
    } catch (err: any) {
      console.error(err);
      alert(dict.admin?.ai?.aiError || (err.message || 'AI Auto-fill encountered an error.'));
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
      alert('Please select at least one image.');
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
        if (!res.ok) throw new Error('Image upload failed');
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
          images: uploadedImages
        })
      });

      if (!productRes.ok) {
        const errData = await productRes.json().catch(() => ({}));
        throw new Error(errData?.error || 'Product creation failed');
      }
      
      alert('Product created successfully!');
      router.push(`/${lang}/admin`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error creating product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Mode Switch Tabs */}
      <div className="admin-mode-tabs">
        <button type="button" className="admin-mode-tab active">
          <span>📄</span>
          <span>{dict?.admin?.singleMode || 'Ajout Unique'}</span>
        </button>
        <Link href={`/${lang}/admin/products/bulk`} className="admin-mode-tab">
          <span>🚀</span>
          <span>{dict?.admin?.bulkMode || 'Ajout par Lot (Multiple)'}</span>
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{dict.admin.addNewProduct}</h1>
        {files.length > 0 && (
          <button
            type="button"
            onClick={handleAiAutoFill}
            disabled={isAiAnalyzing || isSubmitting}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-full)'
            }}
          >
            {isAiAnalyzing ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                <span>{dict.admin?.ai?.analyzing || 'Analyzing with AI...'}</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>{dict.admin?.ai?.autoFillBtn || 'Auto-Fill with AI ✨'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {aiStatus && (
        <div style={{
          marginTop: '1.5rem',
          padding: '0.75rem 1.25rem',
          background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
          border: '1px solid rgba(79, 70, 229, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--primary)',
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>✨</span>
          <span>{aiStatus}</span>
        </div>
      )}

      <div className="admin-card" style={{ marginTop: '1.5rem', maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>{dict.admin.images} *</label>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={handleAiAutoFill}
                  disabled={isAiAnalyzing || isSubmitting}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>✨</span>
                  <span>{isAiAnalyzing ? (dict.admin?.ai?.analyzing || 'Analyzing...') : (dict.admin?.ai?.autoFillBtn || 'Auto-Fill with AI ✨')}</span>
                </button>
              )}
            </div>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} required className="form-control" />
            <div className="grid" style={{ marginTop: '1rem' }}>
              {files.map((file, i) => (
                <div key={i} className="image-preview">
                  <img src={URL.createObjectURL(file)} alt={`Preview ${i}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label>{dict.admin.catalogs}</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {catalogs.map((c: any) => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#f5f5f5', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                  <input 
                    type="checkbox" 
                    checked={catalogIds.includes(c.id)}
                    onChange={() => toggleCatalog(c.id)}
                  />
                  {c.name}
                </label>
              ))}
              {catalogs.length === 0 && <span style={{ color: 'var(--secondary)' }}>{dict.admin.noCatalogs}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label>{dict.admin.familyCategory}</label>
            <select className="form-control" value={familyId} onChange={e => setFamilyId(e.target.value)} required>
              {families.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{dict.admin.reference}</label>
            <input className="form-control" value={reference} onChange={e => setReference(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>{dict.admin.details}</label>
            <textarea className="form-control" rows={3} value={details} onChange={e => setDetails(e.target.value)}></textarea>
          </div>

          <div className="form-group">
            <label>{dict.admin.descriptionLong}</label>
            <textarea className="form-control" rows={5} value={description} onChange={e => setDescription(e.target.value)}></textarea>
          </div>

          <button type="submit" className="btn" disabled={isSubmitting || isAiAnalyzing} style={{ marginTop: '1rem' }}>
            {isSubmitting ? dict.admin.uploading : dict.admin.saveProduct}
          </button>
        </form>
      </div>
    </div>
  );
}
