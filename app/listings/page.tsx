import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { PageContainer } from "@/components/layout/PageContainer";
import { CommunityFilterBar } from "@/components/listings/CommunityFilterBar";
import { FilterBar } from "@/components/listings/FilterBar";
import { ListingCard, type ListingCardItem } from "@/components/listings/ListingCard";
import { CommunityListingCard, type CommunityListingCardItem } from "@/components/listings/CommunityListingCard";
import { SearchBar } from "@/components/ui/SearchBar";

type SearchParams = { [key: string]: string | string[] | undefined };

function getParamValues(value: string | string[] | undefined): string[] {
  if (typeof value === "string") return value.trim() ? [value] : [];
  if (Array.isArray(value)) return value.map((entry) => entry.trim()).filter((entry) => entry !== "");
  return [];
}

function buildListingsUrl(base: string, params: SearchParams): string {
  const q = new URLSearchParams();
  const set = (key: string, value: string | undefined) => {
    if (value != null && String(value).trim() !== "") q.set(key, String(value).trim());
  };
  set("min_rent", typeof params.min_rent === "string" ? params.min_rent : undefined);
  set("max_rent", typeof params.max_rent === "string" ? params.max_rent : undefined);
  set("start_date", typeof params.start_date === "string" ? params.start_date : undefined);
  set("end_date", typeof params.end_date === "string" ? params.end_date : undefined);
  set("lease_type", typeof params.lease_type === "string" ? params.lease_type : undefined);
  set("room_type", typeof params.room_type === "string" ? params.room_type : undefined);
  set("total_bedrooms", typeof params.total_bedrooms === "string" ? params.total_bedrooms : undefined);
  set("total_bathrooms", typeof params.total_bathrooms === "string" ? params.total_bathrooms : undefined);
  set("keyword", typeof params.keyword === "string" ? params.keyword : undefined);
  set("sort", typeof params.sort === "string" ? params.sort : "newest");
  for (const season of getParamValues(params.season)) {
    q.append("season", season);
  }
  const furnished = typeof params.furnished === "string" ? params.furnished : undefined;
  if (furnished === "true" || furnished === "false") q.set("furnished", furnished);
  const util = typeof params.utilities_included === "string" ? params.utilities_included : undefined;
  if (util === "true" || util === "false") q.set("utilities_included", util);
  const includeTaken = typeof params.include_taken === "string" ? params.include_taken : undefined;
  if (includeTaken === "true") q.set("include_taken", "true");
  const page = typeof params.page === "string" ? params.page : "1";
  if (page !== "1") q.set("page", page);
  const query = q.toString();
  return `${base}/api/listings${query ? `?${query}` : ""}`;
}

function buildRedditListingsUrl(base: string, params: SearchParams): string {
  const q = new URLSearchParams();
  const set = (key: string, value: string | undefined) => {
    if (value != null && String(value).trim() !== "") q.set(key, String(value).trim());
  };
  set("min_rent", typeof params.min_rent === "string" ? params.min_rent : undefined);
  set("max_rent", typeof params.max_rent === "string" ? params.max_rent : undefined);
  set("total_bedrooms", typeof params.total_bedrooms === "string" ? params.total_bedrooms : undefined);
  for (const season of getParamValues(params.season)) {
    q.append("season", season);
  }
  const page = typeof params.page === "string" ? params.page : "1";
  if (page !== "1") q.set("page", page);
  const query = q.toString();
  return `${base}/api/reddit-listings${query ? `?${query}` : ""}`;
}

function hasCommunityListingFilters(params: SearchParams): boolean {
  const min = typeof params.min_rent === "string" && params.min_rent.trim() !== "";
  const max = typeof params.max_rent === "string" && params.max_rent.trim() !== "";
  const beds = typeof params.total_bedrooms === "string" && params.total_bedrooms.trim() !== "";
  const seasons = getParamValues(params.season).length > 0;
  return min || max || beds || seasons;
}

