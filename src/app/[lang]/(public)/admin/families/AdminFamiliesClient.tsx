'use client';
import { useState, useEffect } from 'react';

export default function AdminFamiliesClient({ dict }: { dict: any }) {
  const [families, setFamilies] = useState<any[]>([]);
  const [familyName, setFamilyName] = useState('');
  const [familyDescription, setFamilyDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    const res = await fetch('/api/admin/families');
    if (res.ok) setFamilies(await res.json());
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Split by comma or newline, trim spaces, and filter empty strings
    const names = familyName.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== '');
    if (names.length === 0) return;

    let currentMaxSort = families.length > 0 ? Math.max(...families.map(f => f.sortOrder)) : 0;
    
    await Promise.all(names.map(async (name, index) => {
      const slug = generateSlug(name);
      await fetch('/api/admin/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          description: familyDescription, 
          slug, 
          sortOrder: currentMaxSort + index + 1 
        })
      });
    }));

    setFamilyName('');
    setFamilyDescription('');
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
      body: JSON.stringify({ name: editName, description: editDescription, slug, sortOrder: currentSortOrder })
    });
    setEditingId(null);
    fetchFamilies();
  };

  const startEdit = (family: any) => {
    setEditingId(family.id);
    setEditName(family.name);
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

  return (
    <div>
      <h1>{dict.admin.familiesList}</h1>
      
      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <h2>{dict.admin.createFamily} (Bulk Create)</h2>
        <form onSubmit={handleCreate} style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>{dict.admin.name} (One per line or comma-separated)</label>
            <textarea 
              className="form-control" 
              value={familyName} 
              onChange={e => setFamilyName(e.target.value)} 
              required 
              rows={3}
              placeholder="e.g. Sneakers, Boots, Loafers"
            />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>{dict.admin.descriptionLong}</label>
            <textarea 
              className="form-control" 
              value={familyDescription} 
              onChange={e => setFamilyDescription(e.target.value)} 
              rows={3}
              placeholder="Optional description applied to all..."
            />
          </div>
          <div style={{ paddingTop: '1.5rem' }}>
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
              <th>{dict.admin.descriptionLong}</th>
              <th style={{ textAlign: 'right' }}>{dict.admin.actions}</th>
            </tr>
          </thead>
          <tbody>
            {families.map((family, index) => (
              <tr key={family.id}>
                <td>
                  <button onClick={() => moveOrder(index, 'up')} disabled={index === 0} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.25rem', padding: '0 0.5rem', color: index === 0 ? 'var(--border-color)' : 'var(--text-main)' }}>↑</button>
                  <button onClick={() => moveOrder(index, 'down')} disabled={index === families.length - 1} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.25rem', padding: '0 0.5rem', color: index === families.length - 1 ? 'var(--border-color)' : 'var(--text-main)' }}>↓</button>
                </td>
                <td style={{ fontWeight: 600 }}>
                  {editingId === family.id ? (
                    <input className="form-control" value={editName} onChange={e => setEditName(e.target.value)} />
                  ) : (
                    family.name
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
            ))}
            {families.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No families available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
