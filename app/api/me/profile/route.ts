import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { AuthError, requireVerified } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

const DEFAULT_USERNAME_COOLDOWN_DAYS = 30;

function getUsernameCooldownDays(): number {
  const raw = process.env.PROFILE_USERNAME_COOLDOWN_DAYS?.trim();
  if (!raw) return DEFAULT_USERNAME_COOLDOWN_DAYS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_USERNAME_COOLDOWN_DAYS;
  return parsed;
}

function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(username);
}

export async function PATCH(request: Request) {
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

    const existingUser = await prisma.user.findUnique({
      where: { auth_user_id: authUserId },
      select: { id: true, username: true, username_changed_at: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "PROFILE_INCOMPLETE", message: "Complete profile setup before editing." },
        },
        { status: 403 }
      );
    }

    const isUsernameChange = existingUser.username !== username;
    if (isUsernameChange) {
      const cooldownDays = getUsernameCooldownDays();
      const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
      if (existingUser.username_changed_at && cooldownMs > 0) {
        const nextAllowedAt = new Date(existingUser.username_changed_at.getTime() + cooldownMs);
        if (Date.now() < nextAllowedAt.getTime()) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                code: "USERNAME_COOLDOWN_ACTIVE",
                message: `Username can only be changed once every ${cooldownDays} days.`,
              },
              data: {
                username_next_change_at: nextAllowedAt.toISOString(),
              },
            },
            { status: 409 }
          );
        }
      }
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { auth_user_id: authUserId },
        data: {
          first_name,
          last_name,
          username,
          profile_picture_url,
          ...(isUsernameChange ? { username_changed_at: new Date() } : {}),
        },
        select: {
          username: true,
          first_name: true,
          last_name: true,
          profile_picture_url: true,
          username_changed_at: true,
        },
      });

      return NextResponse.json(
        {
          ok: true,
          data: {
            username: updatedUser.username,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            profile_picture_url: updatedUser.profile_picture_url,
            username_changed_at: updatedUser.username_changed_at?.toISOString() ?? null,
          },
        },
        { status: 200 }
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "USERNAME_TAKEN", message: "Username is already taken." },
          },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof AuthError) {
      const status = err.status === 401 ? 401 : 403;
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status }
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
