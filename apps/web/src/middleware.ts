import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/invite'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check for access token in cookies (set by the client after login)
  // Note: for a production app you'd also validate the JWT here.
  // For now, we check the cookie as a lightweight gate; the API enforces real auth.
  const token = request.cookies.get('accessToken')?.value;

  if (!token) {
    // Check org pages — redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
