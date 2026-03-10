"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MeData = {
  email_verified: boolean;
  is_profile_complete: boolean;
};

type MeResponse =
  | { ok: true; data: MeData }
  | { ok: false; error?: { code: string; message: string } };

type CtaState =
  | { kind: "public" }
  | { kind: "needs_profile" }
  | { kind: "verified_complete" }
  | { kind: "needs_verification" };

function resolveState(resp: MeResponse): CtaState {
  if (!resp.ok) return { kind: "public" };
  const { email_verified, is_profile_complete } = resp.data;
  if (!email_verified) return { kind: "needs_verification" };
  if (!is_profile_complete) return { kind: "needs_profile" };
  return { kind: "verified_complete" };
}

export function LandingCtas() {
  const [state, setState] = useState<CtaState>({ kind: "public" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/me", { method: "GET" });
        if (!res.ok) {
          if (!cancelled) {
            setState({ kind: "public" });
            setLoaded(true);
          }
          return;
        }
        const json = (await res.json()) as MeResponse;
        if (!cancelled) {
          setState(resolveState(json));
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setState({ kind: "public" });
          setLoaded(true);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveState = loaded ? state : { kind: "public" as const };

  const primaryClass =
    "inline-flex items-center justify-center rounded-lg bg-illini-orange px-5 py-3 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2";
  const secondaryClass =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300";

  const rowClass = "flex flex-col gap-4 justify-center sm:flex-row";

  if (effectiveState.kind === "needs_profile") {
    return (
      <div className={rowClass}>
        <Link href="/profile/setup" className={primaryClass}>
          Complete your profile
        </Link>
        <Link href="/listings" className={secondaryClass}>
          Browse listings
        </Link>
      </div>
    );
  }

  if (effectiveState.kind === "verified_complete") {
    return (
      <div className={rowClass}>
        <Link href="/listings" className={primaryClass}>
          Browse listings
        </Link>
        <Link href="/me/listings" className={secondaryClass}>
          My listings
        </Link>
      </div>
    );
  }

  if (effectiveState.kind === "needs_verification") {
    return (
      <div className={rowClass}>
        <Link href="/verify-email" className={primaryClass}>
          Verify your email
        </Link>
        <Link href="/listings" className={secondaryClass}>
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className={rowClass}>
      <Link href="/listings" className={primaryClass}>
        Browse listings
      </Link>
      <Link href="/login" className={secondaryClass}>
        Log in
      </Link>
    </div>
  );
}
