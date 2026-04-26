import { Prisma, type RedditListing as RedditListingRow, type Season } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type RedditListingMinimalRow = {
  id: string;
  title: string;
  monthly_rent: number | null;
  total_bedrooms: number | null;
  seasons: Season[];
  image_urls: string[];
};

function thumbnailFromRow(row: { image_urls: string[] }): string | null {
  const first = row.image_urls[0];
  return typeof first === "string" && first.length > 0 ? first : null;
}

export type RedditListingMinimal = {
  id: string;
  title: string;
  monthly_rent: number | null;
  total_bedrooms: number | null;
  seasons: Season[];
  /** First image URL for card preview; null if none. */
  thumbnail_url: string | null;
};

export type RedditListingPublicDetail = RedditListingMinimal;

export type RedditListingVerifiedDetail = {
  id: string;
  external_id: string;
  source: string;
  title: string;
  description: string;
  monthly_rent: number | null;
  lease_type: string | null;
  start_date: string | null;
  end_date: string | null;
  room_type: string | null;
  furnished: boolean | null;
  utilities_included: boolean | null;
  open_to_negotiation: boolean | null;
  gender_preference: string | null;
  nearby_landmark: string | null;
  total_bedrooms: number | null;
  total_bathrooms: number | null;
  exact_address: string | null;
  external_url: string;
  source_created_at: string;
  raw_text: string | null;
  seasons: Season[];
  /** All Reddit image URLs in order (may be empty). */
  images: string[];
};

function mapMinimal(row: RedditListingRow & { seasons?: Season[] }): RedditListingMinimal {
  return {
    id: row.id,
    title: row.title,
    monthly_rent: row.monthly_rent,
    total_bedrooms: row.total_bedrooms,
    seasons: row.seasons ?? [],
    thumbnail_url: thumbnailFromRow(row),
  };
}

function dateToIsoDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

export function mapRedditListingVerified(row: RedditListingRow): RedditListingVerifiedDetail {
  const seasons = (row as RedditListingRow & { seasons?: Season[] }).seasons ?? [];
  return {
    id: row.id,
    external_id: row.external_id,
    source: row.source,
    title: row.title,
    description: row.description,
    monthly_rent: row.monthly_rent,
    lease_type: row.lease_type,
    start_date: dateToIsoDate(row.start_date),
    end_date: dateToIsoDate(row.end_date),
    room_type: row.room_type,
    furnished: row.furnished,
    utilities_included: row.utilities_included,
    open_to_negotiation: row.open_to_negotiation,
    gender_preference: row.gender_preference,
    nearby_landmark: row.nearby_landmark,
    total_bedrooms: row.total_bedrooms,
    total_bathrooms: row.total_bathrooms,
    exact_address: row.exact_address,
    external_url: row.external_url,
    source_created_at: row.source_created_at.toISOString(),
    raw_text: row.raw_text,
    seasons,
    images: [...row.image_urls],
  };
}

const activeWhere = { exclude: false as const };

export type RedditListingsMinimalFilters = {
  min_rent?: number;
  max_rent?: number;
  /** Same semantics as verified listings: 5 means five or more bedrooms. */
  total_bedrooms?: number;
  seasons?: Season[];
};

