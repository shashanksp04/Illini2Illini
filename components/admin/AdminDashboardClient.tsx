"use client";

import Link from "next/link";

import { PageContainer } from "@/components/layout/PageContainer";

export function AdminDashboardClient() {
  return (
    <PageContainer>
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-brand md:text-3xl">Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Manage reports, users, and listings.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/admin/reports"
            className="group flex items-start gap-4 rounded-2xl border border-gray-200/60 bg-white px-5 py-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <span className="text-lg text-amber-600" aria-hidden>&#9873;</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-accent transition-colors">
                Reports
              </span>
              <p className="mt-0.5 text-sm text-gray-500">View and resolve listing reports</p>
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="group flex items-start gap-4 rounded-2xl border border-gray-200/60 bg-white px-5 py-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <span className="text-lg text-blue-600" aria-hidden>&#9775;</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-accent transition-colors">
                Users
              </span>
              <p className="mt-0.5 text-sm text-gray-500">Manage users and bans</p>
            </div>
          </Link>
          <Link
            href="/admin/listings"
            className="group flex items-start gap-4 rounded-2xl border border-gray-200/60 bg-white px-5 py-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
              <span className="text-lg text-green-600" aria-hidden>&#8962;</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-accent transition-colors">
                Listings
              </span>
              <p className="mt-0.5 text-sm text-gray-500">View and moderate listings</p>
            </div>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
