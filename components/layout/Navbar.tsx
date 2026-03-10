"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/ui/SearchBar";
import type { NavUser } from "./NavbarAuth";
import { NavbarAuth } from "./NavbarAuth";

type NavbarProps = {
  user: NavUser | null;
};

/**
 * Global Navbar. Illini Blue, h-16, white text.
 * Layout: left (brand) / center (search max-w-xl) / right (login + signup).
 */
export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const showSearch = pathname === "/" || pathname === "/listings";

  return (
    <header className="h-16 shrink-0 bg-illini-blue text-white">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        {/* Left: Brand */}
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            className="font-semibold text-white transition-colors hover:text-white/90"
          >
            Illini2Illini
          </Link>
        </div>

        {/* Center: Search bar — centered, full-width inside max-w-xl */}
        <div className="flex flex-1 justify-center min-w-0">
          {showSearch ? (
            <div className="hidden w-full max-w-xl md:block">
              <SearchBar variant="navbar" className="w-full" />
            </div>
          ) : (
            <div className="hidden flex-1 md:block" aria-hidden />
          )}
        </div>

        {/* Right: Login + Sign up */}
        <div className="flex shrink-0 items-center">
          <NavbarAuth user={user} />
        </div>
      </div>
    </header>
  );
}
