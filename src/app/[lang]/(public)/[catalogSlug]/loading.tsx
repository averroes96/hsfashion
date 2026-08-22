export default function CatalogLoading() {
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
        {/* Catalog Hero Skeleton */}
        <section style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="skeleton-bg" style={{ width: '160px', height: '32px', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem' }} />
            <div className="skeleton-bg" style={{ width: '300px', height: '48px', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
            <div className="skeleton-bg" style={{ width: '450px', maxWidth: '80%', height: '20px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </section>

        {/* Family Sections Skeleton */}
        <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          {Array.from({ length: 2 }).map((_, fIndex) => (
            <section key={`family-skel-${fIndex}`} style={{ marginBottom: '4rem' }}>
              {/* Sticky Header Skeleton */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                background: 'rgba(248, 250, 252, 0.85)'
              }}>
                <div className="skeleton-bg" style={{ height: '30px', width: '160px', borderRadius: '4px' }} />
                <div className="skeleton-bg" style={{ height: '36px', width: '100px', borderRadius: 'var(--radius-full)' }} />
              </div>

              {/* Products Grid Skeleton */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {Array.from({ length: 4 }).map((_, pIndex) => (
                  <div
                    key={`prod-skel-${pIndex}`}
                    className="glass-card"
                    style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    <div className="skeleton-bg" style={{ height: '300px' }} />
                    <div style={{ padding: '1rem', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="skeleton-bg" style={{ height: '20px', width: '120px', borderRadius: '4px' }} />
                      <div className="skeleton-bg" style={{ height: '14px', width: '80px', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
