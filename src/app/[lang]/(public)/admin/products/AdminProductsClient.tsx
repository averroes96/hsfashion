'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminProductsClient({ dict }: { dict: any }) {
  const params = useParams();
  const lang = params.lang as string;

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/admin/products');
    if (res.ok) setProducts(await res.json());
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const toggleActive = async (product: any) => {
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, isActive: !product.isActive })
    });
    fetchProducts();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{dict.admin.productsList}</h1>
        <Link href={`/${lang}/admin/products/new`} className="btn">{dict.admin.addNewProduct}</Link>
      </div>

      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Image</th>
              <th>{dict.admin.reference}</th>
              <th>{dict.admin.familyCategory}</th>
              <th>{dict.admin.status}</th>
              <th style={{ textAlign: 'right' }}>{dict.admin.actions}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const primaryImg = product.images?.[0];
              return (
                <tr key={product.id}>
                  <td>
                    {primaryImg ? (
                      <div className="image-preview" style={{ width: '60px', height: '80px', borderRadius: 'var(--radius-sm)' }}>
                        <img src={primaryImg.thumbnailUrl} alt={product.reference} style={{ height: '100%' }} />
                      </div>
                    ) : (
                      <div style={{ width: '60px', height: '80px', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }} />
                    )}
                  </td>
                  <td style={{ fontWeight: '600' }}>{product.reference}</td>
                  <td>{product.family?.name || '-'}</td>
                  <td>
                    <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
                      <input 
                        type="checkbox" 
                        checked={product.isActive}
                        onChange={() => toggleActive(product)}
                      />
                      <span style={{ color: product.isActive ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {product.isActive ? dict.admin.active : dict.admin.inactive}
                      </span>
                    </label>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link href={`/${lang}/admin/products/${product.id}/edit`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{dict.admin.edit}</Link>
                      <button onClick={() => handleDelete(product.id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{dict.admin.delete}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No products available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
