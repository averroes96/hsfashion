'use client';
import { useState, useEffect } from 'react';

export default function AdminFamiliesClient({ dict }: { dict: any }) {
  const [families, setFamilies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editArabicName, setEditArabicName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Bulk creation state
  const [newFamilies, setNewFamilies] = useState([{ name: '', arabicName: '', description: '' }]);

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/families');
      if (res.ok) setFamilies(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleAddRow = () => {
    setNewFamilies([...newFamilies, { name: '', arabicName: '', description: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    const list = [...newFamilies];
    list.splice(index, 1);
    setNewFamilies(list);
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    const list = [...newFamilies];
    (list[index] as any)[field] = value;
    setNewFamilies(list);
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out rows without a name
    const validFamilies = newFamilies.filter(f => f.name.trim() !== '');
    if (validFamilies.length === 0) return;

    let currentMaxSort = families.length > 0 ? Math.max(...families.map(f => f.sortOrder)) : 0;
    
    const payload = validFamilies.map((f, index) => ({
      name: f.name.trim(),
      arabicName: f.arabicName.trim() || undefined,
      description: f.description.trim() || undefined,
      slug: generateSlug(f.name.trim()),
      sortOrder: currentMaxSort + index + 1
    }));

    await fetch('/api/admin/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setNewFamilies([{ name: '', arabicName: '', description: '' }]);
    fetchFamilies();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this family?')) return;
    await fetch(`/api/admin/families/${id}`, { method: 'DELETE' });
    fetchFamilies();
  };

  const handleUpdate = async (id: string, currentSortOrder: number) => {
    const slug = generateSlug(editName);
    await fetch(`/api/admin/families/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, arabicName: editArabicName, description: editDescription, slug, sortOrder: currentSortOrder })
    });
    setEditingId(null);
    fetchFamilies();
  };

  const startEdit = (family: any) => {
    setEditingId(family.id);
    setEditName(family.name);
    setEditArabicName(family.arabicName || '');
    setEditDescription(family.description || '');
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === families.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = families[index];
    const target = families[targetIndex];

    const currentSort = current.sortOrder;
    const targetSort = target.sortOrder;

    await Promise.all([
      fetch(`/api/admin/families/${current.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, sortOrder: targetSort })
      }),
      fetch(`/api/admin/families/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target, sortOrder: currentSort })
      })
    ]);

    fetchFamilies();
  };

  const totalPages = Math.ceil(families.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFamilies = families.slice(startIndex, endIndex);

  return (
    <div>
      <h1>{dict.admin.familiesList}</h1>
      
      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>{dict.admin.createFamily} (Bulk)</h2>
          <button type="button" onClick={handleAddRow} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
            + Add Row
          </button>
        </div>

        <form onSubmit={handleBulkCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {newFamilies.map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ flex: 1 }}>
                  <label>{dict.admin.name} *</label>
                  <input 
                    type="text"
                    className="form-control" 
                    value={row.name} 
                    onChange={e => handleRowChange(i, 'name', e.target.value)} 
                    required 
                    placeholder="e.g. Sneakers"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Arabic Name</label>
                  <input 
                    type="text"
                    dir="rtl"
                    className="form-control" 
                    value={row.arabicName} 
                    onChange={e => handleRowChange(i, 'arabicName', e.target.value)} 
                    placeholder="e.g. أحذية رياضية"
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label>{dict.admin.descriptionLong}</label>
                  <input 
                    type="text"
                    className="form-control" 
                    value={row.description} 
                    onChange={e => handleRowChange(i, 'description', e.target.value)} 
                    placeholder="Optional description..."
                  />
                </div>
                {newFamilies.length > 1 && (
                  <div style={{ paddingTop: '1.5rem' }}>
                    <button type="button" onClick={() => handleRemoveRow(i)} className="btn btn-danger" style={{ padding: '0.5rem 0.75rem', fontSize: '1.25rem', lineHeight: 1 }}>
                      &times;
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div style={{ paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">{dict.admin.createFamily}</button>
          </div>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>{dict.admin.name}</th>
              <th>Arabic Name</th>
              <th>{dict.admin.descriptionLong}</th>
              <th style={{ textAlign: 'right' }}>{dict.admin.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td>
                    <div className="skeleton-bg" style={{ height: '24px', width: '50px', borderRadius: '4px' }} />
                  </td>
                  <td>
                    <div className="skeleton-bg" style={{ height: '20px', width: '130px', borderRadius: '4px' }} />
                  </td>
                  <td>
                    <div className="skeleton-bg" style={{ height: '20px', width: '110px', borderRadius: '4px' }} />
                  </td>
                  <td>
                    <div className="skeleton-bg" style={{ height: '20px', width: '180px', borderRadius: '4px' }} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <div className="skeleton-bg" style={{ height: '36px', width: '70px', borderRadius: 'var(--radius-full)' }} />
                      <div className="skeleton-bg" style={{ height: '36px', width: '80px', borderRadius: 'var(--radius-full)' }} />
                    </div>
                  </td>
                </tr>
              ))
            ) : paginatedFamilies.length > 0 ? (
              paginatedFamilies.map((family, localIndex) => {
                const globalIndex = startIndex + localIndex;
                return (
                  <tr key={family.id}>
                    <td>
                      <button onClick={() => moveOrder(globalIndex, 'up')} disabled={globalIndex === 0} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.25rem', padding: '0 0.5rem', color: globalIndex === 0 ? 'var(--border-color)' : 'var(--text-main)' }}>↑</button>
                      <button onClick={() => moveOrder(globalIndex, 'down')} disabled={globalIndex === families.length - 1} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.25rem', padding: '0 0.5rem', color: globalIndex === families.length - 1 ? 'var(--border-color)' : 'var(--text-main)' }}>↓</button>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {editingId === family.id ? (
                        <input className="form-control" value={editName} onChange={e => setEditName(e.target.value)} />
                      ) : (
                        family.name
                      )}
                    </td>
                    <td dir="rtl" style={{ textAlign: 'right' }}>
                      {editingId === family.id ? (
                        <input className="form-control" value={editArabicName} onChange={e => setEditArabicName(e.target.value)} />
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{family.arabicName || '-'}</span>
                      )}
                    </td>
                    <td>
                      {editingId === family.id ? (
                        <input className="form-control" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{family.description || '-'}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {editingId === family.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleUpdate(family.id, family.sortOrder)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{dict.admin.update}</button>
                          <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{dict.admin.cancel}</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => startEdit(family)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{dict.admin.edit}</button>
                          <button onClick={() => handleDelete(family.id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{dict.admin.delete}</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No families available.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {!isLoading && families.length > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '1.5rem', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {dict?.pagination?.showing || 'Showing'} {startIndex + 1} {dict?.pagination?.to || 'to'} {Math.min(endIndex, families.length)} {dict?.pagination?.of || 'of'} {families.length} {dict?.pagination?.results || 'families'}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-outline"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-full)',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {dict?.pagination?.previous || 'Previous'}
                </button>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-full)',
                        border: p === currentPage ? 'none' : '1px solid var(--border-color)',
                        background: p === currentPage ? 'var(--primary)' : 'var(--surface)',
                        color: p === currentPage ? 'white' : 'var(--text-main)',
                        fontWeight: p === currentPage ? 700 : 500,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-outline"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-full)',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  {dict?.pagination?.next || 'Next'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
