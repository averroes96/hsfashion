import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, Locale } from '@/lib/dictionaries';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SmartImage from '@/components/SmartImage';

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

      <header className="main-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/${lang}`} className="logo">
            <span style={{ color: 'var(--primary)', fontSize: '2rem' }}>•</span>
            HS Fashion
          </Link>
          <LanguageSwitcher currentLang={lang} />
        </div>
      </header>
      
      <main className="fade-in">
        {/* Hero Section for Catalog */}
        <section style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="container fade-in-up">
            <nav style={{ 
              marginBottom: '1.5rem', 
              color: 'var(--primary)', 
              fontSize: '0.875rem', 
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
            
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {catalog.name}
            </h1>
            {catalog.description && (
              <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
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
            <section key={group.family.id} style={{ marginBottom: '4rem' }} className={`fade-in-up delay-${index % 3 + 1}`}>
              {/* Sticky Header */}
              <div style={{ 
                position: 'sticky', 
                top: '70px', 
                zIndex: 90, 
                background: 'rgba(248, 250, 252, 0.85)', 
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{group.family.name}</h2>
                  <span className="badge" style={{ fontSize: '0.8rem' }}>
                    {group.products.length} {dict.home.products}
                  </span>
                </div>
                <Link href={`/${lang}/${catalog.slug}/${group.family.slug}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  {dict.catalog.viewAll} →
                </Link>
              </div>
              
              {/* Image Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '1.5rem'
              }}>
                {group.products.slice(0, 8).map((product: any) => {
                  const primaryImage = product.images[0];
                  return (
                    <Link key={product.id} href={`/${lang}/product/${encodeURIComponent(product.reference)}`}>
                      <div className="glass-card hover-lift" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '300px', background: 'var(--border-color)', position: 'relative' }}>
                          {primaryImage ? (
                            <SmartImage 
                              src={primaryImage.mediumUrl || primaryImage.thumbnailUrl} 
                              alt={product.reference} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              wrapperStyle={{ width: '100%', height: '100%' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                              No Image
                            </div>
                          )}
                        </div>
                        
                        <div style={{ padding: '1rem', background: 'var(--surface)' }}>
                          <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', fontWeight: 600 }}>{product.reference}</h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {product.details || "View details"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {group.products.length > 8 && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
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
