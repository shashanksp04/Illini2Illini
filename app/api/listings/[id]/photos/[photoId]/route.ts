import { NextResponse } from "next/server";

import {
  AuthError,
  requireNotBanned,
  requireProfileComplete,
  requireVerified,
} from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { BUCKET_LISTING_PHOTOS } from "@/lib/storage/constants";

interface RouteContext {
  params: Promise<{ id: string; photoId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: listingId, photoId } = await context.params;

  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    const domainUser = await requireProfileComplete(authUserId);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, owner_id: true },
    });

    if (!listing) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Listing not found." } },
        { status: 404 }
      );
    }

    if (listing.owner_id !== domainUser.id) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "NOT_OWNER",
            message: "Only the owner can delete photos for this listing.",
          },
        },
        { status: 403 }
      );
    }

    const photo = await prisma.listingPhoto.findUnique({
      where: { id: photoId },
      select: { id: true, listing_id: true, image_url: true },
    });

    if (!photo || photo.listing_id !== listingId) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Photo not found." } },
        { status: 404 }
      );
    }

    const photoCount = await prisma.listingPhoto.count({
      where: { listing_id: listingId },
    });

    if (photoCount <= 1) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A listing must have at least one photo.",
          },
        },
        { status: 400 }
      );
    }

    await prisma.listingPhoto.delete({
      where: { id: photoId },
    });

    const storagePath = photo.image_url.split(`/${BUCKET_LISTING_PHOTOS}/`)[1];
    if (storagePath) {
      const supabase = createServiceRoleClient();
      await supabase.storage.from(BUCKET_LISTING_PHOTOS).remove([storagePath]);
    }

    const allPhotos = await prisma.listingPhoto.findMany({
      where: { listing_id: listingId },
      select: { id: true, image_url: true, display_order: true },
      orderBy: { display_order: "asc" },
    });

    return NextResponse.json(
      { ok: true, data: { photos: allPhotos } },
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
        error: {
          code: "SERVER_ERROR",
          message: "Something went wrong. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
