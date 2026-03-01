import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  AuthError,
  requireNotBanned,
  requireProfileComplete,
  requireVerified,
} from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

const MAX_REASON_LENGTH = 1000;

export async function POST(request: Request) {
  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    const domainUser = await requireProfileComplete(authUserId);

    let body: { listing_id?: unknown; reason?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
        { status: 400 }
      );
    }

    const listingId =
      typeof body.listing_id === "string" ? body.listing_id.trim() : "";
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";

    if (!listingId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "listing_id is required and must be a string.",
          },
        },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "reason is required and must be a non-empty string.",
          },
        },
        { status: 400 }
      );
    }

    if (reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `reason must be at most ${MAX_REASON_LENGTH} characters.`,
          },
        },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Listing not found." } },
        { status: 404 }
      );
    }

    try {
      const report = await prisma.report.create({
        data: {
          listing_id: listingId,
          reported_by_user_id: domainUser.id,
          reason,
          status: "OPEN",
        },
      });

      return NextResponse.json(
        { ok: true, data: { report_id: report.id } },
        { status: 200 }
      );
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "ALREADY_REPORTED",
              message: "You have already reported this listing.",
            },
          },
          { status: 409 }
        );
      }
      throw err;
    }
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
