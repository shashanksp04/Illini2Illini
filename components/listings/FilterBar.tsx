"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useId } from "react";

export type FilterBarValues = {
  min_rent: string;
  max_rent: string;
  start_date: string;
  end_date: string;
  room_type: string;
  total_bedrooms: string;
  total_bathrooms: string;
  furnished: string;
  utilities_included: string;
  lease_type: string;
  sort: string;
  keyword: string;
  include_taken: string;
};

const defaultValues: FilterBarValues = {
  min_rent: "", max_rent: "", start_date: "", end_date: "",
  room_type: "", total_bedrooms: "", total_bathrooms: "",
  furnished: "", utilities_included: "",
  lease_type: "", sort: "newest", keyword: "", include_taken: "",
};

type FilterBarProps = { values?: Partial<FilterBarValues>; isAdmin?: boolean };

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition-all focus:border-accent focus:bg-white focus:outline-none focus:shadow-input-focus";

export function FilterBar({ values = {}, isAdmin = false }: FilterBarProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const merged = { ...defaultValues, ...values };
  const formId = useId();
  const formKey = `${JSON.stringify(merged)}-${resetCount}`;

  function handleClear() {
    setResetCount((c) => c + 1);
    setDrawerOpen(false);
    router.push("/listings");
  }

  const includeTakenInput = isAdmin ? (
    <label className="flex items-center gap-2 whitespace-nowrap">
      <input
        type="checkbox"
        name="include_taken"
        value="true"
        defaultChecked={merged.include_taken === "true"}
        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent/30"
      />
      <span className="text-sm text-gray-700">Include taken</span>
    </label>
  ) : null;

  const formContent = (
    <>
      <input type="hidden" name="page" value="1" />
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <input type="number" name="min_rent" placeholder="Min $" defaultValue={merged.min_rent} className={`${inputCls} sm:w-20`} aria-label="Minimum rent" />
        <input type="number" name="max_rent" placeholder="Max $" defaultValue={merged.max_rent} className={`${inputCls} sm:w-20`} aria-label="Maximum rent" />
        <input type="date" name="start_date" defaultValue={merged.start_date} className={`${inputCls} sm:w-36`} aria-label="Start date" />
        <input type="date" name="end_date" defaultValue={merged.end_date} className={`${inputCls} sm:w-36`} aria-label="End date" />
        <select name="room_type" defaultValue={merged.room_type} className={`${inputCls} sm:w-36`} aria-label="Room type">
          <option value="">Room type</option>
          <option value="PRIVATE_ROOM">Private room</option>
          <option value="ENTIRE_UNIT">Entire unit</option>
        </select>
        <select name="furnished" defaultValue={merged.furnished} className={`${inputCls} sm:w-28`} aria-label="Furnished">
          <option value="">Furnished</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        <select name="utilities_included" defaultValue={merged.utilities_included} className={`${inputCls} sm:w-28`} aria-label="Utilities">
          <option value="">Utilities</option>
          <option value="true">Included</option>
          <option value="false">Not included</option>
        </select>
        <select name="lease_type" defaultValue={merged.lease_type} className={`${inputCls} sm:w-36`} aria-label="Lease type">
          <option value="">Lease type</option>
          <option value="SUBLEASE">Sublease</option>
          <option value="LEASE_TAKEOVER">Lease takeover</option>
        </select>
        <select name="total_bedrooms" defaultValue={merged.total_bedrooms} className={`${inputCls} sm:w-28`} aria-label="Bedrooms">
          <option value="">Beds</option>
          <option value="1">1 Bed</option>
          <option value="2">2 Beds</option>
          <option value="3">3 Beds</option>
          <option value="4">4 Beds</option>
          <option value="5">5+ Beds</option>
        </select>
        <select name="total_bathrooms" defaultValue={merged.total_bathrooms} className={`${inputCls} sm:w-28`} aria-label="Bathrooms">
          <option value="">Baths</option>
          <option value="1">1 Bath</option>
          <option value="2">2 Baths</option>
          <option value="3">3 Baths</option>
          <option value="4">4+ Baths</option>
        </select>
        <select name="sort" defaultValue={merged.sort} className={`${inputCls} sm:w-32`} aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="price_asc">Price (low)</option>
        </select>
        <input type="search" name="keyword" placeholder="Keyword" defaultValue={merged.keyword} className={`${inputCls} sm:min-w-[120px] sm:flex-1`} aria-label="Keyword search" />
        {includeTakenInput}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          Clear
        </button>
      </div>
    </>
  );

  return (
    <>
      <form key={formKey} id={formId} method="GET" action="/listings" className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-card">
        <div className="hidden md:block">{formContent}</div>
        <div className="flex flex-wrap items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-card transition-all hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-accent/20"
            aria-expanded={drawerOpen}
            aria-controls="filter-drawer"
          >
            Filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </form>

      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" aria-hidden onClick={() => setDrawerOpen(false)} />
          <div
            id="filter-drawer"
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white p-5 shadow-elevated md:hidden"
            role="dialog"
            aria-label="Filters"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            <form key={formKey} method="GET" action="/listings" onSubmit={() => setDrawerOpen(false)}>
              <input type="hidden" name="page" value="1" />
              <div className="space-y-4">
                <FilterGroup label="Rent range">
                  <div className="flex gap-2">
                    <input type="number" name="min_rent" placeholder="Min $" defaultValue={merged.min_rent} className={inputCls} />
                    <input type="number" name="max_rent" placeholder="Max $" defaultValue={merged.max_rent} className={inputCls} />
                  </div>
                </FilterGroup>
                <FilterGroup label="Dates">
                  <div className="flex gap-2">
                    <input type="date" name="start_date" defaultValue={merged.start_date} className={inputCls} />
                    <input type="date" name="end_date" defaultValue={merged.end_date} className={inputCls} />
                  </div>
                </FilterGroup>
                <FilterGroup label="Room type">
                  <select name="room_type" defaultValue={merged.room_type} className={inputCls}><option value="">Any</option><option value="PRIVATE_ROOM">Private room</option><option value="ENTIRE_UNIT">Entire unit</option></select>
                </FilterGroup>
                <FilterGroup label="Furnished">
                  <select name="furnished" defaultValue={merged.furnished} className={inputCls}><option value="">Any</option><option value="true">Yes</option><option value="false">No</option></select>
                </FilterGroup>
                <FilterGroup label="Utilities">
                  <select name="utilities_included" defaultValue={merged.utilities_included} className={inputCls}><option value="">Any</option><option value="true">Included</option><option value="false">Not included</option></select>
                </FilterGroup>
                <FilterGroup label="Lease type">
                  <select name="lease_type" defaultValue={merged.lease_type} className={inputCls}><option value="">Any</option><option value="SUBLEASE">Sublease</option><option value="LEASE_TAKEOVER">Lease takeover</option></select>
                </FilterGroup>
                <FilterGroup label="Bedrooms">
                  <select name="total_bedrooms" defaultValue={merged.total_bedrooms} className={inputCls}><option value="">Any</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5+</option></select>
                </FilterGroup>
                <FilterGroup label="Bathrooms">
                  <select name="total_bathrooms" defaultValue={merged.total_bathrooms} className={inputCls}><option value="">Any</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select>
                </FilterGroup>
                <FilterGroup label="Sort">
                  <select name="sort" defaultValue={merged.sort} className={inputCls}><option value="newest">Newest</option><option value="price_asc">Price (low)</option></select>
                </FilterGroup>
                <FilterGroup label="Keyword">
                  <input type="search" name="keyword" defaultValue={merged.keyword} placeholder="Search…" className={inputCls} />
                </FilterGroup>
                {isAdmin && (
                  <FilterGroup label="Admin">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="include_taken"
                        value="true"
                        defaultChecked={merged.include_taken === "true"}
                        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent/30"
                      />
                      <span className="text-sm text-gray-700">Include taken listings</span>
                    </label>
                  </FilterGroup>
                )}
              </div>
              <div className="mt-5 flex gap-2">
                <button type="submit" className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-button transition-all hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2">
                  Apply
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
