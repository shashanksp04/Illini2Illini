import Link from "next/link";

import { PageContainer } from "@/components/layout/PageContainer";
import { AuthCard } from "@/components/auth/AuthCard";

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex justify-center py-12 md:py-20">
        <AuthCard>
          <div className="flex flex-col items-center text-center space-y-4">
            <span className="text-5xl font-bold text-gray-200/80">404</span>
            <h1 className="text-xl font-bold text-brand">
              Page not found
            </h1>
            <p className="text-sm text-gray-500">
              The listing or page you&apos;re looking for doesn&apos;t exist or was removed.
            </p>
            <Link
              href="/listings"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              Browse listings
            </Link>
          </div>
        </AuthCard>
      </div>
    </PageContainer>
  );
}
