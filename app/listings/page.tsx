import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { PageContainer } from "@/components/layout/PageContainer";
import { FilterBar } from "@/components/listings/FilterBar";
import { ListingCard, type PublicListingItem } from "@/components/listings/ListingCard";
import { SearchBar } from "@/components/ui/SearchBar";

type SearchParams = { [key: string]: string | string[] | undefined };

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
  set("keyword", typeof params.keyword === "string" ? params.keyword : undefined);
  set("sort", typeof params.sort === "string" ? params.sort : "newest");
  const furnished = typeof params.furnished === "string" ? params.furnished : undefined;
  if (furnished === "true" || furnished === "false") q.set("furnished", furnished);
  const util = typeof params.utilities_included === "string" ? params.utilities_included : undefined;
  if (util === "true" || util === "false") q.set("utilities_included", util);
  const page = typeof params.page === "string" ? params.page : "1";
  if (page !== "1") q.set("page", page);
  const query = q.toString();
  return `${base}/api/listings${query ? `?${query}` : ""}`;
}

function getFilterValues(params: SearchParams) {
  return {
    min_rent: typeof params.min_rent === "string" ? params.min_rent : "",
    max_rent: typeof params.max_rent === "string" ? params.max_rent : "",
    start_date: typeof params.start_date === "string" ? params.start_date : "",
    end_date: typeof params.end_date === "string" ? params.end_date : "",
    room_type: typeof params.room_type === "string" ? params.room_type : "",
    furnished: typeof params.furnished === "string" ? params.furnished : "",
    utilities_included: typeof params.utilities_included === "string" ? params.utilities_included : "",
    lease_type: typeof params.lease_type === "string" ? params.lease_type : "",
    sort: typeof params.sort === "string" ? params.sort : "newest",
    keyword: typeof params.keyword === "string" ? params.keyword : "",
  };
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const base = await getApiBaseUrl();
  const url = buildListingsUrl(base, params);

  let items: PublicListingItem[] = [];
  let hasMore = false;
  let page = 1;
  let error: string | null = null;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      error = json?.error?.message ?? "Failed to load listings.";
    } else if (json.ok && json.data) {
      items = json.data.items ?? [];
      hasMore = json.data.has_more === true;
      page = Number(json.data.page) || 1;
    }
  } catch {
    error = "Failed to load listings.";
  }

  const filterValues = getFilterValues(params);

  return (
    <PageContainer>
      <div className="md:hidden">
        <SearchBar className="w-full" />
      </div>

      <div className="space-y-6 md:space-y-8">
        <FilterBar values={filterValues} />

        <header>
          <h1 className="text-2xl font-bold tracking-tight text-brand md:text-3xl">Browse listings</h1>
          {!error && (
            <p className="mt-1 text-sm text-gray-400">
              {items.length === 0
                ? "No listings match your filters"
                : `Showing ${items.length} ${items.length === 1 ? "listing" : "listings"}`}
            </p>
          )}
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!error && items.length === 0 && (
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

        {!error && items.length > 0 && (
          <>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} />
                </li>
              ))}
            </ul>
            {hasMore && (
              <p className="text-center text-sm text-gray-400">
                More results available. Refine filters or go to next page (page {page}).
              </p>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
