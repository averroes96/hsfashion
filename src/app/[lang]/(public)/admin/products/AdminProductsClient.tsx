'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminProductsClient({ dict }: { dict: any }) {
  const params = useParams();
  const lang = params.lang as string;

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) setProducts(await res.json());
    } finally {
      setIsLoading(false);
    }
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

  const totalPages = Math.ceil(products.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = products.slice(startIndex, endIndex);

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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td>
                    <div className="skeleton-bg" style={{ width: '60px', height: '80px', borderRadius: 'var(--radius-sm)' }} />
                  </td>
                  <td>
                    <div className="skeleton-bg" style={{ height: '20px', width: '120px', borderRadius: '4px' }} />
                  </td>
                  <td>
                    <div className="skeleton-bg" style={{ height: '20px', width: '90px', borderRadius: '4px' }} />
                  </td>
                  <td>
                    <div className="skeleton-bg" style={{ height: '32px', width: '80px', borderRadius: 'var(--radius-full)' }} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <div className="skeleton-bg" style={{ height: '36px', width: '70px', borderRadius: 'var(--radius-full)' }} />
                      <div className="skeleton-bg" style={{ height: '36px', width: '80px', borderRadius: 'var(--radius-full)' }} />
                    </div>
                  </td>
                </tr>
              ))
            ) : paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => {
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
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No products available.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {!isLoading && products.length > 0 && (
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
              {dict?.pagination?.showing || 'Showing'} {startIndex + 1} {dict?.pagination?.to || 'to'} {Math.min(endIndex, products.length)} {dict?.pagination?.of || 'of'} {products.length} {dict?.pagination?.results || 'products'}
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
