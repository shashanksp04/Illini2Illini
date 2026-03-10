"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { FormEvent, useState } from "react";

type SearchBarProps = {
  /** Optional className for the wrapper (e.g. for navbar vs below-navbar placement) */
  className?: string;
  /** Optional default keyword (e.g. from URL searchParams) */
  defaultValue?: string;
  /** If true, submit navigates to /listings with keyword; if false, just a controlled input (caller handles submit) */
  submitToBrowse?: boolean;
  /** "navbar" = white-on-blue styling for header; "default" = light background */
  variant?: "default" | "navbar";
};

/**
 * Global search bar. Rounded full input, "Search listings…", icon.
 * Used in Navbar (Landing/Browse) and below navbar on mobile Browse.
 */
export function SearchBar({
  className = "",
  defaultValue = "",
  submitToBrowse = true,
  variant = "default",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState((defaultValue || searchParams.get("keyword")) ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!submitToBrowse) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("keyword", value.trim());
    else params.delete("keyword");
    params.delete("page");
    router.push(`/listings?${params.toString()}`);
  }

  const isNavbar = variant === "navbar";
  const inputClass = isNavbar
    ? "w-full rounded-full border border-white/20 bg-white/10 py-2 pl-9 pr-4 text-sm text-white placeholder-white/70 focus:border-illini-orange focus:outline-none focus:ring-2 focus:ring-illini-orange"
    : "w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-500 focus:border-illini-orange focus:outline-none focus:ring-2 focus:ring-illini-orange/20";
  const iconClass = isNavbar
    ? "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
    : "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500";

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <label htmlFor="search-listings" className="sr-only">
        Search listings
      </label>
      <div className="relative">
        <Search className={iconClass} aria-hidden />
        <input
          id="search-listings"
          type="search"
          placeholder="Search listings…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClass}
          aria-label="Search listings"
        />
      </div>
    </form>
  );
}
