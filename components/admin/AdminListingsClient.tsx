"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";

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

  function statusBadgeClass(status: string): string {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "TAKEN":
        return "bg-gray-100 text-gray-600";
      case "EXPIRED":
        return "bg-gray-100 text-gray-500";
      case "DELETED":
        return "bg-gray-100 text-gray-500";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <PageContainer>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-gray-700">
            ← Admin
          </Link>
          <h1 className="text-2xl font-semibold text-illini-blue">Listings</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2 ${
              filter === ""
                ? "border-illini-blue bg-illini-blue text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {(["ACTIVE", "TAKEN", "EXPIRED", "DELETED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2 ${
                filter === s
                  ? "border-illini-blue bg-illini-blue text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {error && (
            <p className="px-6 py-4 text-sm text-red-600">{error}</p>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <p className="text-sm text-gray-500">Loading…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <p className="text-sm text-gray-500">No listings.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Owner</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Rent</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Start</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">End</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((l) => (
                    <tr key={l.id} className="border-b border-gray-200 bg-white last:border-b-0">
                      <td className="max-w-[180px] px-4 py-3">
                        <Link href={`/listings/${l.id}`} className="block truncate font-medium text-illini-orange hover:underline">
                          {l.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {l.owner_id}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(l.status)}`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {l.monthly_rent != null ? `$${l.monthly_rent}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {l.start_date ? new Date(l.start_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {l.end_date ? new Date(l.end_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {l.status !== "DELETED" && (
                          <button
                            type="button"
                            disabled={deletingId === l.id}
                            onClick={() => handleDelete(l.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
    </PageContainer>
  );
}
