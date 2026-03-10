"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";

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

type RevealState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "revealed"; seller_email: string }
  | { kind: "error"; message: string };

export function ContactSellerClient({ listingId }: { listingId: string }) {
  const [gate, setGate] = useState<GateState>({ kind: "loading" });
  const [reveal, setReveal] = useState<RevealState>({ kind: "idle" });
  const [copied, setCopied] = useState(false);

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

  async function handleReveal() {
    setReveal({ kind: "loading" });
    try {
      const res = await fetch(`/api/listings/${listingId}/reveal-contact`, {
        method: "POST",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { seller_email?: string };
        error?: { code: string; message: string };
      };
      if (!res.ok || !json.ok) {
        const code = json?.error?.code;
        const message = json?.error?.message ?? "Something went wrong.";
        if (res.status === 404 || code === "NOT_FOUND") {
          setReveal({ kind: "error", message: "Listing not found." });
          return;
        }
        if (res.status === 403) {
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
        }
        setReveal({ kind: "error", message });
        return;
      }
      const email = json.data?.seller_email;
      if (!email) {
        setReveal({ kind: "error", message: "Could not load seller email." });
        return;
      }
      setReveal({ kind: "revealed", seller_email: email });
    } catch {
      setReveal({
        kind: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  async function handleCopyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (gate.kind === "loading") {
    return (
      <PageContainer>
        <p className="text-sm text-gray-500">Loading…</p>
      </PageContainer>
    );
  }

  if (gate.kind === "unauth") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Log in to contact sellers</h1>
            <p className="text-sm text-gray-500">
              You need to be logged in with a verified UIUC account to reveal seller contact info.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Log in
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "needsVerify") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Verify your email first</h1>
            <p className="text-sm text-gray-500">
              Verify your UIUC email before you can contact sellers.
            </p>
            <Link
              href={
                gate.email
                  ? `/verify-email?email=${encodeURIComponent(gate.email)}`
                  : "/verify-email"
              }
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Verify email
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "needsProfile") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Complete your profile first</h1>
            <p className="text-sm text-gray-500">
              Finish setting up your profile before you can contact sellers.
            </p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Complete profile
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "banned") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Account restricted</h1>
            <p className="text-sm text-gray-500">
              Your account is restricted from contacting sellers.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl space-y-6 md:space-y-8">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm space-y-6">
          <h1 className="text-2xl font-semibold text-illini-blue">Contact seller</h1>

          {reveal.kind === "error" && (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{reveal.message}</p>
              {reveal.message === "Listing not found." && (
                <Link href="/listings" className="text-sm font-medium text-illini-orange hover:underline">
                  Browse listings
                </Link>
              )}
            </div>
          )}

          {reveal.kind === "revealed" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-1 text-sm font-medium text-gray-700">Seller email</p>
                <p className="break-all text-base text-gray-900">{reveal.seller_email}</p>
                <button
                  type="button"
                  onClick={() => handleCopyEmail(reveal.seller_email)}
                  className="mt-3 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  {copied ? "Copied!" : "Copy email"}
                </button>
              </div>
              <Link
                href={`/listings/${listingId}`}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                Back to listing
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Safety reminder</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-500">
                  <li>Meet in a public place when possible.</li>
                  <li>Never send money before seeing the unit.</li>
                  <li>If something feels off, report the listing.</li>
                </ul>
              </div>
              <button
                type="button"
                disabled={reveal.kind === "loading"}
                onClick={handleReveal}
                className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
              >
                {reveal.kind === "loading" ? "Loading…" : "Reveal email"}
              </button>
              <div>
                <Link
                  href={`/listings/${listingId}`}
                  className="inline-block rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  Back to listing
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
