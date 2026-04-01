import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_SIGNUP_DOMAIN } from "@/lib/supabase/constants";

function isAllowedEmail(email: string): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized.endsWith(`@${ALLOWED_SIGNUP_DOMAIN}`);
}

export async function POST(request: Request) {
  let body: { email?: string; token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const rawToken = typeof body.token === "string" ? body.token.trim() : "";
  const token = rawToken.replace(/\s/g, "");

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

  if (!token || token.length < 6) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Enter the verification code from your email." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error || !data?.session) {
    const msg = error?.message?.toLowerCase() ?? "";
    if (msg.includes("expired") || msg.includes("otp_expired")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "OTP_EXPIRED",
            message: "This code has expired. Request a new one.",
          },
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "OTP_INVALID",
          message: "Invalid code. Check the email and try again.",
        },
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, data: { verified: true } }, { status: 200 });
}
