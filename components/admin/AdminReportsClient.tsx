"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

  const openStyle = { backgroundColor: "#FEF3C7", color: "#B45309" };
  const resolvedStyle = { backgroundColor: "#F3F4F6", color: "#6B7280" };

  return (
    <main className="min-h-screen px-4 py-8" style={{ backgroundColor: "#F8F9FB" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin" className="text-sm font-medium" style={{ color: "#6B7280" }}>
            ← Admin
          </Link>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
            Reports
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("OPEN")}
            className="rounded-lg px-4 py-2 text-sm font-medium border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#E84A27] focus:ring-offset-2"
            style={{
              backgroundColor: filter === "OPEN" ? "#13294B" : "white",
              color: filter === "OPEN" ? "white" : "#111827",
            }}
          >
            OPEN
          </button>
          <button
            type="button"
            onClick={() => setFilter("RESOLVED")}
            className="rounded-lg px-4 py-2 text-sm font-medium border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#E84A27] focus:ring-offset-2"
            style={{
              backgroundColor: filter === "RESOLVED" ? "#13294B" : "white",
              color: filter === "RESOLVED" ? "white" : "#111827",
            }}
          >
            RESOLVED
          </button>
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
              No reports.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB]">
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Created</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Listing</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Reported by</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Reason</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Status</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-b border-[#E5E7EB]">
                      <td className="px-4 py-3" style={{ color: "#6B7280" }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={"/listings/" + r.listing_id} className="font-medium" style={{ color: "#E84A27" }}>
                          {r.listing_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#111827" }}>
                        {r.reported_by_user_id}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: "#6B7280" }} title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                          style={r.status === "OPEN" ? openStyle : resolvedStyle}
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
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#E84A27] focus:ring-offset-2"
                            style={{ backgroundColor: "#13294B" }}
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
    </main>
  );
}
