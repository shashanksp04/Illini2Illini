import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ALLOWED_SIGNUP_DOMAIN } from "@/lib/supabase/constants";

function isAllowedEmail(email: string): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized.endsWith(`@${ALLOWED_SIGNUP_DOMAIN}`);
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Email and password are required." } },
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

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      },
      { status: 401 }
    );
  }

  const res = NextResponse.json(
    { ok: true, data: { session: true } },
    { status: 200 }
  );

  const authUserId = signInData.user?.id;
  if (authUserId) {
    const profile = await prisma.user.findUnique({
      where: { auth_user_id: authUserId },
      select: { first_name: true, last_name: true, username: true, profile_picture_url: true },
    });
    const isComplete =
      profile &&
      !!profile.first_name &&
      !!profile.last_name &&
      !!profile.username &&
      !!profile.profile_picture_url;

    if (isComplete) {
      res.cookies.set("profile_complete", "1", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  return res;
}
