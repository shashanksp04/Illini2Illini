import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Supabase client for use in Server Components and Route Handlers.
 * Uses cookies for session; use service role only where needed (e.g. admin operations).
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.nextPublicSupabaseUrl,
    env.nextPublicSupabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Component context (e.g. during render)
          }
        },
      },
    }
  );
}

/**
 * Server-only Supabase client with service role (bypass RLS).
 * Use only for trusted server operations (e.g. auth callbacks, admin, cron).
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    env.nextPublicSupabaseUrl,
    env.supabaseServiceRoleKey,
    { auth: { persistSession: false } }
  );
}
