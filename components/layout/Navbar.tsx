"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/ui/SearchBar";
import type { NavUser } from "./NavbarAuth";
import { NavbarAuth } from "./NavbarAuth";

type NavbarProps = { user: NavUser | null; needsProfile?: boolean };

export function Navbar({ user, needsProfile }: NavbarProps) {
  const pathname = usePathname();
  const showSearch = pathname === "/" || pathname === "/listings";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight transition-opacity hover:opacity-80">
          <span className="text-white">Illini</span>
          <span className="text-accent">2</span>
          <span className="text-white">Illini</span>
        </Link>

        <Link
          href="/listings"
          className={`hidden shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:block ${
            pathname === "/listings"
              ? "bg-white/15 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          Browse
        </Link>

        <div className="flex min-w-0 flex-1 justify-center">
          {showSearch && (
            <div className="hidden w-full max-w-md md:block">
              <SearchBar variant="navbar" className="w-full" />
            </div>
          )}
        </div>

        <NavbarAuth user={user} needsProfile={needsProfile} />
      </div>
    </header>
  );
}
