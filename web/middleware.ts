import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For Firebase client-side auth, we can't reliably check auth state in middleware
  // since Firebase uses localStorage/sessionStorage which isn't accessible server-side
  // We'll rely on client-side route protection instead

  // Allow all requests to proceed
  // Auth protection will be handled by the AuthProvider and client-side redirects
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};