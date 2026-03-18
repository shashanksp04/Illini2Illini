import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { ALLOWED_SIGNUP_DOMAIN } from "@/lib/supabase/constants";

function isAllowedEmail(email: string): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized.endsWith(`@${ALLOWED_SIGNUP_DOMAIN}`);
}

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Email is required." } },
      { status: 400 }
    );
  }

  if (!isAllowedEmail(email)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_EMAIL_DOMAIN",
          message: "Only @illinois.edu email addresses are allowed.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const baseUrl = env.appUrl ?? new URL(request.url).origin;
    const redirectTo = `${baseUrl}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      // Log server-side for debugging; do not expose to client (avoids email enumeration)
      console.error("[forgot-password] Supabase error:", error.message, { code: error.name, redirectTo });
    }
  } catch (err) {
    // Log server-side for debugging; do not expose to client
    console.error("[forgot-password] Unexpected error:", err);
  }

  return NextResponse.json(
    { ok: true, data: { sent: true } },
    { status: 200 }
  );
}
