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

  // Check for active session token
  const sessionToken = req.cookies.get('nexus_session_token')?.value || req.cookies.get('__session')?.value;

  let hasValidSession = false;

  // 1. Valid verified session token (JWT structure check)
  if (sessionToken && sessionToken.length > 20 && sessionToken.split('.').length >= 2) {
    hasValidSession = true;
  }

  if (!hasValidSession) {
    const loginUrl = new URL('/login', req.url);
    // Sanitize redirect target to ensure it is a safe relative pathname
    const safeRedirect = pathname.startsWith('/') && !pathname.startsWith('//') ? pathname : '/overview';
    loginUrl.searchParams.set('redirect', safeRedirect);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|css|js)).*)',
  ],
};
