import { NextResponse } from "next/server";

import {
  AuthError,
  requireAdmin,
  requireNotBanned,
  requireProfileComplete,
  requireVerified,
} from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["ACTIVE", "TAKEN", "EXPIRED", "DELETED"] as const;

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

    const listings = await prisma.listing.findMany({
      where,
      select: {
        id: true,
        title: true,
        owner_id: true,
        status: true,
        monthly_rent: true,
        start_date: true,
        end_date: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      { ok: true, data: { items: listings } },
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
