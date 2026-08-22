export default function FamilyLoading() {
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
        {/* Family Header Skeleton */}
        <section className="hero-section">
          <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="skeleton-bg" style={{ width: '180px', height: '28px', borderRadius: 'var(--radius-full)', marginBottom: '1rem' }} />
            <div className="skeleton-bg" style={{ width: '240px', height: '40px', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }} />
            <div className="skeleton-bg" style={{ width: '340px', maxWidth: '80%', height: '18px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </section>

        {/* Products Grid Skeleton */}
        <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          <div className="product-card-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`family-prod-skel-${i}`}
                className="product-card"
                style={{ overflow: 'hidden' }}
              >
                <div className="skeleton-bg product-card-media" />
                <div className="product-card-body" style={{ gap: '0.4rem' }}>
                  <div className="skeleton-bg" style={{ height: '18px', width: '100px', borderRadius: '4px' }} />
                  <div className="skeleton-bg" style={{ height: '12px', width: '70px', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
