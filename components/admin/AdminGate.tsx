"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";
import { AuthCard } from "@/components/auth/AuthCard";

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
      <GateScreen
        title="Log in"
        description="You need to be logged in with a verified UIUC account to access admin tools."
        cta={
          <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            Log in
          </Link>
        }
      />
    );
  }

  if (gate.kind === "needsVerify") {
    return (
      <GateScreen
        title="Verify your email first"
        description="Verify your UIUC email before you can access admin tools."
        cta={
          <Link
            href={gate.email ? `/verify-email?email=${encodeURIComponent(gate.email)}` : "/verify-email"}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
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
        description="Finish setting up your profile before you can access admin tools."
        cta={
          <Link href="/profile/setup" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
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
        description="Your account is restricted from accessing admin tools."
      />
    );
  }

  if (gate.kind === "notAdmin") {
    return (
      <GateScreen
        title="Not authorized"
        description="You must be an admin to view this area."
        cta={
          <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-300">
            Go back home
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
