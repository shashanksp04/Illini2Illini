import { NextResponse } from "next/server";

import { AuthError, requireVerified } from "@/lib/auth/helpers";
import type { VerifiedViewer } from "@/lib/listings/helpers";
import { getRedditListingPublic, getRedditListingVerified } from "@/lib/reddit-listings/helpers";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    let isVerified = false;
    let viewer: VerifiedViewer | null = null;

    try {
      const { authUserId } = await requireVerified();
      const domainUser = await prisma.user.findUnique({
        where: { auth_user_id: authUserId },
        select: { id: true, role: true, is_banned: true },
      });
      if (domainUser) {
        viewer = {
          id: domainUser.id,
          role: domainUser.role,
          is_banned: domainUser.is_banned,
        };
      }
      isVerified = true;
    } catch (err) {
      if (!(err instanceof AuthError)) {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
          },
          { status: 500 }
        );
      }
      isVerified = false;
    }

    if (isVerified && viewer) {
      const listing = await getRedditListingVerified(id);
      if (!listing) {
        return NextResponse.json(
          { ok: false, error: { code: "NOT_FOUND", message: "Listing not found." } },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, data: { listing } }, { status: 200 });
    }

    const listing = await getRedditListingPublic(id);
    if (!listing) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Listing not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, data: { listing, requires_login_for_details: true } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      },
      { status: 500 }
    );
  }
}
