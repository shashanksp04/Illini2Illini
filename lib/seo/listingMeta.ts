/**
 * Shared SEO helpers for listing detail pages.
 *
 * Used by:
 * - generateMetadata in listings/[id], v/[alias], community/[id]
 * - components/seo/ListingJsonLd.tsx
 * - app/listings/[id]/opengraph-image.tsx and app/v/[alias]/opengraph-image.tsx
 */

export type ListingMetaInput = {
  title?: string | null;
  monthly_rent?: number | null;
  nearby_landmark?: string | null;
  description?: string | null;
  lease_type?: string | null;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  total_bedrooms?: number | null;
  total_bathrooms?: number | null;
  room_type?: string | null;
};

const SITE_NAME = "Illini2Illini";

function formatShortDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function leaseTypeLabel(lt: string | null | undefined): string {
  if (lt === "SUBLEASE") return "Sublease";
  if (lt === "LEASE_TAKEOVER") return "Lease takeover";
  return "Listing";
}

export function formatListingTitle(l: ListingMetaInput): string {
  const title = l.title?.trim() || "UIUC housing listing";
  const rent = typeof l.monthly_rent === "number" ? `$${l.monthly_rent}/mo` : null;
  const landmark = l.nearby_landmark?.trim() || null;

  const parts: string[] = [title];
  const tail: string[] = [];
  if (rent) tail.push(rent);
  if (landmark) tail.push(`near ${landmark}`);
  if (tail.length) parts.push(tail.join(" "));

  return `${parts.join(" — ")} | ${SITE_NAME}`;
}

export function formatListingDescription(l: ListingMetaInput): string {
  if (l.description && l.description.trim().length > 0) {
    const trimmed = l.description.trim().replace(/\s+/g, " ");
    return trimmed.length > 155 ? `${trimmed.slice(0, 152)}…` : trimmed;
  }

  const segments: string[] = [];
  segments.push(leaseTypeLabel(l.lease_type));
  if (typeof l.total_bedrooms === "number" || typeof l.total_bathrooms === "number") {
    const beds = l.total_bedrooms ?? "?";
    const baths = l.total_bathrooms ?? "?";
    segments.push(`${beds}B/${baths}Ba`);
  }
  if (l.room_type === "PRIVATE_ROOM") segments.push("private room");
  else if (l.room_type === "ENTIRE_UNIT") segments.push("entire unit");
  if (typeof l.monthly_rent === "number") segments.push(`$${l.monthly_rent}/mo`);
  if (l.nearby_landmark) segments.push(`near ${l.nearby_landmark}`);

  const range = [formatShortDate(l.start_date), formatShortDate(l.end_date)].filter(Boolean).join(" – ");
  if (range) segments.push(range);

  segments.push("UIUC verified student listing on Illini2Illini.");
  const desc = segments.join(" · ").replace(/\s*·\s*UIUC/, ". UIUC");
  return desc.length > 155 ? `${desc.slice(0, 152)}…` : desc;
}
