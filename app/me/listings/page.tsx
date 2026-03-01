"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MeData = {
  email: string;
  email_verified: boolean;
  is_profile_complete: boolean;
  is_banned: boolean;
};

type MeResponse =
  | { ok: true; data: MeData }
  | { ok: false; error?: { code: string; message: string } };

type ListingStatus = "ACTIVE" | "TAKEN" | "EXPIRED" | "DELETED";

type ListingItem = {
  id: string;
  title: string;
  status: ListingStatus;
  monthly_rent: number;
  start_date: string;
  end_date: string;
  photos: { image_url: string; display_order: number }[];
};

type GateState =
  | { kind: "loading" }
  | { kind: "unauth" }
  | { kind: "needsVerify" }
  | { kind: "needsProfile" }
  | { kind: "banned" }
  | { kind: "ready" };

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: ListingStatus }) {
  if (status === "ACTIVE") {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        ACTIVE
      </span>
    );
  }
  if (status === "TAKEN") {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
        TAKEN
      </span>
    );
  }
  if (status === "EXPIRED") {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        EXPIRED
      </span>
    );
  }
  // DELETED - muted gray for owner view
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
      DELETED
    </span>
  );
}

export default function MyListingsPage() {
  const [gate, setGate] = useState<GateState>({ kind: "loading" });
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await fetch("/api/me");
        const json = (await res.json()) as MeResponse;
        if (!res.ok || !json.ok) {
          if (!cancelled) setGate({ kind: "unauth" });
          return;
        }
        const data = json.data;
        if (!data.email_verified) {
          if (!cancelled) setGate({ kind: "needsVerify" });
          return;
        }
        if (!data.is_profile_complete) {
          if (!cancelled) setGate({ kind: "needsProfile" });
          return;
        }
        if (data.is_banned) {
          if (!cancelled) setGate({ kind: "banned" });
          return;
        }
        if (!cancelled) setGate({ kind: "ready" });
      } catch {
        if (!cancelled) setGate({ kind: "unauth" });
      }
    }
    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (gate.kind !== "ready") return;
    let cancelled = false;
    async function loadListings() {
      setLoadingList(true);
      setActionError(null);
      try {
        const res = await fetch("/api/me/listings");
        const json = (await res.json()) as any;
        if (!res.ok || !json.ok) {
          if (!cancelled) {
            setActionError(json?.error?.message ?? "Failed to load listings.");
          }
          return;
        }
        const items = (json.data?.items ?? []) as ListingItem[];
        if (!cancelled) setItems(items);
      } catch {
        if (!cancelled) setActionError("Failed to load listings.");
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }
    loadListings();
    return () => {
      cancelled = true;
    };
  }, [gate.kind]);

  async function refresh() {
    if (gate.kind !== "ready") return;
    setLoadingList(true);
    setActionError(null);
    try {
      const res = await fetch("/api/me/listings");
      const json = (await res.json()) as any;
      if (!res.ok || !json.ok) {
        setActionError(json?.error?.message ?? "Failed to load listings.");
        return;
      }
      const items = (json.data?.items ?? []) as ListingItem[];
      setItems(items);
    } catch {
      setActionError("Failed to load listings.");
    } finally {
      setLoadingList(false);
    }
  }

  async function handleMarkTaken(id: string) {
    if (!window.confirm("Mark this listing as taken?")) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/listings/${id}/mark-taken`, { method: "POST" });
      const json = (await res.json()) as any;
      if (!res.ok || !json.ok) {
        setActionError(json?.error?.message ?? "Failed to mark listing as taken.");
        return;
      }
      await refresh();
    } catch {
      setActionError("Failed to mark listing as taken.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this listing? This action cannot be undone.")) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      const json = (await res.json()) as any;
      if (!res.ok || !json.ok) {
        setActionError(json?.error?.message ?? "Failed to delete listing.");
        return;
      }
      await refresh();
    } catch {
      setActionError("Failed to delete listing.");
    }
  }

  if (gate.kind === "loading") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <p className="text-base" style={{ color: "#6B7280" }}>
          Loading your listings…
        </p>
      </main>
    );
  }

  if (gate.kind === "unauth") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Log in to view your listings
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Your active, taken, and expired listings will appear here after you log in.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium text-white transition-shadow hover:shadow-md"
              style={{ backgroundColor: "#13294B" }}
            >
              Log in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (gate.kind === "needsVerify") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Verify your email
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Verify your UIUC email to manage your listings.
            </p>
            <Link
              href="/verify-email"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium text-white transition-shadow hover:shadow-md"
              style={{ backgroundColor: "#13294B" }}
            >
              Verify email
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (gate.kind === "needsProfile") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Complete your profile
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Finish setting up your profile before managing listings.
            </p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium text-white transition-shadow hover:shadow-md"
              style={{ backgroundColor: "#13294B" }}
            >
              Complete profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (gate.kind === "banned") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Account restricted
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Your account is restricted from managing listings.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-4 py-6"
      style={{ backgroundColor: "#F8F9FB" }}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold" style={{ color: "#111827" }}>
            My listings
          </h1>
          <Link
            href="/listings/new"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-md"
            style={{ backgroundColor: "#13294B" }}
          >
            Create listing
          </Link>
        </div>

        {actionError && (
          <p className="text-sm" style={{ color: "#DC2626" }}>
            {actionError}
          </p>
        )}

        {loadingList ? (
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Loading listings…
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-2">
            <p className="text-base font-medium" style={{ color: "#111827" }}>
              You have no listings yet.
            </p>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Create your first listing to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((listing) => {
              const firstPhoto = listing.photos[0];
              const dateRange = `${formatDate(listing.start_date)} – ${formatDate(
                listing.end_date
              )}`;
              return (
                <div
                  key={listing.id}
                  className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm p-4 flex gap-4"
                >
                  {firstPhoto && (
                    <div className="h-24 w-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={firstPhoto.image_url}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-sm" style={{ color: "#6B7280" }}>
                          {dateRange}
                        </p>
                        <h2 className="text-base font-semibold" style={{ color: "#111827" }}>
                          {listing.title}
                        </h2>
                        <p className="text-sm" style={{ color: "#6B7280" }}>
                          ${listing.monthly_rent} / month
                        </p>
                      </div>
                      <StatusBadge status={listing.status} />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link
                        href={`/listings/${listing.id}/edit`}
                        className="text-xs font-medium rounded-lg px-3 py-1 border border-[#E5E7EB] bg-white"
                        style={{ color: "#111827" }}
                      >
                        Edit
                      </Link>
                      {listing.status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => handleMarkTaken(listing.id)}
                          className="text-xs font-medium rounded-lg px-3 py-1 border border-[#E5E7EB] bg-white"
                          style={{ color: "#111827" }}
                        >
                          Mark taken
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(listing.id)}
                        className="text-xs font-medium rounded-lg px-3 py-1 border border-red-500 bg-white"
                        style={{ color: "#DC2626" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

