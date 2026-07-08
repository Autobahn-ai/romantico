import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from './lib/rate-limit';

/**
 * Next.js Middleware — runs on the Edge before every matched request.
 *
 * Responsibilities:
 * 1. Rate limiting on API routes
 * 2. Block obviously malicious request patterns
 * 3. Add security headers (additional — next.config.ts has the main ones)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limiting on API routes ──────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request.headers);

    // Stricter limit for auth-adjacent routes
    const isAuthRoute = pathname.includes('/auth') || pathname.includes('/billing');
    const config = isAuthRoute
      ? { limit: 20, windowMs: 60_000 }   // 20 req/min for auth
      : { limit: 120, windowMs: 60_000 };  // 120 req/min for regular API

    const result = rateLimit(`${ip}:${pathname}`, config);

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please slow down.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetAt),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(config.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetAt));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
