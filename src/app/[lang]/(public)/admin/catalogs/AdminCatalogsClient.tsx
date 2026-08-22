'use client';
import { useState, useEffect } from 'react';

export default function AdminCatalogsClient({ dict }: { dict: any }) {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [catalogName, setCatalogName] = useState('');
  const [catalogDescription, setCatalogDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/catalogs');
      if (res.ok) setCatalogs(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = generateSlug(catalogName);
    const maxSort = catalogs.length > 0 ? Math.max(...catalogs.map(c => c.sortOrder)) : 0;
    
    await fetch('/api/admin/catalogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catalogName, description: catalogDescription, slug, sortOrder: maxSort + 1 })
    });
    setCatalogName('');
    setCatalogDescription('');
    fetchCatalogs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this catalog?')) return;
    await fetch(`/api/admin/catalogs/${id}`, { method: 'DELETE' });
    fetchCatalogs();
  };

  const handleUpdate = async (id: string, currentSortOrder: number) => {
    const slug = generateSlug(editName);
    await fetch(`/api/admin/catalogs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDescription, slug, sortOrder: currentSortOrder })
    });
    setEditingId(null);
    fetchCatalogs();
  };

  const startEdit = (catalog: any) => {
    setEditingId(catalog.id);
    setEditName(catalog.name);
    setEditDescription(catalog.description || '');
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === catalogs.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = catalogs[index];
    const target = catalogs[targetIndex];

    const currentSort = current.sortOrder;
    const targetSort = target.sortOrder;

    // Swap sortOrders in DB
    await Promise.all([
      fetch(`/api/admin/catalogs/${current.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, sortOrder: targetSort })
      }),
      fetch(`/api/admin/catalogs/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target, sortOrder: currentSort })
      })
    ]);

    fetchCatalogs();
  };

  const totalPages = Math.ceil(catalogs.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCatalogs = catalogs.slice(startIndex, endIndex);

  return (
    <div>
      <h1>{dict.admin.catalogsList}</h1>
      
      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <h2>{dict.admin.createCatalog}</h2>
        <form onSubmit={handleCreate} style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>{dict.admin.name}</label>
            <input className="form-control" value={catalogName} onChange={e => setCatalogName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>{dict.admin.descriptionLong}</label>
            <input className="form-control" value={catalogDescription} onChange={e => setCatalogDescription(e.target.value)} />
          </div>
          <div style={{ paddingTop: '1.5rem' }}>
            <button type="submit" className="btn">{dict.admin.createCatalog}</button>
          </div>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>{dict.admin.name}</th>
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
            ) : paginatedCatalogs.length > 0 ? (
              paginatedCatalogs.map((catalog, localIndex) => {
                const globalIndex = startIndex + localIndex;
                return (
                  <tr key={catalog.id}>
                    <td>
                      <button onClick={() => moveOrder(globalIndex, 'up')} disabled={globalIndex === 0} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.25rem', padding: '0 0.5rem', color: globalIndex === 0 ? 'var(--border-color)' : 'var(--text-main)' }}>↑</button>
                      <button onClick={() => moveOrder(globalIndex, 'down')} disabled={globalIndex === catalogs.length - 1} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.25rem', padding: '0 0.5rem', color: globalIndex === catalogs.length - 1 ? 'var(--border-color)' : 'var(--text-main)' }}>↓</button>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {editingId === catalog.id ? (
                        <input className="form-control" value={editName} onChange={e => setEditName(e.target.value)} />
                      ) : (
                        catalog.name
                      )}
                    </td>
                    <td>
                      {editingId === catalog.id ? (
                        <input className="form-control" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{catalog.description || '-'}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {editingId === catalog.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleUpdate(catalog.id, catalog.sortOrder)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{dict.admin.update}</button>
                          <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{dict.admin.cancel}</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => startEdit(catalog)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{dict.admin.edit}</button>
                          <button onClick={() => handleDelete(catalog.id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{dict.admin.delete}</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {dict.admin.noCatalogs}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {!isLoading && catalogs.length > 0 && (
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
              {dict?.pagination?.showing || 'Showing'} {startIndex + 1} {dict?.pagination?.to || 'to'} {Math.min(endIndex, catalogs.length)} {dict?.pagination?.of || 'of'} {catalogs.length} {dict?.pagination?.results || 'catalogs'}
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
