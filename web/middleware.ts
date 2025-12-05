import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for auth token in cookies or headers
  // For Firebase Auth, we'll need to verify the token on the server
  // In a real implementation, we would verify the Firebase ID token
  // Here we'll use a simplified approach checking for a session-like cookie
  
  const token = request.cookies.get('auth_token'); // This would be the Firebase ID token in reality
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isProtectedPage = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/patients') ||
    request.nextUrl.pathname.startsWith('/prescriptions') ||
    request.nextUrl.pathname.startsWith('/inventory');

  // If user is not authenticated and is trying to access a protected page
  if (!token && isProtectedPage) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and is on the login page, redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow the request to proceed
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