/** Preserve filter query params; set or clear `tab` for Community vs Verified. */
function listingsHrefWithTab(params: SearchParams, tab: "verified" | "community"): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (key === "tab") continue;
    if (typeof val === "string" && val !== "") {
      q.set(key, val);
      continue;
    }
    if (Array.isArray(val)) {
      for (const entry of val) {
        if (entry !== "") q.append(key, entry);
      }
    }
  }
  if (tab === "community") q.set("tab", "community");
  const qs = q.toString();
  if (!qs) return tab === "community" ? "/listings?tab=community" : "/listings";
  return `/listings?${qs}`;
}

/** Build `/listings` href with a specific page; preserves filters. Omits `page` when 1. */
function listingsHrefForPage(params: SearchParams, targetPage: number, tab: "verified" | "community"): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (key === "tab" || key === "page") continue;
    if (typeof val === "string" && val !== "") {
      q.set(key, val);
      continue;
    }
    if (Array.isArray(val)) {
      for (const entry of val) {
        if (entry !== "") q.append(key, entry);
      }
    }
  }
  if (targetPage > 1) q.set("page", String(targetPage));
  if (tab === "community") q.set("tab", "community");
  const qs = q.toString();
  if (!qs) return tab === "community" ? "/listings?tab=community" : "/listings";
  return `/listings?${qs}`;
}

function ListingsPagination({
  params,
  page,
  hasMore,
  tab,
}: {
  params: SearchParams;
  page: number;
  hasMore: boolean;
  tab: "verified" | "community";
}) {
  if (page <= 1 && !hasMore) return null;

  const linkClass =
    "inline-flex min-w-[5.5rem] items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 shadow-card transition-all hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-gray-200";
  const disabledClass =
    "inline-flex min-w-[5.5rem] cursor-not-allowed items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-300";

  const canPrev = page > 1;
  const canNext = hasMore;

  return (
    <nav className="flex flex-wrap items-center justify-center gap-4 pt-2" aria-label="Listing results pagination">
      {canPrev ? (
        <Link href={listingsHrefForPage(params, page - 1, tab)} className={linkClass}>
          Previous
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          Previous
        </span>
      )}
      <span className="text-sm tabular-nums text-gray-500">Page {page}</span>
      {canNext ? (
        <Link href={listingsHrefForPage(params, page + 1, tab)} className={linkClass}>
          Next
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          Next
        </span>
      )}
    </nav>
  );
}

