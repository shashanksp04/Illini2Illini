"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MeData = {
  email: string;
  email_verified: boolean;
  is_profile_complete: boolean;
  is_banned: boolean;
};

type MeResponse =
  | { ok: true; data: MeData }
  | { ok: false; error?: { code: string; message: string } };

type GateState =
  | { kind: "loading" }
  | { kind: "unauth" }
  | { kind: "needsVerify"; email: string }
  | { kind: "needsProfile" }
  | { kind: "banned" }
  | { kind: "ready" };

const MAX_REASON_LENGTH = 1000;

export function ReportListingClient({ listingId }: { listingId: string }) {
  const [gate, setGate] = useState<GateState>({ kind: "loading" });
  const [reason, setReason] = useState("");
  const [submitState, setSubmitState] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "success" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await fetch("/api/me");
        const json = (await res.json()) as MeResponse;
        if (!res.ok || !json.ok) {
          if (!cancelled) setGate({ kind: "unauth" });
          return;
        }
        const data = json.data;
        if (!data.email_verified) {
          if (!cancelled) setGate({ kind: "needsVerify", email: data.email });
          return;
        }
        if (!data.is_profile_complete) {
          if (!cancelled) setGate({ kind: "needsProfile" });
          return;
        }
        if (data.is_banned) {
          if (!cancelled) setGate({ kind: "banned" });
          return;
        }
        if (!cancelled) setGate({ kind: "ready" });
      } catch {
        if (!cancelled) setGate({ kind: "unauth" });
      }
    }
    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setSubmitState({
        kind: "error",
        message: "Please provide a reason for your report.",
      });
      return;
    }
    if (trimmed.length > MAX_REASON_LENGTH) {
      setSubmitState({
        kind: "error",
        message: `Reason must be at most ${MAX_REASON_LENGTH} characters.`,
      });
      return;
    }
    setSubmitState({ kind: "submitting" });
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, reason: trimmed }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: { code: string; message: string };
      };
      if (res.ok && json.ok) {
        setSubmitState({ kind: "success" });
        return;
      }
      const code = json?.error?.code;
      const message = json?.error?.message ?? "Something went wrong. Please try again.";
      if (res.status === 409 || code === "ALREADY_REPORTED") {
        setSubmitState({ kind: "error", message: "You already reported this listing." });
        return;
      }
      if (res.status === 404 || code === "NOT_FOUND") {
        setSubmitState({ kind: "error", message: "Listing not found." });
        return;
      }
      if (res.status === 400 || code === "VALIDATION_ERROR") {
        setSubmitState({ kind: "error", message });
        return;
      }
      if (res.status === 401 || res.status === 403) {
        if (code === "EMAIL_NOT_VERIFIED") {
          setGate({ kind: "needsVerify", email: "" });
          return;
        }
        if (code === "PROFILE_INCOMPLETE") {
          setGate({ kind: "needsProfile" });
          return;
        }
        if (code === "BANNED") {
          setGate({ kind: "banned" });
          return;
        }
        setGate({ kind: "unauth" });
        return;
      }
      setSubmitState({ kind: "error", message: "Something went wrong. Please try again." });
    } catch {
      setSubmitState({
        kind: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  if (gate.kind === "loading") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <p className="text-base" style={{ color: "#6B7280" }}>
          Loading…
        </p>
      </main>
    );
  }

  if (gate.kind === "unauth") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-2xl">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Log in to report listings
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              You need to be logged in with a verified UIUC account to report listings.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium text-white transition-shadow hover:shadow-md"
              style={{ backgroundColor: "#13294B" }}
            >
              Log in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (gate.kind === "needsVerify") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-2xl">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Verify your email first
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Verify your UIUC email before you can report listings.
            </p>
            <Link
              href={
                gate.email
                  ? `/verify-email?email=${encodeURIComponent(gate.email)}`
                  : "/verify-email"
              }
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium text-white transition-shadow hover:shadow-md"
              style={{ backgroundColor: "#13294B" }}
            >
              Verify email
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (gate.kind === "needsProfile") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-2xl">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Complete your profile first
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Finish setting up your profile before you can report listings.
            </p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium text-white transition-shadow hover:shadow-md"
              style={{ backgroundColor: "#13294B" }}
            >
              Complete profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (gate.kind === "banned") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-2xl">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Account restricted
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Your account is restricted from reporting listings.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (submitState.kind === "success") {
    return (
      <main
        className="min-h-screen px-4 py-6 flex items-center justify-center"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-2xl">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 space-y-6">
            <p className="text-base font-medium" style={{ color: "#16A34A" }}>
              Report submitted.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/listings/${listingId}`}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-md"
                style={{ backgroundColor: "#13294B" }}
              >
                Back to listing
              </Link>
              <Link
                href="/listings"
                className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium border border-[#E5E7EB] bg-white"
                style={{ color: "#111827" }}
              >
                Browse listings
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-4 py-6"
      style={{ backgroundColor: "#F8F9FB" }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 space-y-6">
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
            Report listing
          </h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Reports help keep the marketplace safe.
          </p>

          {submitState.kind === "error" && (
            <div className="space-y-2">
              <p className="text-sm" style={{ color: "#DC2626" }}>
                {submitState.message}
              </p>
              {submitState.message === "Listing not found." && (
                <Link
                  href="/listings"
                  className="text-sm font-medium"
                  style={{ color: "#E84A27" }}
                >
                  Browse listings
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="report-reason" className="block text-sm font-medium mb-1.5" style={{ color: "#111827" }}>
                Reason (required)
              </label>
              <textarea
                id="report-reason"
                required
                maxLength={MAX_REASON_LENGTH}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                className="w-full rounded-lg border px-3 py-2 text-base resize-y focus:outline-none focus:ring-2 focus:ring-[#E84A27]"
                style={{
                  borderColor: "#E5E7EB",
                  color: "#111827",
                  backgroundColor: "#FFFFFF",
                }}
                placeholder="Describe why you're reporting this listing…"
              />
              <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>
                {reason.length} / {MAX_REASON_LENGTH} characters
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitState.kind === "submitting"}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-md disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#E84A27] focus:ring-offset-2"
                style={{ backgroundColor: "#13294B" }}
              >
                {submitState.kind === "submitting" ? "Submitting…" : "Submit report"}
              </button>
              <Link
                href={`/listings/${listingId}`}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#E84A27] focus:ring-offset-2"
                style={{ color: "#111827", borderColor: "#E5E7EB" }}
              >
                Back to listing
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
