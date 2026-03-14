import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { AuthError, requireAuth } from "@/lib/auth/helpers";

export async function GET(request: Request) {
  try {
    const { authUserId } = await requireAuth();

    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: 401 }
      );
    }

    const authUser = data.user;
    const email = authUser.email ?? "";
    const email_verified = Boolean(authUser.email_confirmed_at);

    const domainUser = await prisma.user.findUnique({
      where: { auth_user_id: authUserId },
    });

    if (!domainUser) {
      return NextResponse.json(
        {
          ok: true,
          data: {
            email,
            email_verified,
            is_profile_complete: false,
            role: "USER",
            is_banned: false,
            username: null,
            first_name: null,
            last_name: null,
            profile_picture_url: null,
          },
        },
        { status: 200 }
      );
    }

    const is_profile_complete =
      !!domainUser.first_name &&
      !!domainUser.last_name &&
      !!domainUser.username &&
      !!domainUser.profile_picture_url;

    const res = NextResponse.json(
      {
        ok: true,
        data: {
          email: domainUser.email,
          email_verified,
          is_profile_complete,
          role: domainUser.role,
          is_banned: domainUser.is_banned,
          username: domainUser.username,
          first_name: domainUser.first_name,
          last_name: domainUser.last_name,
          profile_picture_url: domainUser.profile_picture_url,
        },
      },
      { status: 200 }
    );

    if (is_profile_complete) {
      res.cookies.set("profile_complete", "1", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return res;
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
}

