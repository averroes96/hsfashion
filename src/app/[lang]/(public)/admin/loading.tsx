export default function AdminLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton-bg" style={{ height: '36px', width: '220px', borderRadius: '4px' }} />
        <div className="skeleton-bg" style={{ height: '40px', width: '150px', borderRadius: 'var(--radius-full)' }} />
      </div>

      <div className="admin-card">
        <div className="skeleton-bg" style={{ height: '24px', width: '180px', borderRadius: '4px', marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`admin-stat-skel-${i}`} style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div className="skeleton-bg" style={{ height: '40px', width: '60px', borderRadius: '4px' }} />
              <div className="skeleton-bg" style={{ height: '18px', width: '110px', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="skeleton-bg" style={{ height: '24px', width: '150px', borderRadius: '4px', marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`table-skel-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div className="skeleton-bg" style={{ height: '20px', width: '140px', borderRadius: '4px' }} />
              <div className="skeleton-bg" style={{ height: '20px', width: '100px', borderRadius: '4px' }} />
              <div className="skeleton-bg" style={{ height: '32px', width: '80px', borderRadius: 'var(--radius-full)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
