import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ar', 'fr'];
const defaultLocale = 'ar';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and api routes for locale redirection
  const isApiOrStatic = pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.');
  
  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale and it's a page route, redirect to default locale
  if (!pathnameHasLocale && !isApiOrStatic) {
    request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // Auth Protection
  const isAdminPage = locales.some(locale => pathname.startsWith(`/${locale}/admin`));
  const isApiAdmin = pathname.startsWith('/api/admin');

  if (isAdminPage || isApiAdmin) {
    // Skip login and auth api
    const isLoginPage = locales.some(locale => pathname === `/${locale}/admin/login`);
    if (isLoginPage || pathname === '/api/admin/auth') {
      return NextResponse.next();
    }

    const authCookie = request.cookies.get('admin_auth');
    if (!authCookie || authCookie.value !== process.env.ADMIN_PASSWORD) {
      if (isApiAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Redirect to login preserving the locale
      const locale = locales.find(l => pathname.startsWith(`/${l}/`)) || defaultLocale;
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next).*)'],
};
