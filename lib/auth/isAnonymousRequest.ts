import { cookies } from "next/headers";

/**
 * Returns true when the incoming request has no Supabase auth cookie.
 *
 * Used by public, indexable pages to opt into ISR-style fetch caching
 * (`revalidate: 60`) for anonymous traffic — including search-engine
 * crawlers — while still hitting `cache: "no-store"` for logged-in users
 * so per-user state never gets cached.
 */
export async function isAnonymousRequest(): Promise<boolean> {
  const c = await cookies();
  return !c.getAll().some(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"),
  );
}
