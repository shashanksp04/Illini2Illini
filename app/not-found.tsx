import Link from "next/link";

import { PageContainer } from "@/components/layout/PageContainer";

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
        <h1 className="text-2xl font-semibold text-illini-blue">
          Page not found
        </h1>
        <p className="mt-2 text-base text-gray-500">
        The listing or page you’re looking for doesn’t exist or was removed.
        </p>
        <Link
          href="/listings"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
        >
          Browse listings
        </Link>
      </div>
    </PageContainer>
  );
}
