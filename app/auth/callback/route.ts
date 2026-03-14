import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        const existing = await prisma.user.findUnique({
          where: { auth_user_id: data.user.id },
          select: { id: true, first_name: true, last_name: true, username: true, profile_picture_url: true },
        });

        const isComplete =
          existing &&
          !!existing.first_name &&
          !!existing.last_name &&
          !!existing.username &&
          !!existing.profile_picture_url;

        if (!isComplete) {
          return NextResponse.redirect(`${origin}/profile/setup`);
        }
      }

      const redirectRes = NextResponse.redirect(`${origin}/listings`);
      redirectRes.cookies.set("profile_complete", "1", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
      });
      return redirectRes;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=verification_failed`);
}
