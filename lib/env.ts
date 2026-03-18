/**
 * Server-side env validation. Fail fast if required vars are missing.
 * Import this once at app root (e.g. layout.tsx) so the app never starts with invalid config.
 * During next build, validation is skipped and placeholders are used so the build can complete.
 */

import { PHASE_PRODUCTION_BUILD } from "next/constants";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
] as const;

const isBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length === 0) return;
  if (isBuild) return; // Allow build to proceed; runtime will fail if still missing
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}. Check .env.local.`
  );
}

validateEnv();

const dbPlaceholder = "postgresql://build:build@localhost:5432/build";
const supabasePlaceholder = "https://placeholder.supabase.co";

export const env = {
  nextPublicSupabaseUrl:
    (isBuild && !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())
      ? supabasePlaceholder
      : process.env.NEXT_PUBLIC_SUPABASE_URL!,
  nextPublicSupabaseAnonKey:
    (isBuild && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
      ? "placeholder-anon-key"
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey:
    (isBuild && !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
      ? "placeholder-service-role-key"
      : process.env.SUPABASE_SERVICE_ROLE_KEY!,
  databaseUrl:
    isBuild && !process.env.DATABASE_URL?.trim()
      ? dbPlaceholder
      : process.env.DATABASE_URL!,
  cronSecret: process.env.CRON_SECRET ?? "",
  /** Optional. When set, auth redirects (e.g. forgot password) use this URL. Use for production. */
  appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || undefined,
} as const;
