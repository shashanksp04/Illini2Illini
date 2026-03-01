"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

type MeData = {
  email: string;
  email_verified: boolean;
  is_profile_complete: boolean;
  is_banned: boolean;
  role: string;
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
  | { kind: "notAdmin" }
  | { kind: "ready" };

export function AdminGate({ children }: { children: ReactNode }) {
  const [gate, setGate] = useState<GateState>({ kind: "loading" });

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
        if (data.role !== "ADMIN") {
          if (!cancelled) setGate({ kind: "notAdmin" });
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
              Log in
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              You need to be logged in with a verified UIUC account to access admin tools.
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
              Verify your UIUC email before you can access admin tools.
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
              Finish setting up your profile before you can access admin tools.
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
              Your account is restricted from accessing admin tools.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (gate.kind === "notAdmin") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-2xl">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Not authorized
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              You must be an admin to view this area.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium border border-[#E5E7EB] bg-white"
              style={{ color: "#111827" }}
            >
              Go back home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

