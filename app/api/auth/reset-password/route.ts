import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AuthError, requireAuth } from "@/lib/auth/helpers";

const MIN_PASSWORD_LENGTH = 6;

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const password = typeof body.password === "string" ? body.password : "";

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        },
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (msg.includes("invalid") || msg.includes("validation") || msg.includes("password")) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid password. Try a stronger one." } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: { updated: true } }, { status: 200 });
}
