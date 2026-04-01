import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      console.error("[reset-password/request] Supabase error:", error.message, { code: error.name });
    }
  } catch (err) {
    console.error("[reset-password/request] Unexpected error:", err);
  }

  return NextResponse.json(
    { ok: true, data: { sent: true } },
    { status: 200 }
  );
}
