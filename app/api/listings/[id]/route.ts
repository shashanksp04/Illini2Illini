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
  type UpdateListingPayload,
  type VerifiedViewer,
} from "@/lib/listings/helpers";
import { parseSeasonArrayInput } from "@/lib/listings/seasons";
import { recordListingView } from "@/lib/listings/views";
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
      // #region agent log
      fetch('http://127.0.0.1:7739/ingest/abe32b33-c7b2-4ec4-af97-867fdda097b1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d1509e'},body:JSON.stringify({sessionId:'d1509e',location:'api/listings/[id]/route.ts:verified',message:'User is verified',data:{authUserId},timestamp:Date.now(),hypothesisId:'cookie-forwarding'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7739/ingest/abe32b33-c7b2-4ec4-af97-867fdda097b1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d1509e'},body:JSON.stringify({sessionId:'d1509e',location:'api/listings/[id]/route.ts:auth-failed',message:'Auth check failed',data:{isAuthError:err instanceof AuthError,errMsg:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),hypothesisId:'cookie-forwarding'})}).catch(()=>{});
      // #endregion
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
      void recordListingView({ listingId: id, viewerUserId: viewer.id }).catch(() => {});
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

    void recordListingView({ listingId: id, viewerUserId: null }).catch(() => {});
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

    const raw = body as Record<string, unknown>;
    const listingOwner: ListingOwner = { id: domainUser.id };

    const normalized: UpdateListingPayload = {};
    if (raw.seasons !== undefined) {
      const parsed = parseSeasonArrayInput(raw.seasons);
      if (!parsed.valid) {
        return NextResponse.json(
          { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid season values." } },
          { status: 400 }
        );
      }
      normalized.seasons = parsed.seasons;
    }
    if (raw.alias !== undefined) normalized.alias = raw.alias == null ? null : String(raw.alias);
    if (raw.title !== undefined) normalized.title = String(raw.title);
    if (raw.monthly_rent !== undefined) normalized.monthly_rent = Number(raw.monthly_rent);
    if (raw.lease_type !== undefined) normalized.lease_type = raw.lease_type as "SUBLEASE" | "LEASE_TAKEOVER";
    if (raw.start_date !== undefined) normalized.start_date = new Date(raw.start_date as string);
    if (raw.end_date !== undefined) normalized.end_date = new Date(raw.end_date as string);
    if (raw.exact_address !== undefined) normalized.exact_address = String(raw.exact_address);
    if (raw.nearby_landmark !== undefined) normalized.nearby_landmark = String(raw.nearby_landmark);
    if (raw.total_bedrooms !== undefined) normalized.total_bedrooms = Number(raw.total_bedrooms);
    if (raw.total_bathrooms !== undefined) normalized.total_bathrooms = Number(raw.total_bathrooms);
    if (raw.room_type !== undefined) normalized.room_type = raw.room_type as "PRIVATE_ROOM" | "ENTIRE_UNIT";
    if (raw.furnished !== undefined) normalized.furnished = Boolean(raw.furnished);
    if (raw.utilities_included !== undefined) normalized.utilities_included = Boolean(raw.utilities_included);
    if (raw.open_to_negotiation !== undefined) normalized.open_to_negotiation = Boolean(raw.open_to_negotiation);
    if (raw.gender_preference !== undefined) {
      const g = raw.gender_preference as string;
      normalized.gender_preference = (g === "" || g == null ? "ANY" : g) as "MALE" | "FEMALE" | "ANY";
    }
    if (raw.description !== undefined) normalized.description = String(raw.description);

    const { updateListing } = await import("@/lib/listings/helpers");
    await updateListing(listingOwner, id, normalized);

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

