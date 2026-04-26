"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { MultiSelectDropdown } from "@/components/forms/MultiSelectDropdown";
import { SEASON_LABELS, SEASON_OPTIONS } from "@/lib/listings/seasons";

export type CommunityFilterBarValues = {
  min_rent: string;
  max_rent: string;
  total_bedrooms: string;
  season: string[];
};

const defaultValues: CommunityFilterBarValues = {
  min_rent: "",
  max_rent: "",
  total_bedrooms: "",
  season: [],
};

type CommunityFilterBarProps = { values?: Partial<CommunityFilterBarValues> };

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition-all focus:border-accent focus:bg-white focus:outline-none focus:shadow-input-focus";

export function CommunityFilterBar({ values = {} }: CommunityFilterBarProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const merged = { ...defaultValues, ...values };
  const formKey = `${JSON.stringify(merged)}-${resetCount}`;
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(merged.season);

  useEffect(() => {
    setSelectedSeasons(merged.season);
  }, [formKey, merged.season]);

  function handleClear() {
    setResetCount((c) => c + 1);
    setDrawerOpen(false);
    router.push("/listings?tab=community");
  }

  const disclaimer = (
    <p className="text-xs leading-relaxed text-gray-500">
      Community posts are parsed from Reddit automatically. If rent or bedrooms weren&apos;t extracted, the original post
      may still include them (for example in a screenshot or unusual formatting). Those listings stay visible; when you use
      these filters, they appear after posts that match.
    </p>
  );

  const formContent = (
    <>
      <input type="hidden" name="tab" value="community" />
      <input type="hidden" name="page" value="1" />
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
        <input
          type="number"
          name="min_rent"
          placeholder="Min $"
          defaultValue={merged.min_rent}
          className={`${inputCls} sm:w-24`}
          aria-label="Minimum rent"
        />
        <input
          type="number"
          name="max_rent"
          placeholder="Max $"
          defaultValue={merged.max_rent}
          className={`${inputCls} sm:w-24`}
          aria-label="Maximum rent"
        />
        <select
          name="total_bedrooms"
          defaultValue={merged.total_bedrooms}
          className={`${inputCls} sm:w-36`}
          aria-label="Bedrooms"
        >
          <option value="">Beds</option>
          <option value="1">1 Bed</option>
          <option value="2">2 Beds</option>
          <option value="3">3 Beds</option>
          <option value="4">4 Beds</option>
          <option value="5">5+ Beds</option>
        </select>
        <div className="sm:w-40">
          <MultiSelectDropdown
            name="season"
            placeholder="Seasons"
            options={SEASON_OPTIONS.map((season) => ({
              value: season,
              label: SEASON_LABELS[season],
            }))}
            value={selectedSeasons}
            onChange={setSelectedSeasons}
          />
        </div>
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
      <form
        key={formKey}
        method="GET"
        action="/listings"
        className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-5 shadow-card"
      >
        <h2 className="mb-2 text-sm font-semibold text-amber-950">Community filters</h2>
        {disclaimer}
        <div className="mt-4 hidden md:block">{formContent}</div>
        <div className="mt-4 flex flex-wrap items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-900 shadow-card transition-all hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-amber-200/50"
            aria-expanded={drawerOpen}
            aria-controls="community-filter-drawer"
          >
            Filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50"
          >
            Clear
          </button>
        </div>
      </form>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            aria-hidden
            onClick={() => setDrawerOpen(false)}
          />
          <div
            id="community-filter-drawer"
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-amber-200 bg-white p-5 shadow-elevated md:hidden"
            role="dialog"
            aria-label="Community filters"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand">Community filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-gray-500">
              Community posts are parsed from Reddit automatically. If rent or bedrooms weren&apos;t extracted, the
              original post may still include them (for example in a screenshot or unusual formatting). Those listings stay
              visible; when you use these filters, they appear after posts that match.
            </p>
            <form
              key={`${formKey}-drawer`}
              method="GET"
              action="/listings"
              onSubmit={() => setDrawerOpen(false)}
            >
              <input type="hidden" name="tab" value="community" />
              <input type="hidden" name="page" value="1" />
              <div className="space-y-4">
                <FilterGroup label="Rent range">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="min_rent"
                      placeholder="Min $"
                      defaultValue={merged.min_rent}
                      className={inputCls}
                      aria-label="Minimum rent"
                    />
                    <input
                      type="number"
                      name="max_rent"
                      placeholder="Max $"
                      defaultValue={merged.max_rent}
                      className={inputCls}
                      aria-label="Maximum rent"
                    />
                  </div>
                </FilterGroup>
                <FilterGroup label="Bedrooms">
                  <select
                    name="total_bedrooms"
                    defaultValue={merged.total_bedrooms}
                    className={inputCls}
                    aria-label="Bedrooms"
                  >
                    <option value="">Any</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5+</option>
                  </select>
                </FilterGroup>
                <FilterGroup label="Season">
                  <MultiSelectDropdown
                    name="season"
                    placeholder="Select seasons"
                    options={SEASON_OPTIONS.map((season) => ({
                      value: season,
                      label: SEASON_LABELS[season],
                    }))}
                    value={selectedSeasons}
                    onChange={setSelectedSeasons}
                  />
                </FilterGroup>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-button transition-all hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
                >
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

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
