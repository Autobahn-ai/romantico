import type { NextConfig } from "next";

function getSupabaseHostname(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  try {
    return new URL(raw).hostname;
  } catch {
    return '*.supabase.co';
  }
}
const supabaseUrl = getSupabaseHostname();

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com;
  connect-src 'self' https://${supabaseUrl} https://*.supabase.co wss://*.supabase.co https://apis.google.com https://www.googleapis.com;
  frame-src https://accounts.google.com https://docs.google.com https://drive.google.com;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\n/g, ' ').trim();

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Control referrer info sent with requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Prevent XSS
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Permissions policy — disable unused browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()',
  },
  // Force HTTPS (enabled in production by Vercel, included for completeness)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Content Security Policy
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  // Prevent exposing Next.js version in response headers
  poweredByHeader: false,
};

export default nextConfig;
