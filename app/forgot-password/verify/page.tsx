"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";
import { AuthCard } from "@/components/auth/AuthCard";

function ForgotPasswordVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery);
      return;
    }
    try {
      const stored = sessionStorage.getItem("reset_password_email");
      if (stored) setEmail(stored);
    } catch {
      // ignore
    }
  }, [emailFromQuery]);

  async function requestCode() {
    if (!email) return;
    setStatus(null);
    setError(null);
    setResending(true);
    try {
      const res = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: { message?: string } };
      if (!res.ok || !json.ok) {
        setError(json.error?.message ?? "Unable to resend code. Please try again.");
        return;
      }
      setStatus("If an account exists, a new code was sent.");
    } catch {
      setError("Unable to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    if (!email) {
      setError("Email is missing. Go back and enter your email.");
      return;
    }
    const code = otp.replace(/\s/g, "");
    if (code.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code }),
        credentials: "same-origin",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: { code?: string; message?: string };
      };
      if (!res.ok || !json.ok) {
        setError(json.error?.message ?? "Unable to verify code. Please try again.");
        return;
      }
      try {
        sessionStorage.removeItem("reset_password_email");
      } catch {
        // ignore
      }
      router.replace("/reset-password");
    } catch {
      setError("Unable to verify code. Please try again.");
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
                &#128273;
              </div>
              <h1 className="text-2xl font-bold text-brand">Enter verification code</h1>
              <p className="text-sm text-gray-500">
                We sent a code to <span className="font-medium text-gray-700">{email || "your email"}</span>. Enter it
                below to continue.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  6-digit code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={12}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^\d\s]/g, ""))}
                  placeholder="000000"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-center text-lg tracking-widest text-gray-700 placeholder-gray-400 focus:border-accent focus:bg-white focus:outline-none focus:shadow-input-focus transition-all duration-200"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-3 py-2">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {status && (
                <div className="rounded-xl bg-green-50 px-3 py-2">
                  <p className="text-sm text-green-600">{status}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
              >
                {submitting ? "Verifying…" : "Verify"}
              </button>
            </form>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={resending || !email}
                onClick={() => void requestCode()}
                className="text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-50"
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
              <Link
                href="/forgot-password"
                className="text-center text-sm text-gray-500 hover:text-gray-700 sm:text-right"
              >
                Use a different email
              </Link>
            </div>

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

export default function ForgotPasswordVerifyPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <div className="flex justify-center py-12">
            <div className="h-10 w-48 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </PageContainer>
      }
    >
      <ForgotPasswordVerifyContent />
    </Suspense>
  );
}
