import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/** Standard error response — never leaks internal details */
export function errorResponse(
  message: string,
  status: number,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json({ error: message }, { status, headers });
}

export function unauthorizedResponse(): NextResponse {
  return errorResponse('Unauthorized', 401);
}

export function forbiddenResponse(reason = 'Forbidden'): NextResponse {
  return errorResponse(reason, 403);
}

export function notFoundResponse(resource = 'Resource'): NextResponse {
  return errorResponse(`${resource} not found`, 404);
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfterSecs = Math.ceil((resetAt - Date.now()) / 1000);
  return errorResponse('Too many requests. Please slow down.', 429, {
    'Retry-After': String(retryAfterSecs),
    'X-RateLimit-Reset': String(resetAt),
  });
}

export function validationErrorResponse(error: ZodError): NextResponse {
  const issues = error.issues.map(i => ({
    field: i.path.join('.'),
    message: i.message,
  }));
  return NextResponse.json({ error: 'Validation failed', issues }, { status: 422 });
}

/**
 * Internal server error — logs the real error server-side, returns a safe message to the client.
 * NEVER send raw DB errors or stack traces to the client.
 */
export function internalErrorResponse(err: unknown, context = 'Request'): NextResponse {
  // Log full error server-side only
  console.error(`[${context}] Internal error:`, err);
  return errorResponse('An internal error occurred. Please try again later.', 500);
}
