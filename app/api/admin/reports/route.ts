import { NextResponse } from "next/server";

import {
  AuthError,
  requireAdmin,
  requireNotBanned,
  requireProfileComplete,
  requireVerified,
} from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["OPEN", "RESOLVED"] as const;

export async function GET(request: Request) {
  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    await requireProfileComplete(authUserId);
    await requireAdmin(authUserId);

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const where =
      statusParam && VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])
        ? { status: statusParam as (typeof VALID_STATUSES)[number] }
        : {};

    const reports = await prisma.report.findMany({
      where,
      select: {
        id: true,
        listing_id: true,
        reported_by_user_id: true,
        reason: true,
        status: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      { ok: true, data: { items: reports } },
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
