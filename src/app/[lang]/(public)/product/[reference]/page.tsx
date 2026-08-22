import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ImageGallery from './ImageGallery';
import WhatsAppButton from './WhatsAppButton';
import { getDictionary, Locale } from '@/lib/dictionaries';
import ProductTracker from '@/components/ProductTracker';
import PublicHeader from '@/components/PublicHeader';
import SimilarProductsCarousel from '@/components/SimilarProductsCarousel';

export default async function ProductPage({ params }: { params: Promise<{ reference: string, lang: string }> }) {
  const { reference, lang } = await params;
  const decodedReference = decodeURIComponent(reference);
  const dict = await getDictionary(lang as Locale);
  
  const product = await prisma.product.findUnique({
    where: { reference: decodedReference },
    include: {
      family: true,
      catalogs: true,
      images: { orderBy: { sortOrder: 'asc' } }
    }
  });

  const settings = await prisma.storeSettings.findUnique({
    where: { id: 'default' }
  });

  if (!product || !product.isActive) notFound();

  const firstCatalog = product.catalogs[0];

  return (
    <>
      <div className="blob-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <ProductTracker productId={product.id} />

      <PublicHeader lang={lang} dict={dict} />
      
      <main className="fade-in">
        <div className="container" style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
          <nav className="breadcrumb-nav">
            <Link href={`/${lang}`} style={{ color: 'var(--primary)' }}>{dict.nav.collections}</Link>
            <span>/</span>
            {firstCatalog ? (
              <>
                <Link href={`/${lang}/${firstCatalog.slug}`} style={{ color: 'var(--primary)' }}>{firstCatalog.name}</Link>
                <span>/</span>
                <Link href={`/${lang}/${firstCatalog.slug}/${product.family.slug}`} style={{ color: 'var(--primary)' }}>{product.family.name}</Link>
                <span>/</span>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--primary)' }}>{product.family.name}</span>
                <span>/</span>
              </>
            )}
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{product.reference}</span>
          </nav>
          
          <div className="product-detail-layout">
            {/* Image Gallery */}
            <ImageGallery images={product.images} />

            {/* Product Details Card */}
            <div className="glass-card fade-in delay-1" style={{ padding: 'clamp(1.25rem, 3vw, 2.5rem)', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.2, margin: 0, fontWeight: 800 }}>
                  {product.reference}
                </h1>
                <div className="badge" style={{ marginTop: '0.25rem' }}>
                  {product.family.name}
                </div>
              </div>
              
              {product.details && (
                <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.125rem)', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {product.details}
                  </p>
                </div>
              )}
              
              {product.description && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 700, 
                    marginBottom: '0.75rem', 
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>info</span>
                    {dict.product.description}
                  </h3>
                  <div style={{ 
                    color: 'var(--text-muted)', 
                    whiteSpace: 'pre-line', 
                    lineHeight: 1.7,
                    fontSize: '0.95rem',
                    background: 'var(--bg-color)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    {product.description}
                  </div>
                </div>
              )}

              {settings?.phoneNumber ? (
                <WhatsAppButton 
                  phoneNumber={settings.phoneNumber} 
                  inquireText={dict.product.inquire} 
                  reference={product.reference} 
                />
              ) : (
                <button className="btn btn-primary" style={{ width: '100%', padding: '0.9rem 1.5rem', fontSize: '1.05rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>chat</span>
                  {dict.product.inquire}
                </button>
              )}
            </div>
          </div>

          {/* AI Recommended Similar Styles Carousel */}
          <SimilarProductsCarousel
            currentReference={product.reference}
            lang={lang}
            dict={dict}
          />
        </div>
      </main>
    </>
  );
}
