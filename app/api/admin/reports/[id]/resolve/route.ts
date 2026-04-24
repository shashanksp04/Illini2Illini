import { NextResponse } from "next/server";

import {
  AuthError,
  requireAdmin,
  requireNotBanned,
  requireProfileComplete,
  requireVerified,
} from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    await requireProfileComplete(authUserId);
    await requireAdmin(authUserId);

    const { id } = await params;

    let body: { status?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
        { status: 400 }
      );
    }

    if (body.status !== "RESOLVED") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: 'status must equal "RESOLVED".',
          },
        },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id },
      select: { id: true, listing_id: true },
    });

    if (!report) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Report not found." } },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.report.update({
        where: { id },
        data: { status: "RESOLVED" },
      });

      const openCount = await tx.report.count({
        where: {
          listing_id: report.listing_id,
          status: "OPEN",
        },
      });

      if (openCount === 0) {
        await tx.listing.updateMany({
          where: {
            id: report.listing_id,
            status: { not: "DELETED" },
          },
          data: { status: "ACTIVE" },
        });
      }
    });

    return NextResponse.json(
      { ok: true, data: { status: "RESOLVED" } },
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
