"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";
import { AuthCard } from "@/components/auth/AuthCard";

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

function GateScreen({ title, description, cta }: { title: string; description: string; cta?: React.ReactNode }) {
  return (
    <PageContainer>
      <div className="flex justify-center py-8 md:py-12">
        <AuthCard>
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-brand">{title}</h1>
            <p className="text-sm text-gray-500">{description}</p>
            {cta}
          </div>
        </AuthCard>
      </div>
    </PageContainer>
  );
}

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
      <PageContainer>
        <p className="text-sm text-gray-500">Loading&hellip;</p>
      </PageContainer>
    );
  }

  if (gate.kind === "unauth") {
    return (
      <GateScreen
        title="Log in to report listings"
        description="You need to be logged in with a verified UIUC account to report listings."
        cta={
          <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            Sign in
          </Link>
        }
      />
    );
  }

  if (gate.kind === "needsVerify") {
    return (
      <GateScreen
        title="Verify your email first"
        description="Verify your UIUC email before you can report listings."
        cta={
          <Link
            href={gate.email ? `/verify-email?email=${encodeURIComponent(gate.email)}` : "/verify-email"}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Verify email
          </Link>
        }
      />
    );
  }

  if (gate.kind === "needsProfile") {
    return (
      <GateScreen
        title="Complete your profile first"
        description="Finish setting up your profile before you can report listings."
        cta={
          <Link href="/profile/setup" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            Complete profile
          </Link>
        }
      />
    );
  }

  if (gate.kind === "banned") {
    return (
      <GateScreen
        title="Account restricted"
        description="Your account is restricted from reporting listings."
      />
    );
  }

  if (submitState.kind === "success") {
    return (
      <PageContainer>
        <div className="flex justify-center py-8 md:py-12">
          <AuthCard>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 shadow-sm">
                <span className="text-xl text-green-600" aria-hidden>&#10003;</span>
              </div>
              <h1 className="text-xl font-bold text-brand">Report submitted</h1>
              <p className="text-sm text-gray-500">
                Thank you for helping keep the marketplace safe. Our team will review this report.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/listings/${listingId}`}
                  className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                >
                  Back to listing
                </Link>
                <Link
                  href="/listings"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  Browse listings
                </Link>
              </div>
            </div>
          </AuthCard>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gray-200/60 bg-white px-6 py-8 shadow-card space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-brand">Report listing</h1>
            <p className="mt-1 text-sm text-gray-500">
              Reports help keep the marketplace safe for all students.
            </p>
          </div>

          {submitState.kind === "error" && (
            <div className="rounded-xl bg-red-50 px-3 py-2">
              <p className="text-sm text-red-600">{submitState.message}</p>
              {submitState.message === "Listing not found." && (
                <Link href="/listings" className="mt-1 inline-block text-sm font-medium text-accent hover:underline">
                  Browse listings
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="report-reason" className="mb-1.5 block text-sm font-medium text-gray-700">
                Reason
              </label>
              <textarea
                id="report-reason"
                required
                maxLength={MAX_REASON_LENGTH}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-white focus:shadow-input-focus transition-all duration-200"
                placeholder="Describe why you're reporting this listing..."
              />
              <p className="mt-1 text-xs text-gray-400">
                {reason.length} / {MAX_REASON_LENGTH}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitState.kind === "submitting"}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                {submitState.kind === "submitting" ? "Submitting..." : "Submit report"}
              </button>
              <Link
                href={`/listings/${listingId}`}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                Back to listing
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
