"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  className?: string;
  defaultValue?: string;
  submitToBrowse?: boolean;
  variant?: "default" | "navbar";
};

export function SearchBar({ className = "", defaultValue = "", submitToBrowse = true, variant = "default" }: Props) {
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

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <label htmlFor="search-listings" className="sr-only">Search listings</label>
      <div className="relative">
        <svg className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${isNavbar ? "text-white/50" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          id="search-listings"
          type="search"
          placeholder="Search listings…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-sm transition-all focus:outline-none ${
            isNavbar
              ? "border border-white/15 bg-white/10 text-white placeholder-white/50 focus:border-white/30 focus:bg-white/15"
              : "border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:border-accent focus:bg-white focus:shadow-input-focus"
          }`}
          aria-label="Search listings"
        />
      </div>
    </form>
  );
}
