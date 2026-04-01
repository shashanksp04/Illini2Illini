"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";
import { AuthCard } from "@/components/auth/AuthCard";

type ApiErrorCode = "INVALID_EMAIL_DOMAIN" | "VALIDATION_ERROR" | "AUTH_CONFLICT" | "SERVER_ERROR" | string;
type ApiResponse = { ok: true; data?: { needs_verification?: boolean } } | { ok: false; error?: { code: ApiErrorCode; message: string } };

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json: ApiResponse = (await res.json()) as ApiResponse;
      if (!res.ok || !json.ok) {
        setError((!json.ok && json.error?.message) || "Unable to create account. Please try again.");
        return;
      }
      try {
        sessionStorage.setItem("signup_email", email.trim());
      } catch {
        // ignore
      }
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex justify-center py-6 md:py-12">
        <AuthCard>
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-brand">Create your account</h1>
              <p className="text-sm text-gray-500">
                Use your <span className="font-medium text-gray-600">@illinois.edu</span> email to get started.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="netid@illinois.edu"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-accent focus:bg-white focus:outline-none focus:shadow-input-focus"
                />
                <p className="text-xs text-gray-400">Must be a UIUC @illinois.edu address.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-accent focus:bg-white focus:outline-none focus:shadow-input-focus"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
              >
                {submitting ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-accent transition-colors hover:text-accent-hover">
                Sign in
              </Link>
            </p>
          </div>
        </AuthCard>
      </div>
    </PageContainer>
  );
}