function getFilterValues(params: SearchParams) {
  return {
    min_rent: typeof params.min_rent === "string" ? params.min_rent : "",
    max_rent: typeof params.max_rent === "string" ? params.max_rent : "",
    start_date: typeof params.start_date === "string" ? params.start_date : "",
    end_date: typeof params.end_date === "string" ? params.end_date : "",
    room_type: typeof params.room_type === "string" ? params.room_type : "",
    total_bedrooms: typeof params.total_bedrooms === "string" ? params.total_bedrooms : "",
    total_bathrooms: typeof params.total_bathrooms === "string" ? params.total_bathrooms : "",
    furnished: typeof params.furnished === "string" ? params.furnished : "",
    utilities_included: typeof params.utilities_included === "string" ? params.utilities_included : "",
    lease_type: typeof params.lease_type === "string" ? params.lease_type : "",
    sort: typeof params.sort === "string" ? params.sort : "newest",
    keyword: typeof params.keyword === "string" ? params.keyword : "",
    include_taken: typeof params.include_taken === "string" ? params.include_taken : "",
    season: getParamValues(params.season),
  };
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const base = await getApiBaseUrl();
  const isCommunityTab = params.tab === "community";

  let isAdmin = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { auth_user_id: data.user.id },
        select: { role: true },
      });
      isAdmin = user?.role === "ADMIN";
    }
  } catch {
    // Ignore; isAdmin stays false
  }

  let items: ListingCardItem[] = [];
  let communityItems: CommunityListingCardItem[] = [];
  let hasMore = false;
  let page = 1;
  let error: string | null = null;

  const url = isCommunityTab ? buildRedditListingsUrl(base, params) : buildListingsUrl(base, params);

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
    const res = await fetch(url, { cache: "no-store", headers: { Cookie: cookieHeader } });
    const json = await res.json();
    if (!res.ok) {
      error = json?.error?.message ?? "Failed to load listings.";
    } else if (json.ok && json.data) {
      if (isCommunityTab) {
        const rawItems: CommunityListingCardItem[] = json.data.items ?? [];
        communityItems = rawItems;
      } else {
        const rawItems: any[] = json.data.items ?? [];
        items = rawItems.map((item) => {
          const firstPhoto =
            Array.isArray(item.photos) && item.photos.length > 0 ? item.photos[0]?.image_url : undefined;
          return {
            ...item,
            image_url: firstPhoto ?? item.thumbnail_url ?? item.image_url ?? null,
            owner_profile_picture_url: item.owner_profile_picture_url ?? null,
          } as ListingCardItem;
        });
      }
      hasMore = json.data.has_more === true;
      page = Number(json.data.page) || 1;
    }
  } catch {
    error = "Failed to load listings.";
  }

  const filterValues = getFilterValues(params);
  const verifiedHref = listingsHrefWithTab(params, "verified");
  const communityHref = listingsHrefWithTab(params, "community");

  const listCount = isCommunityTab ? communityItems.length : items.length;

  return (
    <PageContainer>
      <div className="md:hidden">
        <Suspense fallback={<div className="h-10 w-full rounded-xl bg-gray-100 animate-pulse" />}>
          <SearchBar className="w-full" />
        </Suspense>
      </div>

      <div className="space-y-6 md:space-y-8">
        {!isCommunityTab ? <FilterBar values={filterValues} isAdmin={isAdmin} /> : null}

        {isCommunityTab ? (
          <CommunityFilterBar
            values={{
              min_rent: filterValues.min_rent,
              max_rent: filterValues.max_rent,
              total_bedrooms: filterValues.total_bedrooms,
              season: filterValues.season,
            }}
          />
        ) : null}

        <header className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-brand md:text-3xl">Browse listings</h1>

          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
            <Link
              href={verifiedHref}
              className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
                !isCommunityTab
                  ? "border-b-2 border-accent bg-white text-accent"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Verified (Illini2Illini)
            </Link>
            <Link
              href={communityHref}
              className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isCommunityTab
                  ? "border-b-2 border-amber-500 bg-amber-50/50 text-amber-900"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Community (Reddit)
            </Link>
          </div>

          {!error && (
            <p className="text-sm text-gray-400">
              {listCount === 0
                ? isCommunityTab
                  ? hasCommunityListingFilters(params)
                    ? "No community listings match these filters"
                    : "No community listings yet"
                  : "No listings match your filters"
                : `Showing ${listCount} ${listCount === 1 ? "listing" : "listings"}`}
            </p>
          )}
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!error && !isCommunityTab && items.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white/60 px-8 py-20 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900">No listings found</p>
            <p className="mt-1.5 max-w-xs text-sm text-gray-500">
              Try adjusting your filters, changing the date range, or broadening your search.
            </p>
            <Link
              href="/listings"
              className="mt-6 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 shadow-card transition-all hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Clear all filters
            </Link>
          </div>
        )}

        {!error && isCommunityTab && communityItems.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 px-8 py-20 text-center">
            <p className="text-base font-semibold text-gray-900">
              {hasCommunityListingFilters(params) ? "No community listings match these filters" : "No community listings"}
            </p>
            <p className="mt-1.5 max-w-sm text-sm text-gray-600">
              {hasCommunityListingFilters(params) ? (
                <>
                  Try broadening your rent or bedroom filters, or{" "}
                  <Link href="/listings?tab=community" className="font-medium text-accent underline-offset-2 hover:underline">
                    clear filters
                  </Link>
                  .
                </>
              ) : (
                <>
                  Import Reddit extracts into the database (e.g. run{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 text-xs">npm run import-reddit-listings</code>) to show
                  posts here.
                </>
              )}
            </p>
          </div>
        )}

        {!error && !isCommunityTab && items.length > 0 && (
          <>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} />
                </li>
              ))}
            </ul>
            <ListingsPagination params={params} page={page} hasMore={hasMore} tab="verified" />
          </>
        )}

        {!error && isCommunityTab && communityItems.length > 0 && (
          <>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {communityItems.map((listing) => (
                <li key={listing.id}>
                  <CommunityListingCard listing={listing} />
                </li>
              ))}
            </ul>
            <ListingsPagination params={params} page={page} hasMore={hasMore} tab="community" />
          </>
        )}
      </div>
    </PageContainer>
  );
}
