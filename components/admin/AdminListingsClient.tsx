"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ListingItem = {
  id: string;
  title: string;
  owner_id: string;
  status: string;
  monthly_rent: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

type StatusFilter = "ACTIVE" | "TAKEN" | "EXPIRED" | "DELETED" | "";

export function AdminListingsClient() {
  const [filter, setFilter] = useState<StatusFilter>("");
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter ? `/api/admin/listings?status=${filter}` : "/api/admin/listings";
      const res = await fetch(url);
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { items: ListingItem[] };
        error?: { message: string };
      };
      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? "Failed to load listings.");
        setItems([]);
        return;
      }
      setItems(json.data?.items ?? []);
    } catch {
      setError("Failed to load listings.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this listing? This is a soft delete.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok?: boolean; error?: { message: string } };
      if (res.ok && json.ok) {
        await fetchListings();
      } else {
        setError(json?.error?.message ?? "Failed to delete listing.");
      }
    } catch {
      setError("Failed to delete listing.");
    } finally {
      setDeletingId(null);
    }
  }

  function statusBadgeStyle(status: string) {
    switch (status) {
      case "ACTIVE":
        return { backgroundColor: "#DCFCE7", color: "#16A34A" };
      case "TAKEN":
        return { backgroundColor: "#F3F4F6", color: "#6B7280" };
      case "EXPIRED":
        return { backgroundColor: "#FEE2E2", color: "#DC2626" };
      case "DELETED":
        return { backgroundColor: "#F3F4F6", color: "#6B7280" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#6B7280" };
    }
  }

  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{ backgroundColor: "#F8F9FB" }}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin" className="text-sm font-medium" style={{ color: "#6B7280" }}>
            ← Admin
          </Link>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
            Listings
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("")}
            className="rounded-lg px-4 py-2 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#E84A27] focus:ring-offset-2"
            style={{
              backgroundColor: filter === "" ? "#13294B" : "white",
              color: filter === "" ? "white" : "#111827",
              borderColor: "#E5E7EB",
            }}
          >
            All
          </button>
          {(["ACTIVE", "TAKEN", "EXPIRED", "DELETED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className="rounded-lg px-4 py-2 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#E84A27] focus:ring-offset-2"
              style={{
                backgroundColor: filter === s ? "#13294B" : "white",
                color: filter === s ? "white" : "#111827",
                borderColor: "#E5E7EB",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm overflow-hidden">
          {error && (
            <p className="px-6 py-4 text-sm" style={{ color: "#DC2626" }}>
              {error}
            </p>
          )}
          {loading ? (
            <p className="px-6 py-8 text-sm" style={{ color: "#6B7280" }}>
              Loading…
            </p>
          ) : items.length === 0 ? (
            <p className="px-6 py-8 text-sm" style={{ color: "#6B7280" }}>
              No listings.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB]">
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Title</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Owner</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Status</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Rent</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Start</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>End</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Created</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((l) => (
                    <tr key={l.id} className="border-b border-[#E5E7EB]">
                      <td className="px-4 py-3 max-w-[180px]">
                        <Link href={`/listings/${l.id}`} className="font-medium truncate block" style={{ color: "#E84A27" }}>
                          {l.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6B7280" }}>
                        {l.owner_id}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                          style={statusBadgeStyle(l.status)}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#111827" }}>
                        {l.monthly_rent != null ? `$${l.monthly_rent}` : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6B7280" }}>
                        {l.start_date ? new Date(l.start_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6B7280" }}>
                        {l.end_date ? new Date(l.end_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6B7280" }}>
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {l.status !== "DELETED" && (
                          <button
                            type="button"
                            disabled={deletingId === l.id}
                            onClick={() => handleDelete(l.id)}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium border border-[#DC2626] text-[#DC2626] focus:outline-none focus:ring-2 focus:ring-[#E84A27] focus:ring-offset-2 disabled:opacity-70"
                          >
                            {deletingId === l.id ? "…" : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
