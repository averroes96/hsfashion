'use client';
import Link from 'next/link';

interface CategoryPillSliderProps {
  families: Array<{ id: string; name: string; slug: string; _count?: { products: number } | number }>;
  currentSlug?: string;
  catalogSlug: string;
  lang: string;
  allLabel?: string;
}

export default function CategoryPillSlider({
  families,
  currentSlug,
  catalogSlug,
  lang,
  allLabel = 'All',
}: CategoryPillSliderProps) {
  const isAll = !currentSlug;

  const scrollToFamily = (e: React.MouseEvent<HTMLAnchorElement>, familyId: string) => {
    // If we are already on the catalog page with sections, smooth scroll to the section
    const targetElement = document.getElementById(`family-${familyId}`);
    if (targetElement) {
      e.preventDefault();
      const headerOffset = 110;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="category-pill-slider" role="tablist" aria-label="Catégories">
      {/* "All" Pill */}
      <Link
        href={`/${lang}/${catalogSlug}`}
        className={`category-pill ${isAll ? 'active' : ''}`}
        role="tab"
        aria-selected={isAll}
      >
        <span>✨</span>
        <span>{allLabel}</span>
      </Link>

      {/* Each Family Pill */}
      {families.map((family) => {
        const isActive = currentSlug === family.slug;
        return (
          <Link
            key={family.id}
            href={`/${lang}/${catalogSlug}/${family.slug}`}
            onClick={(e) => scrollToFamily(e, family.id)}
            className={`category-pill ${isActive ? 'active' : ''}`}
            role="tab"
            aria-selected={isActive}
          >
            <span>{family.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
