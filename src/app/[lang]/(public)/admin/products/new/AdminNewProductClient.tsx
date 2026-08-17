'use client';
import { useState, useEffect } from 'react';
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

      if (!productRes.ok) throw new Error('Product creation failed');
      
      alert('Product created successfully!');
      router.push(`/${lang}/admin`);
    } catch (error) {
      console.error(error);
      alert('Error creating product. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1>{dict.admin.addNewProduct}</h1>
      <div className="admin-card" style={{ marginTop: '2rem', maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
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
            <label>{dict.admin.images}</label>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} required className="form-control" />
            <div className="grid" style={{ marginTop: '1rem' }}>
              {files.map((file, i) => (
                <div key={i} className="image-preview">
                  <img src={URL.createObjectURL(file)} alt={`Preview ${i}`} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
            {isSubmitting ? dict.admin.uploading : dict.admin.saveProduct}
          </button>
        </form>
      </div>
    </div>
  );
}
