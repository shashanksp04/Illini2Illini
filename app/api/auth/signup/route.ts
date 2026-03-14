import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_SIGNUP_DOMAIN } from "@/lib/supabase/constants";

function isAllowedEmail(email: string): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized.endsWith(`@${ALLOWED_SIGNUP_DOMAIN}`);
}

export async function POST(request: Request) {
  // #region agent log
  fetch('http://127.0.0.1:7739/ingest/abe32b33-c7b2-4ec4-af97-867fdda097b1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d1509e'},body:JSON.stringify({sessionId:'d1509e',location:'api/auth/signup/route.ts:POST-entry',message:'Signup POST called',data:{},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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

  let supabase;
  try {
    supabase = await createClient();
  } catch (clientErr: any) {
    // #region agent log
    fetch('http://127.0.0.1:7739/ingest/abe32b33-c7b2-4ec4-af97-867fdda097b1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d1509e'},body:JSON.stringify({sessionId:'d1509e',location:'api/auth/signup/route.ts:createClient-catch',message:'createClient threw',data:{err:String(clientErr),stack:clientErr?.stack?.slice(0,500)},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw clientErr;
  }
  const origin = new URL(request.url).origin;
  // #region agent log
  fetch('http://127.0.0.1:7739/ingest/abe32b33-c7b2-4ec4-af97-867fdda097b1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d1509e'},body:JSON.stringify({sessionId:'d1509e',location:'api/auth/signup/route.ts:pre-signUp',message:'About to call signUp',data:{email,origin},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  // #region agent log
  fetch('http://127.0.0.1:7739/ingest/abe32b33-c7b2-4ec4-af97-867fdda097b1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d1509e'},body:JSON.stringify({sessionId:'d1509e',location:'api/auth/signup/route.ts:post-signUp',message:'signUp result',data:{hasError:!!error,errorMessage:error?.message,errorStatus:error?.status,errorName:error?.name,hasData:!!data,userId:data?.user?.id,identities:data?.user?.identities?.length},timestamp:Date.now(),hypothesisId:'A,D'})}).catch(()=>{});
  // #endregion

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (msg.includes("invalid") || msg.includes("validation") || msg.includes("password")) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid input." } },
        { status: 400 }
      );
    }
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists") ||
      error.status === 422
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "AUTH_CONFLICT",
            message: "An account with this email may already exist. Check your inbox or try logging in.",
          },
        },
        { status: 409 }
      );
    }
    // #region agent log
    fetch('http://127.0.0.1:7739/ingest/abe32b33-c7b2-4ec4-af97-867fdda097b1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d1509e'},body:JSON.stringify({sessionId:'d1509e',location:'api/auth/signup/route.ts:500-fallthrough',message:'Unmatched error falling to 500',data:{msg,errorMessage:error.message,errorStatus:error.status,errorName:error.name},timestamp:Date.now(),hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    return NextResponse.json(
      {
        ok: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, data: { needs_verification: true } },
    { status: 200 }
  );
}
