'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

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
  const [existingImages, setExistingImages] = useState<any[]>([]);
  
  const [files, setFiles] = useState<File[]>([]);
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
      setCatalogIds(prodData.catalogs.map((c: any) => c.id));
      setExistingImages(prodData.images || []);
    }
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
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
          isActive
        })
      });

      if (!productRes.ok) {
        const errData = await productRes.json().catch(() => ({}));
        throw new Error(errData?.error || 'Product update failed');
      }
      
      alert('Product updated successfully!');
      router.push(`/${lang}/admin/products`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error updating product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{dict.admin.editProduct}</h1>
      <div className="admin-card" style={{ marginTop: '2rem', maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              <span style={{ fontWeight: 'bold' }}>{dict.admin.active}</span>
            </label>
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

          <div className="form-group">
            <label>Current Images (Cannot edit images yet)</label>
            <div className="grid" style={{ marginTop: '1rem' }}>
              {existingImages.map((img, i) => (
                <div key={img.id} className="image-preview">
                  <img src={img.thumbnailUrl} alt={`Current ${i}`} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
            {isSubmitting ? dict.admin.uploading : dict.admin.update}
          </button>
        </form>
      </div>
    </div>
  );
}
