"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MeData = { email_verified: boolean; is_profile_complete: boolean };
type MeResponse = { ok: true; data: MeData } | { ok: false; error?: { code: string; message: string } };
type CtaState = "public" | "needs_profile" | "verified_complete" | "needs_verification";

function resolveState(resp: MeResponse): CtaState {
  if (!resp.ok) return "public";
  if (!resp.data.email_verified) return "needs_verification";
  if (!resp.data.is_profile_complete) return "needs_profile";
  return "verified_complete";
}

const pri = "inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2";
const sec = "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-gray-200";
const row = "flex flex-col items-center justify-center gap-3 sm:flex-row";

export function LandingCtas() {
  const [state, setState] = useState<CtaState>("public");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) { if (!c) { setState("public"); setLoaded(true); } return; }
        const json = (await res.json()) as MeResponse;
        if (!c) { setState(resolveState(json)); setLoaded(true); }
      } catch { if (!c) { setState("public"); setLoaded(true); } }
    })();
    return () => { c = true; };
  }, []);

  const s = loaded ? state : "public";

  if (s === "needs_profile")
    return <div className={row}><Link href="/profile/setup" className={pri}>Complete your profile</Link><Link href="/listings" className={sec}>Browse listings</Link></div>;
  if (s === "verified_complete")
    return <div className={row}><Link href="/listings" className={pri}>Browse listings</Link><Link href="/me/listings" className={sec}>My listings</Link></div>;
  if (s === "needs_verification")
    return <div className={row}><Link href="/verify-email" className={pri}>Verify your email</Link><Link href="/listings" className={sec}>Browse listings</Link></div>;
  return <div className={row}><Link href="/listings" className={pri}>Browse listings</Link><Link href="/login" className={sec}>Log in</Link></div>;
}
