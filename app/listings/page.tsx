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

function getFilterValues(params: SearchParams): {
  min_rent: string;
  max_rent: string;
  start_date: string;
  end_date: string;
  room_type: string;
  furnished: string;
  utilities_included: string;
  lease_type: string;
  sort: string;
  keyword: string;
} {
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

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
      {/* Mobile only: prominent SearchBar below navbar (navbar search is hidden on mobile) */}
      <div className="md:hidden">
        <SearchBar className="w-full" />
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* Search and filters together before results heading */}
        <FilterBar values={filterValues} />

        <header>
          <h1 className="text-2xl font-semibold text-illini-blue md:text-3xl">
            Browse listings
          </h1>
          {!error && (
            <p className="mt-1 text-sm text-gray-500">
              {items.length === 0
                ? "No results"
                : `${items.length} ${items.length === 1 ? "result" : "results"}`}
            </p>
          )}
        </header>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!error && items.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 px-8 rounded-xl border border-gray-200 bg-white shadow-sm">
            <p className="text-base font-medium text-illini-blue">
              No listings match your filters.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your rent range or dates.
            </p>
            <Link
              href="/listings"
              className="mt-3 inline-block text-sm font-medium text-illini-orange hover:underline focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Clear filters
            </Link>
          </div>
        )}

        {!error && items.length > 0 && (
          <>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} />
                </li>
              ))}
            </ul>
            {hasMore && (
              <p className="text-sm text-gray-500">
                More results available. Refine filters or go to next page (page {page}).
              </p>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
