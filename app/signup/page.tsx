"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";

type ApiErrorCode =
  | "INVALID_EMAIL_DOMAIN"
  | "VALIDATION_ERROR"
  | "AUTH_CONFLICT"
  | "SERVER_ERROR"
  | string;

type ApiResponse =
  | { ok: true; data?: { needs_verification?: boolean } }
  | { ok: false; error?: { code: ApiErrorCode; message: string } };

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
        const message =
          (!json.ok && json.error?.message) ||
          "Unable to create account. Please try again.";
        setError(message);
        return;
      }
      const target = `/verify-email?email=${encodeURIComponent(email)}`;
      router.push(target);
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex justify-center py-8 md:py-12">
        <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-illini-blue md:text-3xl">Create your account</h1>
            <p className="text-sm text-gray-500">
              Use your <span className="font-medium">@illinois.edu</span> email to sign up.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              />
              <p className="text-xs text-gray-500">
                Must be a UIUC <span className="font-medium">@illinois.edu</span> address.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-illini-blue hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </PageContainer>
  );
}

