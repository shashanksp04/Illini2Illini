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
              Log in to contact sellers
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              You need to be logged in with a verified UIUC account to reveal seller contact info.
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
              Verify your UIUC email before you can contact sellers.
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
              Finish setting up your profile before you can contact sellers.
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
              Your account is restricted from contacting sellers.
            </p>
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 space-y-6">
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
            Contact seller
          </h1>

          {reveal.kind === "error" && (
            <div className="space-y-2">
              <p className="text-sm" style={{ color: "#DC2626" }}>
                {reveal.message}
              </p>
              {reveal.message === "Listing not found." && (
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

          {reveal.kind === "revealed" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#E5E7EB] p-4 bg-[#F8F9FB]">
                <p className="text-sm font-medium mb-1" style={{ color: "#111827" }}>
                  Seller email
                </p>
                <p className="text-base break-all" style={{ color: "#111827" }}>
                  {reveal.seller_email}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyEmail(reveal.seller_email)}
                  className="mt-3 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium border border-[#E5E7EB] bg-white"
                  style={{ color: "#111827" }}
                >
                  {copied ? "Copied!" : "Copy email"}
                </button>
              </div>
              <Link
                href={`/listings/${listingId}`}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium border border-[#E5E7EB] bg-white"
                style={{ color: "#111827" }}
              >
                Back to listing
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-[#E5E7EB] p-4 space-y-2">
                <p className="text-sm font-medium" style={{ color: "#111827" }}>
                  Safety reminder
                </p>
                <ul className="text-sm list-disc list-inside space-y-1" style={{ color: "#6B7280" }}>
                  <li>Meet in a public place when possible.</li>
                  <li>Never send money before seeing the unit.</li>
                  <li>If something feels off, report the listing.</li>
                </ul>
              </div>
              <button
                type="button"
                disabled={reveal.kind === "loading"}
                onClick={handleReveal}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-md disabled:opacity-70"
                style={{ backgroundColor: "#13294B" }}
              >
                {reveal.kind === "loading" ? "Loading…" : "Reveal email"}
              </button>
              <div>
                <Link
                  href={`/listings/${listingId}`}
                  className="text-sm font-medium rounded-lg px-4 py-2 border border-[#E5E7EB] bg-white inline-block"
                  style={{ color: "#111827" }}
                >
                  Back to listing
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
