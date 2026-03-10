"use client";

import Link from "next/link";

import { PageContainer } from "@/components/layout/PageContainer";

export function AdminDashboardClient() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-illini-blue">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-1">
        <Link
          href="/admin/reports"
          className="block rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="text-base font-medium text-gray-900">Reports</span>
          <p className="mt-1 text-sm text-gray-500">View and resolve listing reports</p>
        </Link>
        <Link
          href="/admin/users"
          className="block rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="text-base font-medium text-gray-900">Users</span>
          <p className="mt-1 text-sm text-gray-500">Manage users and bans</p>
        </Link>
        <Link
          href="/admin/listings"
          className="block rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="text-base font-medium text-gray-900">Listings</span>
          <p className="mt-1 text-sm text-gray-500">View and moderate listings</p>
        </Link>
      </div>
    </PageContainer>
  );
}
