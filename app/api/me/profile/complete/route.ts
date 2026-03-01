import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { AuthError, requireVerified } from "@/lib/auth/helpers";

function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(username);
}

export async function POST(request: Request) {
  try {
    const { authUserId } = await requireVerified();

    let body: {
      first_name?: string;
      last_name?: string;
      username?: string;
      profile_picture_url?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
        { status: 400 }
      );
    }

    const first_name = (body.first_name ?? "").trim();
    const last_name = (body.last_name ?? "").trim();
    const username = (body.username ?? "").trim();
    const profile_picture_url = (body.profile_picture_url ?? "").trim();

    if (!first_name || !last_name || !username || !profile_picture_url) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "first_name, last_name, username, and profile_picture_url are required.",
          },
        },
        { status: 400 }
      );
    }

    if (first_name.length > 100 || last_name.length > 100 || username.length > 50) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name/username fields exceed allowed length.",
          },
        },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Username must contain only letters, numbers, and underscores.",
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: userData, error: supaError } = await supabase.auth.getUser();
    if (supaError || !userData?.user || userData.user.id !== authUserId) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "FORBIDDEN", message: "Unable to resolve authenticated user." },
        },
        { status: 403 }
      );
    }

    const email = userData.user.email ?? "";

    const existingUser = await prisma.user.findUnique({
      where: { auth_user_id: authUserId },
    });

    const usernameOwner = await prisma.user.findUnique({
      where: { username },
    });

    if (usernameOwner && usernameOwner.auth_user_id !== authUserId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "USERNAME_TAKEN",
            message: "Username is already taken.",
          },
        },
        { status: 409 }
      );
    }

    if (existingUser) {
      const hasUsername = !!existingUser.username;
      const hasProfile =
        !!existingUser.first_name &&
        !!existingUser.last_name &&
        !!existingUser.username &&
        !!existingUser.profile_picture_url;

      if (hasProfile) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PROFILE_ALREADY_COMPLETE",
              message: "Profile is already complete.",
            },
          },
          { status: 409 }
        );
      }

      if (hasUsername && existingUser.username !== username) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PROFILE_ALREADY_COMPLETE",
              message: "Username cannot be changed once set.",
            },
          },
          { status: 409 }
        );
      }

      await prisma.user.update({
        where: { auth_user_id: authUserId },
        data: {
          first_name,
          last_name,
          username: hasUsername ? existingUser.username : username,
          profile_picture_url,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          auth_user_id: authUserId,
          email,
          first_name,
          last_name,
          username,
          profile_picture_url,
          role: "USER",
          is_banned: false,
        },
      });
    }

    return NextResponse.json(
      { ok: true, data: { is_profile_complete: true } },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.status === 401) {
        return NextResponse.json(
          { ok: false, error: { code: err.code, message: err.message } },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: 403 }
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

