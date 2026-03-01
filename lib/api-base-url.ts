import { headers } from "next/headers";

/**
 * Returns the request origin for server-side fetch to the same host (e.g. GET /api/listings).
 */
export async function getApiBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}
