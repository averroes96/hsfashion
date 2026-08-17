'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminDashboardClient({ dict }: { dict: any }) {
  const params = useParams();
  const lang = params.lang as string;
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalCatalogs: 0,
    totalFamilies: 0
  });

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
    const res = await fetch('/api/admin/stats');
    if (res.ok) {
      setStats(await res.json());
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
        </div>
      </div>
      
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
