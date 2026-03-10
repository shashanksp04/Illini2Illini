"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";

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
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
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
      <PageContainer>
        <p className="text-sm text-gray-500">Loading your listings…</p>
      </PageContainer>
    );
  }

  if (gate.kind === "unauth") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Log in to view your listings</h1>
            <p className="text-sm text-gray-500">
              Your active, taken, and expired listings will appear here after you log in.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Log in
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "needsVerify") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Verify your email</h1>
            <p className="text-sm text-gray-500">
              Verify your UIUC email to manage your listings.
            </p>
            <Link
              href="/verify-email"
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Verify email
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "needsProfile") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Complete your profile</h1>
            <p className="text-sm text-gray-500">
              Finish setting up your profile before managing listings.
            </p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Complete profile
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "banned") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Account restricted</h1>
            <p className="text-sm text-gray-500">
              Your account is restricted from managing listings.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-illini-blue md:text-3xl">My listings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your active, taken, expired, and deleted listings.
            </p>
          </div>
          <Link
            href="/listings/new"
            className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
          >
            Create listing
          </Link>
        </div>

        {actionError && (
          <p className="text-sm text-red-600" role="alert">
            {actionError}
          </p>
        )}

        {loadingList ? (
          <p className="text-sm text-gray-500">Loading listings…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm space-y-2">
            <p className="text-base font-medium text-illini-blue">You have no listings yet.</p>
            <p className="text-sm text-gray-500">
              Create your first listing to get started and appear in search results.
            </p>
            <Link
              href="/listings/new"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Create listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((listing) => {
              const firstPhoto = listing.photos[0];
              const dateRange = `${formatDate(listing.start_date)} – ${formatDate(
                listing.end_date
              )}`;
              return (
                <div
                  key={listing.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  {firstPhoto && (
                    <div className="relative w-full overflow-hidden rounded-lg bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={firstPhoto.image_url}
                        alt={listing.title}
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">{dateRange}</p>
                          <h2 className="truncate text-base font-medium text-illini-blue">
                            {listing.title}
                          </h2>
                          <p className="text-sm text-gray-600">
                            ${listing.monthly_rent} / month
                          </p>
                        </div>
                        <StatusBadge status={listing.status} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link
                        href={`/listings/${listing.id}/edit`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      >
                        Edit
                      </Link>
                      {listing.status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => handleMarkTaken(listing.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        >
                          Mark taken
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(listing.id)}
                        className="inline-flex items-center justify-center rounded-lg border border-red-500 bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-400"
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
    </PageContainer>
  );
}

