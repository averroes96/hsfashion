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
        <section style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="skeleton-bg" style={{ width: '220px', height: '32px', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem' }} />
            <div className="skeleton-bg" style={{ width: '280px', height: '48px', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
            <div className="skeleton-bg" style={{ width: '380px', maxWidth: '80%', height: '20px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </section>

        {/* Products Grid Skeleton */}
        <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`family-prod-skel-${i}`}
                className="glass-card"
                style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div className="skeleton-bg" style={{ height: '240px' }} />
                <div style={{ padding: '1rem', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="skeleton-bg" style={{ height: '20px', width: '120px', borderRadius: '4px' }} />
                  <div className="skeleton-bg" style={{ height: '14px', width: '90px', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
