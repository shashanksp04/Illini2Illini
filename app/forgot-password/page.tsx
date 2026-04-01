"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";
import { AuthCard } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!email) {
      setError("Email is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: { message?: string } };
      if (!res.ok || !json.ok) {
        const message = json.error?.message ?? "Unable to send code. Please try again.";
        setError(message);
        return;
      }
      try {
        sessionStorage.setItem("reset_password_email", email.trim());
      } catch {
        // ignore
      }
      const q = encodeURIComponent(email.trim());
      router.push(`/forgot-password/verify?email=${q}`);
    } catch {
      setError("Unable to send code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex justify-center py-4 md:py-8">
        <AuthCard>
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-accent text-xl shadow-glow"
                aria-hidden
              >
                &#9993;
              </div>
              <h1 className="text-2xl font-bold text-brand">Reset your password</h1>
              <p className="text-sm text-gray-500">
                Enter your <span className="font-medium">@illinois.edu</span> email and we&apos;ll send you a
                verification code to reset your password.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="netid@illinois.edu"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-accent focus:bg-white focus:outline-none focus:shadow-input-focus transition-all duration-200"
                />
                <p className="text-xs text-gray-500">
                  Use the same <span className="font-medium">@illinois.edu</span> address you signed up with.
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-3 py-2">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
              >
                {submitting ? "Sending…" : "Send code"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500">
              Remember your password?{" "}
              <Link href="/login" className="font-medium text-accent hover:text-accent-hover transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </AuthCard>
      </div>
    </PageContainer>
  );
}
