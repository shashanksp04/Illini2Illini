"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json.ok) {
        const message =
          json.error?.message ?? "Unable to log in. Please check your credentials and try again.";
        setError(message);
        return;
      }
      router.push("/listings");
    } catch {
      setError("Unable to log in. Please try again.");
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
              Log in
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Use your UIUC <span className="font-medium">@illinois.edu</span> email.
            </p>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#DC2626" }}>
              {error}
            </p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ color: "#111827" }}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
                style={{ color: "#111827" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ color: "#111827" }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-md disabled:opacity-70"
              style={{ backgroundColor: "#13294B" }}
            >
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-sm text-center" style={{ color: "#6B7280" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium hover:underline"
              style={{ color: "#13294B" }}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

