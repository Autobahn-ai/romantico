/**
 * Environment variable validation.
 * Called at app startup to fail fast with a clear error if required vars are missing.
 * Never logs the values of secret variables.
 */

interface EnvVar {
  name: string;
  required: boolean;
  serverOnly: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    serverOnly: false,
    description: 'Supabase project URL (Settings → API)',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    serverOnly: false,
    description: 'Supabase anon/public key (Settings → API)',
  },
  {
    name: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    required: false,
    serverOnly: false,
    description: 'Google OAuth client ID (required for Drive Picker)',
  },
];

export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];
    if (!value && envVar.required) {
      errors.push(`Missing required env var: ${envVar.name} — ${envVar.description}`);
    }
    if (value && !envVar.serverOnly && value.includes('your_')) {
      errors.push(
        `Env var ${envVar.name} still has placeholder value. Replace with your actual value.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Call this in server startup code. Throws if critical env vars are missing. */
export function assertEnv(): void {
  const { valid, errors } = validateEnv();
  if (!valid) {
    console.error('\n[MailDraft] ❌ Environment configuration errors:');
    errors.forEach(e => console.error(`  • ${e}`));
    console.error('\nUpdate your .env.local file and restart the server.\n');
    // In production, throw to prevent startup with broken config
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration. See logs for details.');
    }
  }
}
