"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";
import { AuthCard } from "@/components/auth/AuthCard";

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
  const styles: Record<ListingStatus, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    TAKEN: "bg-gray-100 text-gray-600",
    EXPIRED: "bg-gray-100 text-gray-500",
    DELETED: "bg-gray-100 text-gray-400",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}

function GateScreen({ title, description, cta }: { title: string; description: string; cta?: React.ReactNode }) {
  return (
    <PageContainer>
      <div className="flex justify-center py-8 md:py-12">
        <AuthCard>
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-brand">{title}</h1>
            <p className="text-sm text-gray-500">{description}</p>
            {cta}
          </div>
        </AuthCard>
      </div>
    </PageContainer>
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
        <p className="text-sm text-gray-500">Loading your listings&hellip;</p>
      </PageContainer>
    );
  }

  if (gate.kind === "unauth") {
    return (
      <GateScreen
        title="Log in to view your listings"
        description="Your active, taken, and expired listings will appear here after you log in."
        cta={
          <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            Sign in
          </Link>
        }
      />
    );
  }

  if (gate.kind === "needsVerify") {
    return (
      <GateScreen
        title="Verify your email"
        description="Verify your UIUC email to manage your listings."
        cta={
          <Link href="/verify-email" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            Verify email
          </Link>
        }
      />
    );
  }

  if (gate.kind === "needsProfile") {
    return (
      <GateScreen
        title="Complete your profile"
        description="Finish setting up your profile before managing listings."
        cta={
          <Link href="/profile/setup" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            Complete profile
          </Link>
        }
      />
    );
  }

  if (gate.kind === "banned") {
    return (
      <GateScreen
        title="Account restricted"
        description="Your account is restricted from managing listings."
      />
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand md:text-3xl">My listings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your active, taken, expired, and deleted listings.
            </p>
          </div>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            + Create listing
          </Link>
        </div>

        {actionError && (
          <div className="rounded-xl bg-red-50 px-3 py-2">
            <p className="text-sm text-red-600" role="alert">{actionError}</p>
          </div>
        )}

        {loadingList ? (
          <p className="text-sm text-gray-500">Loading listings&hellip;</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200/60 bg-white px-8 py-16 text-center shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
              <span className="text-2xl text-gray-400" aria-hidden>&#8962;</span>
            </div>
            <p className="text-base font-semibold text-brand">You have no listings yet</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Create your first listing to get started and appear in search results.
            </p>
            <Link
              href="/listings/new"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              + Create listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((listing) => {
              const firstPhoto = listing.photos[0];
              const dateRange = `${formatDate(listing.start_date)} – ${formatDate(listing.end_date)}`;
              return (
                <div
                  key={listing.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
                >
                  {firstPhoto ? (
                    <div className="relative w-full overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={firstPhoto.image_url}
                        alt={listing.title}
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-gray-100">
                      <span className="text-3xl text-gray-300" aria-hidden>&#8962;</span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">{dateRange}</p>
                          <h2 className="truncate text-sm font-semibold text-brand">
                            {listing.title}
                          </h2>
                          <p className="text-sm font-medium text-gray-600">
                            ${listing.monthly_rent}/mo
                          </p>
                        </div>
                        <StatusBadge status={listing.status} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <Link
                        href={`/listings/${listing.id}/edit`}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      >
                        Edit
                      </Link>
                      {listing.status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => handleMarkTaken(listing.id)}
                          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        >
                          Mark taken
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(listing.id)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-400"
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
