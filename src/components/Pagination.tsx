import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  dict: any;
  lang?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  dict,
  lang = 'fr',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const isRtl = lang === 'ar';
  const prevSymbol = isRtl ? '→' : '←';
  const nextSymbol = isRtl ? '←' : '→';

  // Helper to build page URL
  const getPageUrl = (page: number) => {
    if (page === 1) return basePath;
    const separator = basePath.includes('?') ? '&' : '?';
    return `${basePath}${separator}page=${page}`;
  };

  // Generate page numbers with smart ellipsis (e.g., 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push('ellipsis-start');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('ellipsis-end');

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '3rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="btn btn-outline"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span>{prevSymbol}</span>
          <span>{dict?.pagination?.previous || 'Previous'}</span>
        </Link>
      ) : (
        <span
          className="btn btn-outline"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            opacity: 0.4,
            cursor: 'not-allowed',
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <span>{prevSymbol}</span>
          <span>{dict?.pagination?.previous || 'Previous'}</span>
        </span>
      )}

      {/* Page Numbers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {pageNumbers.map((p, idx) => {
          if (typeof p === 'string') {
            return (
              <span
                key={`ellipsis-${idx}`}
                style={{
                  padding: '0.5rem 0.75rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                }}
              >
                ...
              </span>
            );
          }

          const isCurrent = p === currentPage;
          return isCurrent ? (
            <span
              key={p}
              style={{
                width: '40px',
                height: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-full)',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
              }}
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={getPageUrl(p)}
              style={{
                width: '40px',
                height: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-full)',
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.875rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
              }}
            >
              {p}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="btn btn-outline"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span>{dict?.pagination?.next || 'Next'}</span>
          <span>{nextSymbol}</span>
        </Link>
      ) : (
        <span
          className="btn btn-outline"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            opacity: 0.4,
            cursor: 'not-allowed',
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <span>{dict?.pagination?.next || 'Next'}</span>
          <span>{nextSymbol}</span>
        </span>
      )}
    </nav>
  );
}
