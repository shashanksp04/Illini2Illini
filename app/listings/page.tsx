import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { ListingCard, type PublicListingItem } from "@/components/listings/ListingCard";

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

  const currentMinRent = typeof params.min_rent === "string" ? params.min_rent : "";
  const currentMaxRent = typeof params.max_rent === "string" ? params.max_rent : "";
  const currentStartDate = typeof params.start_date === "string" ? params.start_date : "";
  const currentEndDate = typeof params.end_date === "string" ? params.end_date : "";
  const currentLeaseType = typeof params.lease_type === "string" ? params.lease_type : "";
  const currentRoomType = typeof params.room_type === "string" ? params.room_type : "";
  const currentKeyword = typeof params.keyword === "string" ? params.keyword : "";
  const currentSort = typeof params.sort === "string" ? params.sort : "newest";
  const currentFurnished = typeof params.furnished === "string" ? params.furnished : "";
  const currentUtilities = typeof params.utilities_included === "string" ? params.utilities_included : "";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FB" }}>
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold" style={{ color: "#13294B" }}>
            Illini2Illini
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium"
            style={{ color: "#13294B" }}
          >
            Log in
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4" style={{ color: "#111827" }}>
          Browse listings
        </h1>

        {/* Filter bar - horizontal, compact */}
        <form
          method="GET"
          className="flex flex-wrap gap-3 p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-sm mb-6"
        >
          <input
            type="number"
            name="min_rent"
            placeholder="Min rent"
            defaultValue={currentMinRent}
            className="w-24 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          />
          <input
            type="number"
            name="max_rent"
            placeholder="Max rent"
            defaultValue={currentMaxRent}
            className="w-24 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          />
          <input
            type="date"
            name="start_date"
            defaultValue={currentStartDate}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          />
          <input
            type="date"
            name="end_date"
            defaultValue={currentEndDate}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          />
          <select
            name="lease_type"
            defaultValue={currentLeaseType}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          >
            <option value="">Lease type</option>
            <option value="SUBLEASE">Sublease</option>
            <option value="LEASE_TAKEOVER">Lease takeover</option>
          </select>
          <select
            name="room_type"
            defaultValue={currentRoomType}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          >
            <option value="">Room type</option>
            <option value="PRIVATE_ROOM">Private room</option>
            <option value="ENTIRE_UNIT">Entire unit</option>
          </select>
          <select
            name="furnished"
            defaultValue={currentFurnished}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          >
            <option value="">Furnished</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <select
            name="utilities_included"
            defaultValue={currentUtilities}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          >
            <option value="">Utilities</option>
            <option value="true">Included</option>
            <option value="false">Not included</option>
          </select>
          <input
            type="search"
            name="keyword"
            placeholder="Keyword"
            defaultValue={currentKeyword}
            className="flex-1 min-w-[120px] rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          />
          <select
            name="sort"
            defaultValue={currentSort}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price (low)</option>
          </select>
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "#13294B" }}
          >
            Apply
          </button>
          <Link
            href="/listings"
            className="rounded-lg px-4 py-2 text-sm font-medium border border-[#E5E7EB] bg-white"
            style={{ color: "#111827" }}
          >
            Clear
          </Link>
        </form>

        {error && (
          <p className="text-sm mb-4" style={{ color: "#DC2626" }}>
            {error}
          </p>
        )}

        {!error && items.length === 0 && (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-8 text-center">
            <p className="text-base font-medium" style={{ color: "#111827" }}>
              No listings match your filters.
            </p>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              Try adjusting your rent range or dates.
            </p>
            <Link
              href="/listings"
              className="inline-block mt-3 text-sm font-medium"
              style={{ color: "#13294B" }}
            >
              Clear filters
            </Link>
          </div>
        )}

        {!error && items.length > 0 && (
          <>
            <ul className="grid gap-4 sm:grid-cols-1">
              {items.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} />
                </li>
              ))}
            </ul>
            {hasMore && (
              <p className="text-sm mt-4" style={{ color: "#6B7280" }}>
                More results available. Refine filters or go to next page (page {page}).
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
