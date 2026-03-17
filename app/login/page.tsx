import Link from "next/link";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/PageContainer";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "./LoginForm";

function LoginSkeleton() {
  return (
    <AuthCard>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto h-4 w-64 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-12 animate-pulse rounded-xl bg-gray-200" />
        </div>
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-accent transition-colors hover:text-accent-hover">
            Create account
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <PageContainer>
      <div className="flex justify-center py-6 md:py-12">
        <Suspense fallback={<LoginSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </PageContainer>
  );
}