function buildRedditListingsWhereAndSort(filters: RedditListingsMinimalFilters): {
  whereExtra: Prisma.Sql;
  sortTier: Prisma.Sql;
} {
  const minRent = filters.min_rent;
  const maxRent = filters.max_rent;
  const bedN = filters.total_bedrooms;
  const seasons = filters.seasons;

  const rentFilterOn = typeof minRent === "number" || typeof maxRent === "number";
  const bedFilterOn = typeof bedN === "number";
  const seasonFilterOn = Array.isArray(seasons) && seasons.length > 0;
  const seasonArraySql =
    seasonFilterOn && seasons
      ? Prisma.sql`ARRAY[${Prisma.join(seasons.map((season) => Prisma.sql`${season}::"Season"`))}]::"Season"[]`
      : Prisma.sql`ARRAY[]::"Season"[]`;

  const rentRangeInner =
    typeof minRent === "number" && typeof maxRent === "number"
      ? Prisma.sql`monthly_rent >= ${minRent} AND monthly_rent <= ${maxRent}`
      : typeof minRent === "number"
        ? Prisma.sql`monthly_rent >= ${minRent}`
        : typeof maxRent === "number"
          ? Prisma.sql`monthly_rent <= ${maxRent}`
          : Prisma.sql`TRUE`;

  const rentWhereExtra = rentFilterOn
    ? Prisma.sql`AND (monthly_rent IS NULL OR (${rentRangeInner}))`
    : Prisma.empty;

  const bedWhereExtra =
    bedFilterOn && typeof bedN === "number"
      ? bedN >= 5
        ? Prisma.sql`AND (total_bedrooms IS NULL OR total_bedrooms >= 5)`
        : Prisma.sql`AND (total_bedrooms IS NULL OR total_bedrooms = ${bedN})`
      : Prisma.empty;

  const seasonWhereExtra = seasonFilterOn
    ? Prisma.sql`AND (cardinality(seasons) = 0 OR seasons && ${seasonArraySql})`
    : Prisma.empty;

  const rentComplete =
    rentFilterOn && typeof minRent === "number" && typeof maxRent === "number"
      ? Prisma.sql`(monthly_rent IS NOT NULL AND monthly_rent >= ${minRent} AND monthly_rent <= ${maxRent})`
      : rentFilterOn && typeof minRent === "number"
        ? Prisma.sql`(monthly_rent IS NOT NULL AND monthly_rent >= ${minRent})`
        : rentFilterOn && typeof maxRent === "number"
          ? Prisma.sql`(monthly_rent IS NOT NULL AND monthly_rent <= ${maxRent})`
          : Prisma.sql`TRUE`;

  const bedComplete =
    bedFilterOn && typeof bedN === "number"
      ? bedN >= 5
        ? Prisma.sql`(total_bedrooms IS NOT NULL AND total_bedrooms >= 5)`
        : Prisma.sql`(total_bedrooms IS NOT NULL AND total_bedrooms = ${bedN})`
      : Prisma.sql`TRUE`;

  const seasonComplete = seasonFilterOn
    ? Prisma.sql`(cardinality(seasons) > 0 AND seasons && ${seasonArraySql})`
    : Prisma.sql`TRUE`;

  const sortTier = Prisma.sql`CASE WHEN (${rentComplete}) AND (${bedComplete}) AND (${seasonComplete}) THEN 0 ELSE 1 END`;

  return {
    whereExtra: Prisma.sql`${rentWhereExtra} ${bedWhereExtra} ${seasonWhereExtra}`,
    sortTier,
  };
}

export async function getRedditListingsMinimal(
  options: {
    page: number;
    /** Items per page (helper fetches pageSize + 1 to detect has_more). */
    pageSize: number;
  } & RedditListingsMinimalFilters
): Promise<RedditListingMinimal[]> {
  const page = options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize > 0 ? Math.min(options.pageSize, 100) : 20;
  const skip = (page - 1) * pageSize;

  const { min_rent, max_rent, total_bedrooms } = options;
  const { seasons } = options;
  const { whereExtra, sortTier } = buildRedditListingsWhereAndSort({
    min_rent,
    max_rent,
    total_bedrooms,
    seasons,
  });

  const rows = await prisma.$queryRaw<RedditListingMinimalRow[]>(Prisma.sql`
    SELECT id, title, monthly_rent, total_bedrooms, seasons, image_urls
    FROM reddit_listings
    WHERE exclude = false
    ${whereExtra}
    ORDER BY ${sortTier} ASC,
      (cardinality(image_urls) > 0) DESC,
      source_created_at DESC
    LIMIT ${pageSize + 1}
    OFFSET ${skip}
  `);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    monthly_rent: r.monthly_rent,
    total_bedrooms: r.total_bedrooms,
    seasons: r.seasons,
    thumbnail_url: thumbnailFromRow(r),
  }));
}

export async function getRedditListingPublic(id: string): Promise<RedditListingPublicDetail | null> {
  const row = await prisma.redditListing.findFirst({
    where: { id, ...activeWhere },
  });
  if (!row) return null;
  return mapMinimal(row);
}

export async function getRedditListingVerified(id: string): Promise<RedditListingVerifiedDetail | null> {
  const row = await prisma.redditListing.findFirst({
    where: { id, ...activeWhere },
  });
  if (!row) return null;
  return mapRedditListingVerified(row);
}
