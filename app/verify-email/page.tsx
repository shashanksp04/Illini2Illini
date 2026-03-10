"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("email") ?? "";
      if (fromQuery) {
        setEmail(fromQuery);
      }
    } catch {
      // ignore
    }
  }, []);

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);
    if (!email) {
      setError("Email is required to resend verification.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json.ok) {
        const message =
          json.error?.message ?? "Unable to resend verification email. Please try again.";
        setError(message);
        return;
      }
      setStatus("Verification email sent.");
    } catch {
      setError("Unable to resend verification email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex justify-center py-8 md:py-12">
        <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-illini-blue md:text-3xl">Verify your email</h1>
            <p className="text-sm text-gray-500">
              Check your inbox for a verification link sent to{" "}
              <span className="font-medium">{email || "your email"}</span>.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleResend}>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              />
              <p className="text-xs text-gray-500">
                Use the same <span className="font-medium">@illinois.edu</span> address you signed up with.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {status && (
              <p className="text-sm text-green-600">{status}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              {submitting ? "Resending..." : "Resend verification email"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already verified?{" "}
            <Link href="/login" className="font-medium text-illini-blue hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </PageContainer>
  );
}

