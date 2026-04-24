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
        reported_by: {
          select: {
            username: true,
          },
        },
        reason: true,
        status: true,
        created_at: true,
        listing: {
          select: {
            status: true,
          },
        },
      },
    });

    const counts = await prisma.report.groupBy({
      by: ["listing_id"],
      _count: { listing_id: true },
    });
    const countByListingId = new Map(
      counts.map((entry) => [entry.listing_id, entry._count.listing_id])
    );

    const items = reports.map((report) => ({
      id: report.id,
      listing_id: report.listing_id,
      reported_by_user_id: report.reported_by_user_id,
      reported_by_username: report.reported_by.username,
      reason: report.reason,
      status: report.status,
      created_at: report.created_at,
      listing_status: report.listing.status,
      report_count: countByListingId.get(report.listing_id) ?? 0,
    }));

    return NextResponse.json(
      { ok: true, data: { items } },
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
