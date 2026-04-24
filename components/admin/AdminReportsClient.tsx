"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";

type ReportItem = {
  id: string;
  listing_id: string;
  reported_by_user_id: string;
  reported_by_username: string;
  reason: string;
  status: string;
  created_at: string;
  report_count: number;
  listing_status: string;
};

type ReportStatusFilter = "OPEN" | "RESOLVED";

export function AdminReportsClient() {
  const [filter, setFilter] = useState<ReportStatusFilter>("OPEN");
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

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

  async function handleDeleteListing(listingId: string) {
    setDeletingListingId(listingId);
    try {
      const res = await fetch("/api/admin/listings/" + listingId, {
        method: "DELETE",
      });
      const json = (await res.json()) as { ok?: boolean; error?: { message: string } };
      if (res.ok && json.ok) {
        await fetchReports();
      } else {
        setError(json?.error?.message ?? "Failed to delete listing.");
      }
    } catch {
      setError("Failed to delete listing.");
    } finally {
      setDeletingListingId(null);
    }
  }

  function handleOpenReason(report: ReportItem, triggerEl: HTMLButtonElement) {
    lastTriggerRef.current = triggerEl;
    setSelectedReport(report);
  }

  function handleCloseReason() {
    setSelectedReport(null);
    lastTriggerRef.current?.focus();
  }

  useEffect(() => {
    if (!selectedReport) return;

    closeButtonRef.current?.focus();
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedReport(null);
        lastTriggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [selectedReport]);

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
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Report count</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Listing status</th>
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
                        {r.reported_by_username || r.reported_by_user_id}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-gray-500">
                        {r.reason}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{r.report_count}</td>
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
                      <td className="px-4 py-3 text-gray-900">{r.listing_status}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => handleOpenReason(r, event.currentTarget)}
                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                          >
                            View reason
                          </button>
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
                          <button
                            type="button"
                            disabled={deletingListingId === r.listing_id || r.listing_status === "DELETED"}
                            onClick={() => handleDeleteListing(r.listing_id)}
                            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            {deletingListingId === r.listing_id ? "…" : "Delete listing"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseReason();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-reason-title"
            className="w-full max-w-2xl rounded-2xl bg-white shadow-card"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 id="report-reason-title" className="text-lg font-semibold text-gray-900">
                Report reason
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleCloseReason}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 px-6 py-4">
              <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                <p>
                  <span className="font-medium text-gray-900">Created:</span>{" "}
                  {new Date(selectedReport.created_at).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Reported by:</span>{" "}
                  {selectedReport.reported_by_username || selectedReport.reported_by_user_id}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Status:</span>{" "}
                  {selectedReport.status}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Listing status:</span>{" "}
                  {selectedReport.listing_status}
                </p>
                <p className="md:col-span-2">
                  <span className="font-medium text-gray-900">Listing:</span>{" "}
                  <Link
                    href={"/listings/" + selectedReport.listing_id}
                    className="font-medium text-accent hover:underline"
                  >
                    {selectedReport.listing_id}
                  </Link>
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-2 text-sm font-medium text-gray-900">Full reason</p>
                <p className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words text-sm text-gray-700">
                  {selectedReport.reason}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
