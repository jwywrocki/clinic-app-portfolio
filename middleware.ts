import { type NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

const rateLimitEntries = new Map<string, { count: number; resetAt: number }>();
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const CONTACT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_CONTACT_ATTEMPTS = 5;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function getRateLimitRetryAfter(
  scope: 'login' | 'contact',
  ip: string,
  maxAttempts: number,
  windowMs: number
): number | null {
  const now = Date.now();
  const key = `${scope}:${ip}`;
  const entry = rateLimitEntries.get(key);

  if (rateLimitEntries.size > 1000) {
    for (const [entryKey, value] of rateLimitEntries) {
      if (now > value.resetAt) rateLimitEntries.delete(entryKey);
    }
  }

  if (!entry || now > entry.resetAt) {
    rateLimitEntries.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= maxAttempts) {
    return Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  }
  entry.count++;
  return null;
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const isDev = process.env.NODE_ENV === 'development';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self'",
    'frame-src https://www.google.com/maps/ https://maps.google.com/',
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export default auth(function middleware(request) {
  const { pathname } = request.nextUrl;

  // Rate limit login
  if (pathname === '/api/auth' && request.method === 'POST') {
    const ip = getClientIp(request);
    const retryAfter = getRateLimitRetryAfter(
      'login',
      ip,
      MAX_LOGIN_ATTEMPTS,
      LOGIN_RATE_LIMIT_WINDOW_MS
    );
    if (retryAfter) {
      const response = NextResponse.json(
        { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' },
        { status: 429 }
      );
      response.headers.set('Retry-After', retryAfter.toString());
      return applySecurityHeaders(response);
    }
  }

  // Rate limit contact form
  if (pathname === '/api/contact/send' && request.method === 'POST') {
    const ip = getClientIp(request);
    const retryAfter = getRateLimitRetryAfter(
      'contact',
      ip,
      MAX_CONTACT_ATTEMPTS,
      CONTACT_RATE_LIMIT_WINDOW_MS
    );
    if (retryAfter) {
      const response = NextResponse.json(
        { error: 'Zbyt wiele wiadomości. Spróbuj ponownie później.' },
        { status: 429 }
      );
      response.headers.set('Retry-After', retryAfter.toString());
      return applySecurityHeaders(response);
    }
  }

  // Protect admin routes
  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isAdminApi = pathname.startsWith('/api/admin');
  const isWriteApiMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  const isProtectedApi =
    isWriteApiMethod &&
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth') &&
    !pathname.startsWith('/api/public') &&
    !pathname.startsWith('/api/contact/send');

  if (isAdminRoute || isAdminApi || isProtectedApi) {
    if (!request.auth?.user) {
      if (pathname.startsWith('/api/')) {
        const response = NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
        return applySecurityHeaders(response);
      }
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder images
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
