import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/welcome',
  '/workspace',
  '/role',
  '/environment',
  '/alert-rules',
  '/import-data',
  '/quick-tour',
  '/complete',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/features',
  '/status',
  '/driver-pass',
  '/driver',
  '/contact',
  '/faq',
  '/feedback',
  '/health',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static files and internal Next.js requests bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  ) {
    return NextResponse.next();
  }

  // Check for active session cookie
  // Valid session cookies: standard clerk/auth jwt token or authenticated session/demo cookie
  const sessionToken = req.cookies.get('nexus_session_token')?.value || req.cookies.get('__session')?.value;
  const demoCookie = req.cookies.get('nexus_demo_session')?.value;

  let hasValidSession = false;

  // 1. Session token
  if (sessionToken && sessionToken.length > 10) {
    hasValidSession = true;
  }

  // 2. Authenticated user session cookie
  if (demoCookie && demoCookie.trim().length > 0) {
    hasValidSession = true;
  }

  if (!hasValidSession) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|css|js)).*)',
  ],
};
