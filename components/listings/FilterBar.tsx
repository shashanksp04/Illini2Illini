"use client";

import Link from "next/link";
import { useState, useId } from "react";

export type FilterBarValues = {
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
};

const defaultValues: FilterBarValues = {
  min_rent: "",
  max_rent: "",
  start_date: "",
  end_date: "",
  room_type: "",
  furnished: "",
  utilities_included: "",
  lease_type: "",
  sort: "newest",
  keyword: "",
};

type FilterBarProps = {
  values?: Partial<FilterBarValues>;
};

/**
 * Desktop: horizontal filter bar. Mobile: "Filters" button → bottom drawer with Apply/Clear.
 * Rounded container, subtle border, soft shadow. Form GET /listings.
 */
export function FilterBar({ values = {} }: FilterBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const merged = { ...defaultValues, ...values };
  const formId = useId();

  const formContent = (
    <>
      <input type="hidden" name="page" value="1" />
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <input
          type="number"
          name="min_rent"
          placeholder="Min $"
          defaultValue={merged.min_rent}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:border-illini-orange focus:outline-none focus:ring-1 focus:ring-illini-orange sm:w-20"
          aria-label="Minimum rent"
        />
        <input
          type="number"
          name="max_rent"
          placeholder="Max $"
          defaultValue={merged.max_rent}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:border-illini-orange focus:outline-none focus:ring-1 focus:ring-illini-orange sm:w-20"
          aria-label="Maximum rent"
        />
        <input
          type="date"
          name="start_date"
          defaultValue={merged.start_date}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-illini-orange focus:outline-none focus:ring-1 focus:ring-illini-orange sm:w-36"
          aria-label="Start date"
        />
        <input
          type="date"
          name="end_date"
          defaultValue={merged.end_date}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-illini-orange focus:outline-none focus:ring-1 focus:ring-illini-orange sm:w-36"
          aria-label="End date"
        />
        <select
          name="room_type"
          defaultValue={merged.room_type}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-illini-orange focus:outline-none focus:ring-1 focus:ring-illini-orange sm:w-36"
          aria-label="Room type"
        >
          <option value="">Room type</option>
          <option value="PRIVATE_ROOM">Private room</option>
          <option value="ENTIRE_UNIT">Entire unit</option>
        </select>
        <select
          name="furnished"
          defaultValue={merged.furnished}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-illini-orange focus:outline-none focus:ring-1 focus:ring-illini-orange sm:w-28"
          aria-label="Furnished"
        >
          <option value="">Furnished</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        <select
          name="utilities_included"
          defaultValue={merged.utilities_included}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-illini-orange focus:outline-none focus:ring-1 focus:ring-illini-orange sm:w-28"
          aria-label="Utilities"
        >
          <option value="">Utilities</option>
          <option value="true">Included</option>
          <option value="false">Not included</option>
        </select>
        <select
          name="lease_type"
          defaultValue={merged.lease_type}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-illini-orange focus:outline-none focus:ring-1 focus:ring-illini-orange sm:w-36"
          aria-label="Lease type"
        >
          <option value="">Lease type</option>
          <option value="SUBLEASE">Sublease</option>
          <option value="LEASE_TAKEOVER">Lease takeover</option>
        </select>
        <select
          name="sort"
          defaultValue={merged.sort}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-illini-orange focus:outline-none focus:ring-1 focus:ring-illini-orange sm:w-32"
          aria-label="Sort"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price (low)</option>
        </select>
        <input
          type="search"
          name="keyword"
          placeholder="Keyword"
          defaultValue={merged.keyword}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:border-illini-orange focus:outline-none focus:ring-1 focus:ring-illini-orange sm:min-w-[120px] sm:flex-1"
          aria-label="Keyword search"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-lg bg-illini-orange px-4 py-2 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
        >
          Apply
        </button>
        <Link
          href="/listings"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          Clear
        </Link>
      </div>
    </>
  );

  return (
    <>
      <form
        id={formId}
        method="GET"
        action="/listings"
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        {/* Desktop: horizontal bar */}
        <div className="hidden md:block">{formContent}</div>

        {/* Mobile: Filters button */}
        <div className="flex flex-wrap items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            aria-expanded={drawerOpen}
            aria-controls="filter-drawer"
          >
            Filters
          </button>
          <Link
            href="/listings"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear
          </Link>
        </div>
      </form>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            aria-hidden
            onClick={() => setDrawerOpen(false)}
          />
          <div
            id="filter-drawer"
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-xl border-t border-gray-200 bg-white p-4 shadow-lg md:hidden"
            role="dialog"
            aria-label="Filters"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-illini-blue">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-illini-orange"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            <form method="GET" action="/listings" onSubmit={() => setDrawerOpen(false)}>
              <input type="hidden" name="page" value="1" />
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Rent range</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      name="min_rent"
                      placeholder="Min $"
                      defaultValue={merged.min_rent}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
                    />
                    <input
                      type="number"
                      name="max_rent"
                      placeholder="Max $"
                      defaultValue={merged.max_rent}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Dates</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="date"
                      name="start_date"
                      defaultValue={merged.start_date}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
                    />
                    <input type="date" name="end_date" defaultValue={merged.end_date} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Room type</label>
                  <select name="room_type" defaultValue={merged.room_type} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange">
                    <option value="">Any</option>
                    <option value="PRIVATE_ROOM">Private room</option>
                    <option value="ENTIRE_UNIT">Entire unit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Furnished</label>
                  <select name="furnished" defaultValue={merged.furnished} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange">
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Utilities</label>
                  <select name="utilities_included" defaultValue={merged.utilities_included} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange">
                    <option value="">Any</option>
                    <option value="true">Included</option>
                    <option value="false">Not included</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Lease type</label>
                  <select name="lease_type" defaultValue={merged.lease_type} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange">
                    <option value="">Any</option>
                    <option value="SUBLEASE">Sublease</option>
                    <option value="LEASE_TAKEOVER">Lease takeover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Sort</label>
                  <select name="sort" defaultValue={merged.sort} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange">
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price (low)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Keyword</label>
                  <input type="search" name="keyword" defaultValue={merged.keyword} placeholder="Search…" className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-illini-orange py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
                >
                  Apply
                </button>
                <Link
                  href="/listings"
                  className="flex rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setDrawerOpen(false)}
                >
                  Clear
                </Link>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
