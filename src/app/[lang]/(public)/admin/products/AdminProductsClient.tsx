'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminProductsClient({ dict }: { dict: any }) {
  const params = useParams();
  const lang = params.lang as string;

  const [products, setProducts] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [selectedCatalog, setSelectedCatalog] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'ref_asc' | 'ref_desc' | 'views_desc'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, famRes, catRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/families'),
        fetch('/api/admin/catalogs'),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (famRes.ok) setFamilies(await famRes.json());
      if (catRes.ok) setCatalogs(await catRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleActive = async (product: any) => {
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, isActive: !product.isActive }),
    });
    // Optimistically update local state for instant feel
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  // Reset to page 1 whenever filters change
  const handleFilterChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedFamily('all');
    setSelectedCatalog('all');
    setSelectedStatus('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedFamily !== 'all' ||
    selectedCatalog !== 'all' ||
    selectedStatus !== 'all' ||
    sortBy !== 'newest';

  // Compute Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search query filter (Reference, details, description, family name)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchRef = product.reference?.toLowerCase().includes(q);
          const matchDetails = product.details?.toLowerCase().includes(q);
          const matchDesc = product.description?.toLowerCase().includes(q);
          const matchFamName = product.family?.name?.toLowerCase().includes(q);
          const matchFamAr = product.family?.arabicName?.toLowerCase().includes(q);
          if (!matchRef && !matchDetails && !matchDesc && !matchFamName && !matchFamAr) {
            return false;
          }
        }

        // Family / Category filter
        if (selectedFamily !== 'all') {
          if (product.familyId !== selectedFamily) return false;
        }

        // Catalog filter
        if (selectedCatalog !== 'all') {
          const inCatalog = product.catalogs?.some((c: any) => c.id === selectedCatalog);
          if (!inCatalog) return false;
        }

        // Status filter
        if (selectedStatus === 'active' && !product.isActive) return false;
        if (selectedStatus === 'inactive' && product.isActive) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === 'ref_asc') {
          return (a.reference || '').localeCompare(b.reference || '');
        }
        if (sortBy === 'ref_desc') {
          return (b.reference || '').localeCompare(a.reference || '');
        }
        if (sortBy === 'views_desc') {
          return (b.views || 0) - (a.views || 0);
        }
        return 0;
      });
  }, [products, searchQuery, selectedFamily, selectedCatalog, selectedStatus, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>{dict.admin.productsList}</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            {products.length} {dict.admin.totalProducts || 'produits au total'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href={`/${lang}/admin/products/bulk`} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🚀</span>
            <span>{dict?.admin?.bulkUpload || 'Import Multiple'}</span>
          </Link>
          <Link href={`/${lang}/admin/products/new`} className="btn">
            + {dict.admin.addNewProduct}
          </Link>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: '1.5rem' }}>
        {/* Search & Multi-Filter Toolbar */}
        <div className="admin-filter-toolbar">
          {/* Keyword Search */}
          <div className="admin-search-wrapper">
            <span className="material-symbols-outlined admin-search-icon">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              placeholder={dict?.admin?.searchPlaceholder || 'Rechercher par référence, description...'}
              className="admin-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleFilterChange(setSearchQuery, '')}
                className="admin-search-clear"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category / Family Select */}
          <select
            value={selectedFamily}
            onChange={(e) => handleFilterChange(setSelectedFamily, e.target.value)}
            className="admin-select"
            aria-label="Filtrer par catégorie"
          >
            <option value="all">{dict?.admin?.allFamilies || 'Toutes les catégories'}</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {lang === 'ar' && f.arabicName ? f.arabicName : f.name}
              </option>
            ))}
          </select>

          {/* Catalog Select */}
          <select
            value={selectedCatalog}
            onChange={(e) => handleFilterChange(setSelectedCatalog, e.target.value)}
            className="admin-select"
            aria-label="Filtrer par catalogue"
          >
            <option value="all">{dict?.admin?.allCatalogs || 'Tous les catalogues'}</option>
            {catalogs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
            className="admin-select"
            aria-label="Filtrer par statut"
          >
            <option value="all">{dict?.admin?.allStatuses || 'Tous les statuts'}</option>
            <option value="active">{dict?.admin?.active || 'Actif'}</option>
            <option value="inactive">{dict?.admin?.inactive || 'Inactif'}</option>
          </select>

          {/* Sort By Select */}
          <select
            value={sortBy}
            onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
            className="admin-select"
            aria-label="Trier par"
          >
            <option value="newest">{dict?.admin?.sortNewest || 'Plus récents'}</option>
            <option value="oldest">{dict?.admin?.sortOldest || 'Plus anciens'}</option>
            <option value="ref_asc">{dict?.admin?.sortReferenceAsc || 'Référence (A-Z)'}</option>
            <option value="ref_desc">{dict?.admin?.sortReferenceDesc || 'Référence (Z-A)'}</option>
            <option value="views_desc">{dict?.admin?.sortViews || 'Plus consultés'}</option>
          </select>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="admin-filter-reset"
              title="Reset all filters"
            >
              <span>✕</span>
              <span>{dict?.admin?.clearFilters || 'Effacer les filtres'}</span>
            </button>
          )}
        </div>

        {/* Filter Results Summary Banner */}
        {isFiltered && !isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 1rem',
              background: 'var(--primary-light)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: 'var(--primary-hover)',
              fontWeight: 600,
            }}
          >
            <span>
              🔍 {filteredProducts.length} {dict?.admin?.filterResults || 'résultats trouvés'} (sur {products.length})
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Page {currentPage} / {totalPages}
            </span>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Image</th>
                <th>{dict.admin.reference}</th>
                <th>{dict.admin.familyCategory}</th>
                <th>Catalogues</th>
                <th>Vues 👁️</th>
                <th>{dict.admin.status}</th>
                <th style={{ textAlign: 'right' }}>{dict.admin.actions}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td>
                      <div className="skeleton-bg" style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)' }} />
                    </td>
                    <td>
                      <div className="skeleton-bg" style={{ height: '20px', width: '120px', borderRadius: '4px' }} />
                    </td>
                    <td>
                      <div className="skeleton-bg" style={{ height: '20px', width: '90px', borderRadius: '4px' }} />
                    </td>
                    <td>
                      <div className="skeleton-bg" style={{ height: '20px', width: '100px', borderRadius: '4px' }} />
                    </td>
                    <td>
                      <div className="skeleton-bg" style={{ height: '20px', width: '40px', borderRadius: '4px' }} />
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
                          <div className="image-preview" style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)' }}>
                            <img src={primaryImg.thumbnailUrl} alt={product.reference} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '60px', height: '60px', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            No Img
                          </div>
                        )}
                      </td>
                      <td>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{product.reference}</strong>
                        {product.details && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {product.details}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem' }}>
                          {product.family?.name || '-'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '200px' }}>
                          {product.catalogs?.length > 0 ? (
                            product.catalogs.map((c: any) => (
                              <span
                                key={c.id}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.45rem',
                                  background: 'var(--bg-color)',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {product.views || 0}
                        </span>
                      </td>
                      <td>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            gap: '0.4rem',
                            background: 'var(--bg-color)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={product.isActive}
                            onChange={() => toggleActive(product)}
                          />
                          <span
                            style={{
                              color: product.isActive ? 'var(--primary)' : 'var(--text-muted)',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                            }}
                          >
                            {product.isActive ? dict.admin.active : dict.admin.inactive}
                          </span>
                        </label>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/${lang}/admin/products/${product.id}/edit`}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', minHeight: '34px' }}
                          >
                            {dict.admin.edit}
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="btn btn-danger"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', minHeight: '34px' }}
                          >
                            {dict.admin.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                      {isFiltered
                        ? dict?.admin?.noFilteredProducts || 'Aucun produit ne correspond à vos critères.'
                        : 'Aucun produit disponible.'}
                    </div>
                    {isFiltered && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="btn btn-outline"
                        style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                      >
                        {dict?.admin?.clearFilters || 'Effacer les filtres'}
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && filteredProducts.length > 0 && (
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
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {dict?.pagination?.showing || 'Affichage de'} {startIndex + 1}{' '}
              {dict?.pagination?.to || 'à'} {Math.min(endIndex, filteredProducts.length)}{' '}
              {dict?.pagination?.of || 'sur'} {filteredProducts.length}{' '}
              {dict?.pagination?.results || 'produits'}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-outline"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-full)',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    minHeight: '34px',
                  }}
                >
                  {dict?.pagination?.previous || 'Précédent'}
                </button>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => {
                    // Show first, last, and window around current page
                    if (
                      p === 1 ||
                      p === totalPages ||
                      (p >= currentPage - 1 && p <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          style={{
                            width: '34px',
                            height: '34px',
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
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === currentPage - 2 || p === currentPage + 2) {
                      return (
                        <span
                          key={`ellipsis-${p}`}
                          style={{
                            width: '24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                          }}
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-outline"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-full)',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    minHeight: '34px',
                  }}
                >
                  {dict?.pagination?.next || 'Suivant'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
