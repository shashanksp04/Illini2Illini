import { NextResponse } from "next/server";

import {
  AuthError,
  requireNotBanned,
  requireProfileComplete,
  requireVerified,
} from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id: listingId } = await context.params;

  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    const domainUser = await requireProfileComplete(authUserId);

    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        status: "ACTIVE",
      },
      include: {
        owner: { select: { email: true } },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Listing not found." } },
        { status: 404 }
      );
    }

    const owner = listing.owner;
    if (!owner?.email) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SERVER_ERROR",
            message: "Unable to resolve listing owner.",
          },
        },
        { status: 500 }
      );
    }

    await prisma.contactEvent.create({
      data: {
        listing_id: listingId,
        viewer_user_id: domainUser.id,
      },
    });

    return NextResponse.json(
      { ok: true, data: { seller_email: owner.email } },
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
