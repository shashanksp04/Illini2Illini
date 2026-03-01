import { NextResponse } from "next/server";

import {
  AuthError,
  requireNotBanned,
  requireProfileComplete,
  requireVerified,
} from "@/lib/auth/helpers";
import {
  getListingPublic,
  getListingVerified,
  ListingError,
  type ListingOwner,
  type ListingOwnerOrAdmin,
  type VerifiedViewer,
} from "@/lib/listings/helpers";
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
      const listing = await getListingVerified(id, viewer);
      if (!listing) {
        return NextResponse.json(
          { ok: false, error: { code: "NOT_FOUND", message: "Listing not found." } },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { ok: true, data: { listing } },
        { status: 200 }
      );
    }

    const listing = await getListingPublic(id);
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

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    const domainUser = await requireProfileComplete(authUserId);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
        { status: 400 }
      );
    }

    const payload = body as any;
    const listingOwner: ListingOwner = { id: domainUser.id };

    const { updateListing } = await import("@/lib/listings/helpers");
    await updateListing(listingOwner, id, payload);

    return NextResponse.json(
      { ok: true, data: { updated: true } },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    if (err instanceof ListingError) {
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

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    const domainUser = await requireProfileComplete(authUserId);

    const listingOwner: ListingOwner = { id: domainUser.id };

    const { softDeleteListing } = await import("@/lib/listings/helpers");
    const updated = await softDeleteListing(listingOwner as ListingOwnerOrAdmin, id);

    return NextResponse.json(
      { ok: true, data: { status: updated.status } },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    if (err instanceof ListingError) {
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

