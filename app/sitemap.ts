import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://illini2illini.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  let listings: Array<{ id: string; alias: string | null; updated_at: Date }> = [];
  try {
    listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, alias: true, updated_at: true },
      orderBy: { updated_at: "desc" },
      take: 5000,
    });
  } catch {
    // During build with placeholder DB or transient outage, fall back to static entries only.
    listings = [];
  }

  return [
    {
      url: `${APP_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/listings`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    ...listings.map((l) => ({
      url: `${APP_URL}${l.alias ? `/v/${l.alias}` : `/listings/${l.id}`}`,
      lastModified: l.updated_at,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
