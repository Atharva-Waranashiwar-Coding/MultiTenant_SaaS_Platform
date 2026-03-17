import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth tokens are stored in localStorage (inaccessible in middleware).
// The dashboard layout handles client-side auth guards.
// This middleware only handles the root redirect.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
