/**
 * Server-side env validation. Fail fast if required vars are missing.
 * Import this once at app root (e.g. layout.tsx) so the app never starts with invalid config.
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
] as const;

function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Check .env.local.`
    );
  }
}

validateEnv();

export const env = {
  nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  databaseUrl: process.env.DATABASE_URL!,
  cronSecret: process.env.CRON_SECRET ?? "",
} as const;
