"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";

export type NavUser = {
  username: string;
  profile_picture_url: string | null;
  role: string;
};

export function NavbarAuth({ user }: { user: NavUser | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm font-medium text-white transition-colors hover:text-white/90"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-white px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2 focus:ring-offset-illini-blue"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profile_picture_url}
            alt={user.username}
            className="rounded-full h-8 w-8 object-cover border border-white/30"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-medium text-white">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500">@{user.username}</p>
          </div>
          <Link
            href="/me"
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/me/listings"
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            My Listings
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            role="menuitem"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
