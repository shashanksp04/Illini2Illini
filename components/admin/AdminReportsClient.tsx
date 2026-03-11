"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";

type ReportItem = {
  id: string;
  listing_id: string;
  reported_by_user_id: string;
  reason: string;
  status: string;
  created_at: string;
};

type ReportStatusFilter = "OPEN" | "RESOLVED";

export function AdminReportsClient() {
  const [filter, setFilter] = useState<ReportStatusFilter>("OPEN");
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reports?status=" + filter);
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { items: ReportItem[] };
        error?: { message: string };
      };
      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? "Failed to load reports.");
        setItems([]);
        return;
      }
      setItems(json.data?.items ?? []);
    } catch {
      setError("Failed to load reports.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleResolve(id: string) {
    setResolvingId(id);
    try {
      const res = await fetch("/api/admin/reports/" + id + "/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: { message: string } };
      if (res.ok && json.ok) {
        await fetchReports();
      } else {
        setError(json?.error?.message ?? "Failed to resolve report.");
      }
    } catch {
      setError("Failed to resolve report.");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <PageContainer>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-all duration-200">
            &larr; Admin
          </Link>
          <h1 className="text-2xl font-bold text-brand">Reports</h1>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("OPEN")}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
              filter === "OPEN"
                ? "border-brand bg-brand text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            OPEN
          </button>
          <button
            type="button"
            onClick={() => setFilter("RESOLVED")}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
              filter === "RESOLVED"
                ? "border-brand bg-brand text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            RESOLVED
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-card">
          {error && (
            <p className="px-6 py-4 text-sm text-red-600">{error}</p>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <p className="text-sm text-gray-500">Loading…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <p className="text-sm text-gray-500">No reports.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Listing</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Reported by</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-b border-gray-200 bg-white last:border-b-0">
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={"/listings/" + r.listing_id} className="font-medium text-accent hover:underline">
                          {r.listing_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {r.reported_by_user_id}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-gray-500" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.status === "OPEN"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "OPEN" && (
                          <button
                            type="button"
                            disabled={resolvingId === r.id}
                            onClick={() => handleResolve(r.id)}
                            className="inline-flex items-center justify-center rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                          >
                            {resolvingId === r.id ? "…" : "Mark resolved"}
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
