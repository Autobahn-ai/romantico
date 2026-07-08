import { NextResponse } from 'next/server';
import { validateEnv } from '@/lib/env';

/**
 * GET /api/health
 * Used by Vercel health checks and monitoring services.
 * Returns env validation status (without exposing values).
 */
export async function GET() {
  const { valid, errors } = validateEnv();

  if (!valid) {
    // Log server-side but don't expose var names/values publicly
    console.error('[Health] Config errors:', errors);
    return NextResponse.json(
      { status: 'degraded', message: 'Configuration issues detected. Check server logs.' },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
