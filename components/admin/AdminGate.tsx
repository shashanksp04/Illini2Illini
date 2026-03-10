"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";

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
            <h1 className="text-2xl font-semibold text-illini-blue">Log in</h1>
            <p className="text-sm text-gray-500">
              You need to be logged in with a verified UIUC account to access admin tools.
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
              Verify your UIUC email before you can access admin tools.
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
              Finish setting up your profile before you can access admin tools.
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
              Your account is restricted from accessing admin tools.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "notAdmin") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Not authorized</h1>
            <p className="text-sm text-gray-500">
              You must be an admin to view this area.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              Go back home
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return <>{children}</>;
}

