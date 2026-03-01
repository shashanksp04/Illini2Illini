"use client";

import Link from "next/link";

export function AdminDashboardClient() {
  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{ backgroundColor: "#F8F9FB" }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
          Admin
        </h1>
        <div className="grid gap-4 sm:grid-cols-1">
          <Link
            href="/admin/reports"
            className="block rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-5 hover:shadow-md transition-shadow"
          >
            <span className="text-base font-medium" style={{ color: "#111827" }}>
              Reports
            </span>
            <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
              View and resolve listing reports
            </p>
          </Link>
          <Link
            href="/admin/users"
            className="block rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-5 hover:shadow-md transition-shadow"
          >
            <span className="text-base font-medium" style={{ color: "#111827" }}>
              Users
            </span>
            <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
              Manage users and bans
            </p>
          </Link>
          <Link
            href="/admin/listings"
            className="block rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-5 hover:shadow-md transition-shadow"
          >
            <span className="text-base font-medium" style={{ color: "#111827" }}>
              Listings
            </span>
            <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
              View and moderate listings
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
