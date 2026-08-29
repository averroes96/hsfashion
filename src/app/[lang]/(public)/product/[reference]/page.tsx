import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ImageGallery from './ImageGallery';
import WhatsAppButton from './WhatsAppButton';
import { getDictionary, Locale } from '@/lib/dictionaries';
import ProductTracker from '@/components/ProductTracker';
import PublicHeader from '@/components/PublicHeader';
import SimilarProductsCarousel from '@/components/SimilarProductsCarousel';
import AddToCartButton from '@/components/AddToCartButton';
import CartonSizeBreakdown from '@/components/CartonSizeBreakdown';
import FavoriteButton from '@/components/FavoriteButton';

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

  const displayFamilyName = lang === 'ar' && product.family.arabicName ? product.family.arabicName : product.family.name;

  const hasCustomDescription = Boolean(product.description && product.description.trim());
  const hasCustomDetails = Boolean(product.details && product.details.trim());
  const isDetailsDuplicate = hasCustomDescription && product.details?.trim() === product.description?.trim();
  const showLeadDetails = hasCustomDetails && hasCustomDescription && !isDetailsDuplicate;

  const mainDescriptionText = hasCustomDescription
    ? product.description
    : hasCustomDetails
    ? product.details
    : (dict?.product?.defaultDesc
        ? dict.product.defaultDesc.replace('{family}', displayFamilyName)
        : (lang === 'ar'
            ? `موديل متقن الصنع من تشكيلة ${displayFamilyName}، يجمع بين الراحة والأناقة والجودة العالية لتلبية احتياجات زبائن متجرك.`
            : `Modèle de confection soignée issu de notre collection ${displayFamilyName}, alliant confort, élégance et finitions haut de gamme pour votre boutique.`));

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
                <Link href={`/${lang}/${firstCatalog.slug}/${product.family.slug}`} style={{ color: 'var(--primary)' }}>{displayFamilyName}</Link>
                <span>/</span>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--primary)' }}>{displayFamilyName}</span>
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
                  {displayFamilyName}
                </div>
              </div>
              
              {showLeadDetails && (
                <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {product.details}
                  </p>
                </div>
              )}
              
              {/* Product Description & Wholesale Specifications */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: 700, 
                  marginBottom: '0.65rem', 
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
                  fontSize: '0.92rem',
                  background: 'var(--bg-color)',
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '0.75rem'
                }}>
                  {mainDescriptionText}
                </div>

                {/* Wholesale Specifications Bar */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.6rem',
                  background: 'var(--bg-color)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                      📁 {dict?.product?.category || (lang === 'ar' ? 'الفئة' : 'Catégorie')}
                    </span>
                    <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                      {displayFamilyName}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                      📦 {dict?.product?.packaging || (lang === 'ar' ? 'التعبئة' : 'Conditionnement')}
                    </span>
                    <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                      {dict?.product?.packagingVal || (lang === 'ar' ? 'كرتونة قياسية' : 'Par Carton')}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                      ✨ {dict?.product?.availability || (lang === 'ar' ? 'التوفر' : 'Disponibilité')}
                    </span>
                    <strong style={{ color: '#16a34a', fontWeight: 700 }}>
                      {dict?.product?.inStock || (lang === 'ar' ? 'متوفر بالجملة' : 'En stock')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Wholesale Carton Size Assortment Breakdown (Only shown if configured by admin) */}
              <CartonSizeBreakdown 
                lang={lang} 
                dict={dict} 
                assortment={product.sizeAssortment as any}
                initialCartons={1} 
              />

              {/* Carton Order Action */}
              <AddToCartButton
                product={{
                  id: product.id,
                  reference: product.reference,
                  familyName: lang === 'ar' && product.family.arabicName ? product.family.arabicName : product.family.name,
                  imageUrl: product.images[0]?.thumbnailUrl || product.images[0]?.mediumUrl,
                }}
                dict={dict}
                lang={lang}
              />

              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
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

                <FavoriteButton
                  product={{
                    id: product.id,
                    reference: product.reference,
                    familyName: displayFamilyName,
                    imageUrl: product.images[0]?.thumbnailUrl || product.images[0]?.mediumUrl,
                  }}
                  variant="inline"
                  size="lg"
                />
              </div>
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
