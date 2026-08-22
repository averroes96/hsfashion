export default function ProductLoading() {
  return (
    <>
      <div className="blob-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <header className="main-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontSize: '2rem' }}>•</span>
            <span style={{ fontWeight: 900, fontSize: '1.5rem' }}>HS Fashion</span>
          </div>
          <div className="skeleton-bg" style={{ width: '80px', height: '36px', borderRadius: 'var(--radius-full)' }} />
        </div>
      </header>

      <main className="fade-in">
        <div className="container" style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
          {/* Breadcrumb Skeleton */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            <div className="skeleton-bg" style={{ width: '90px', height: '20px', borderRadius: '4px' }} />
            <div className="skeleton-bg" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
            <div className="skeleton-bg" style={{ width: '100px', height: '20px', borderRadius: '4px' }} />
            <div className="skeleton-bg" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
            <div className="skeleton-bg" style={{ width: '120px', height: '20px', borderRadius: '4px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', alignItems: 'start' }}>
            {/* Gallery Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skeleton-bg" style={{ height: '480px', borderRadius: 'var(--radius-lg)' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`thumb-${i}`} className="skeleton-bg" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)' }} />
                ))}
              </div>
            </div>

            {/* Info Glass Card Skeleton */}
            <div className="glass-card" style={{ padding: '2.5rem', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton-bg" style={{ height: '40px', width: '200px', borderRadius: '4px' }} />
                <div className="skeleton-bg" style={{ height: '28px', width: '90px', borderRadius: 'var(--radius-full)' }} />
              </div>

              <div className="skeleton-bg" style={{ height: '60px', width: '100%', borderRadius: 'var(--radius-sm)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <div className="skeleton-bg" style={{ height: '20px', width: '120px', borderRadius: '4px' }} />
                <div className="skeleton-bg" style={{ height: '100px', width: '100%', borderRadius: 'var(--radius-md)' }} />
              </div>

              <div className="skeleton-bg" style={{ height: '52px', width: '100%', borderRadius: 'var(--radius-full)', marginTop: '1rem' }} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
