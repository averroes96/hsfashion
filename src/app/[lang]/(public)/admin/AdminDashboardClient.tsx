'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminDashboardClient({ dict }: { dict: any }) {
  const params = useParams();
  const lang = params.lang as string;
  
  const [stats, setStats] = useState<any>({
    totalProducts: 0,
    activeProducts: 0,
    totalCatalogs: 0,
    totalFamilies: 0,
    topProducts: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Store Settings state
  const [storePhoneNumber, setStorePhoneNumber] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePromoMessage, setStorePromoMessage] = useState('');

  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/settings');
    const data = await res.json();
    if (data && !data.error) {
      setStorePhoneNumber(data.phoneNumber || '');
      setStoreEmail(data.email || '');
      setStoreAddress(data.address || '');
      setStorePromoMessage(data.promoMessage || '');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: storePhoneNumber,
        email: storeEmail,
        address: storeAddress,
        promoMessage: storePromoMessage
      })
    });
    alert('Settings saved successfully');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{dict.admin.dashboard}</h1>
        <Link href={`/${lang}/admin/products/new`} className="btn">{dict.admin.addNewProduct}</Link>
      </div>

      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <h2>{dict.admin.quickStats}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`stat-skeleton-${i}`} style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div className="skeleton-bg" style={{ height: '40px', width: '60px', borderRadius: '4px' }} />
                <div className="skeleton-bg" style={{ height: '18px', width: '110px', borderRadius: '4px' }} />
              </div>
            ))
          ) : (
            <>
              <Link href={`/${lang}/admin/orders`} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: 'var(--radius-md)', textAlign: 'center', transition: 'transform 0.2s' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: 1.2 }}>{stats.totalOrders || 0}</div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 700 }}>📦 {dict?.orders?.title || 'Commandes'}</div>
                </div>
              </Link>
              <Link href={`/${lang}/admin/orders`} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', textAlign: 'center', transition: 'transform 0.2s' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#d97706', lineHeight: 1.2 }}>{stats.pendingOrders || 0}</div>
                  <div style={{ color: '#d97706', fontSize: '0.9rem', fontWeight: 700 }}>⏳ {dict?.orders?.pending || 'En attente'}</div>
                </div>
              </Link>
              <div style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.2 }}>{stats.totalProducts}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{dict.admin.totalProducts}</div>
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--primary-light)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-hover)', lineHeight: 1.2 }}>{stats.activeProducts}</div>
                <div style={{ color: 'var(--primary-hover)', fontSize: '0.9rem', fontWeight: 600 }}>{dict.admin.activeProducts}</div>
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.2 }}>{stats.totalCatalogs}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{dict.admin.totalCatalogs}</div>
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.2 }}>{stats.totalFamilies}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{dict.admin.totalFamilies}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="admin-card" style={{ marginTop: '2rem' }}>
          <div className="skeleton-bg" style={{ height: '24px', width: '200px', borderRadius: '4px' }} />
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`leaderboard-skeleton-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="skeleton-bg" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                  <div className="skeleton-bg" style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div className="skeleton-bg" style={{ height: '18px', width: '100px', borderRadius: '4px' }} />
                    <div className="skeleton-bg" style={{ height: '14px', width: '60px', borderRadius: '4px' }} />
                  </div>
                </div>
                <div className="skeleton-bg" style={{ height: '20px', width: '40px', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        </div>
      ) : stats.topProducts && stats.topProducts.length > 0 ? (
        <div className="admin-card" style={{ marginTop: '2rem' }}>
          <h2>{dict.admin.topProducts || "Top Products by Views"}</h2>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.topProducts.map((product: any, index: number) => (
              <div key={product.id} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '1rem', background: 'var(--bg-color)', 
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '30px', height: '30px', borderRadius: '50%', 
                    background: index === 0 ? 'var(--primary)' : 'var(--border-color)', 
                    color: index === 0 ? 'white' : 'var(--text-muted)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 'bold', fontSize: '0.875rem' 
                  }}>
                    {index + 1}
                  </div>
                  {product.images?.[0] && (
                    <img 
                      src={product.images[0].thumbnailUrl} 
                      alt={product.reference} 
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{product.reference}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{product.family?.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>visibility</span>
                  {product.views}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      
      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <h2>{dict.admin.storeSettings}</h2>
        <form onSubmit={handleSaveSettings} style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>{dict.admin.promoMessage}</label>
            <input className="form-control" value={storePromoMessage} onChange={e => setStorePromoMessage(e.target.value)} />
          </div>
          <div className="form-group">
            <label>{dict.admin.phoneNumber}</label>
            <input className="form-control" value={storePhoneNumber} onChange={e => setStorePhoneNumber(e.target.value)} dir="ltr" />
          </div>
          <div className="form-group">
            <label>{dict.admin.email}</label>
            <input className="form-control" type="email" value={storeEmail} onChange={e => setStoreEmail(e.target.value)} dir="ltr" />
          </div>
          <div className="form-group">
            <label>{dict.admin.address}</label>
            <textarea className="form-control" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} rows={2} />
          </div>
          <button type="submit" className="btn">{dict.admin.saveSettings}</button>
        </form>
      </div>
    </div>
  );
}
