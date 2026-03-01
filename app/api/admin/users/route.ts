import { NextResponse } from "next/server";

import {
  AuthError,
  requireAdmin,
  requireNotBanned,
  requireProfileComplete,
  requireVerified,
} from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    await requireProfileComplete(authUserId);
    await requireAdmin(authUserId);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        role: true,
        is_banned: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      { ok: true, data: { items: users } },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: err.status }
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
