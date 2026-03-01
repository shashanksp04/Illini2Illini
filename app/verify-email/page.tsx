"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

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
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#F8F9FB" }}
    >
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold" style={{ color: "#111827" }}>
              Verify your email
            </h1>
            <p className="text-base" style={{ color: "#6B7280" }}>
              Check your inbox for a verification link sent to{" "}
              <span className="font-medium">{email || "your email"}</span>.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleResend}>
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium"
                style={{ color: "#111827" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ color: "#111827" }}
              />
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Use the same <span className="font-medium">@illinois.edu</span> address you signed up with.
              </p>
            </div>

            {error && (
              <p className="text-sm" style={{ color: "#DC2626" }}>
                {error}
              </p>
            )}
            {status && (
              <p className="text-sm" style={{ color: "#16A34A" }}>
                {status}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-md disabled:opacity-70"
              style={{ backgroundColor: "#13294B" }}
            >
              {submitting ? "Resending..." : "Resend verification email"}
            </button>
          </form>

          <p className="text-sm text-center" style={{ color: "#6B7280" }}>
            Already verified?{" "}
            <Link
              href="/login"
              className="font-medium hover:underline"
              style={{ color: "#13294B" }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

