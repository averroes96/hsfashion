import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, Locale } from '@/lib/dictionaries';
import SmartImage from '@/components/SmartImage';
import PublicHeader from '@/components/PublicHeader';

export default async function CatalogPage({ params }: { params: Promise<{ catalogSlug: string, lang: string }> }) {
  const { catalogSlug, lang } = await params;
  const dict = await getDictionary(lang as Locale);
  
  const catalog = await prisma.catalog.findUnique({
    where: { slug: catalogSlug },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          family: true,
          images: {
            where: { isPrimary: true },
            take: 1
          }
        }
      }
    }
  });

  if (!catalog) notFound();

  // Group products by family
  const groupedProducts: Record<string, { family: any, products: any[] }> = {};
  for (const p of catalog.products) {
    if (!groupedProducts[p.familyId]) {
      groupedProducts[p.familyId] = { family: p.family, products: [] };
    }
    groupedProducts[p.familyId].products.push(p);
  }

  // Sort families by sortOrder
  const sortedFamilies = Object.values(groupedProducts).sort((a, b) => a.family.sortOrder - b.family.sortOrder);

  return (
    <>
      <div className="blob-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <PublicHeader lang={lang} dict={dict} />
      
      <main className="fade-in">
        {/* Hero Section for Catalog */}
        <section className="hero-section">
          <div className="container fade-in-up">
            <nav style={{ 
              marginBottom: '1rem', 
              color: 'var(--primary)', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--primary-light)',
              padding: '0.25rem 1rem',
              borderRadius: 'var(--radius-full)'
            }}>
              <Link href={`/${lang}`}>{dict.nav.collections}</Link>
              <span>/</span>
              <span>{catalog.name}</span>
            </nav>
            
            <h1 className="hero-title">
              {catalog.name}
            </h1>
            {catalog.description && (
              <p className="hero-subtitle">
                {catalog.description}
              </p>
            )}
          </div>
        </section>

        <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          {sortedFamilies.length === 0 && (
            <div className="glass-card fade-in-up" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>{dict.catalog.noProducts}</p>
            </div>
          )}
          
          {sortedFamilies.map((group, index) => (
            <section key={group.family.id} style={{ marginBottom: '3rem' }} className={`fade-in-up delay-${index % 3 + 1}`}>
              {/* Sticky Header */}
              <div style={{ 
                position: 'sticky', 
                top: '60px', 
                zIndex: 90, 
                background: 'rgba(248, 250, 252, 0.9)', 
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', margin: 0, fontWeight: 800 }}>{group.family.name}</h2>
                  <span className="badge" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                    {group.products.length}
                  </span>
                </div>
                <Link href={`/${lang}/${catalog.slug}/${group.family.slug}`} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', minHeight: '36px' }}>
                  {dict.catalog.viewAll} →
                </Link>
              </div>
              
              {/* Responsive Product Grid */}
              <div className="product-card-grid">
                {group.products.slice(0, 8).map((product: any) => {
                  const primaryImage = product.images[0];
                  return (
                    <Link key={product.id} href={`/${lang}/product/${encodeURIComponent(product.reference)}`} className="product-card">
                      <div className="product-card-media">
                        {primaryImage ? (
                          <SmartImage 
                            src={primaryImage.mediumUrl || primaryImage.thumbnailUrl} 
                            alt={product.reference} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            wrapperStyle={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            No Image
                          </div>
                        )}
                      </div>
                      
                      <div className="product-card-body">
                        <h3 className="product-card-title">{product.reference}</h3>
                        <p className="product-card-subtitle">
                          {product.details || "View details"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {group.products.length > 8 && (
                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <Link href={`/${lang}/${catalog.slug}/${group.family.slug}`} className="btn btn-outline" style={{ background: 'var(--surface)' }}>
                    {dict.catalog.viewAll} ({group.products.length} {dict.home.products}) →
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
