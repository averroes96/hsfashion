export default function HomeLoading() {
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
        {/* Hero Skeleton */}
        <section className="hero-section">
          <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="skeleton-bg" style={{ width: '120px', height: '28px', borderRadius: 'var(--radius-full)', marginBottom: '1rem' }} />
            <div className="skeleton-bg" style={{ width: '80%', maxWidth: '500px', height: '44px', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }} />
            <div className="skeleton-bg" style={{ width: '60%', maxWidth: '350px', height: '20px', borderRadius: 'var(--radius-sm)', marginBottom: '1.75rem' }} />
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div className="skeleton-bg" style={{ width: '130px', height: '36px', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton-bg" style={{ width: '150px', height: '36px', borderRadius: 'var(--radius-md)' }} />
            </div>
          </div>
        </section>

        {/* Bento Grid Skeleton */}
        <section className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          <div className="catalog-card-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`catalog-skeleton-${i}`}
                className="glass-card"
                style={{
                  height: 'clamp(280px, 45vw, 380px)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div className="skeleton-bg" style={{ flex: 1 }} />
                <div style={{
                  padding: '1.5rem',
                  background: 'var(--surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton-bg" style={{ height: '24px', width: '140px', borderRadius: '4px' }} />
                    <div className="skeleton-bg" style={{ height: '16px', width: '100px', borderRadius: '4px' }} />
                  </div>
                  <div className="skeleton-bg" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
