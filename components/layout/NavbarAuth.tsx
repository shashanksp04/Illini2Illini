"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";

export type NavUser = { username: string; profile_picture_url: string | null; role: string };

export function NavbarAuth({ user, needsProfile }: { user: NavUser | null; needsProfile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (needsProfile)
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/profile/setup"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-button transition-all hover:bg-accent-hover hover:shadow-button-hover"
        >
          Complete&nbsp;Profile
        </Link>
      </div>
    );

  if (!user)
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={pathname && pathname !== "/" ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login"}
          className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
        >
          Log&nbsp;in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-button transition-all hover:bg-accent-hover hover:shadow-button-hover"
        >
          Sign&nbsp;up
        </Link>
      </div>
    );

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center rounded-full ring-2 ring-white/20 transition-all hover:ring-white/40 focus:outline-none focus:ring-white/50"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.profile_picture_url} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
            {user.username[0]?.toUpperCase()}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2.5 w-52 overflow-hidden rounded-xl border border-gray-200/80 bg-white/95 shadow-dropdown backdrop-blur-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gray-900">@{user.username}</p>
          </div>
          <nav className="py-1">
            <DropdownItem href="/me/listings" onClick={() => setOpen(false)}>My Listings</DropdownItem>
            <DropdownItem href="/listings" onClick={() => setOpen(false)}>Browse</DropdownItem>
            {user.role === "ADMIN" && (
              <DropdownItem href="/admin" onClick={() => setOpen(false)}>Admin</DropdownItem>
            )}
          </nav>
          <div className="border-t border-gray-100">
            <button type="button" onClick={logout} className="w-full px-4 py-2.5 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
              Log&nbsp;out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900" onClick={onClick}>
      {children}
    </Link>
  );
}
