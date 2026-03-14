import { NextResponse } from "next/server";

import {
  AuthError,
  requireNotBanned,
  requireProfileComplete,
  requireVerified,
} from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  BUCKET_LISTING_PHOTOS,
  MAX_LISTING_PHOTO_SIZE_BYTES,
  MAX_LISTING_PHOTOS,
} from "@/lib/storage/constants";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    const domainUser = await requireProfileComplete(authUserId);

    const listing = await prisma.listing.findUnique({
      where: { id },
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
          error: { code: "NOT_OWNER", message: "Only the owner can upload photos for this listing." },
        },
        { status: 403 }
      );
    }

    const existingPhotos = await prisma.listingPhoto.findMany({
      where: { listing_id: id },
      select: { display_order: true },
      orderBy: { display_order: "asc" },
    });

    const existingCount = existingPhotos.length;
    const remaining = MAX_LISTING_PHOTOS - existingCount;

    if (remaining <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `You can upload at most ${MAX_LISTING_PHOTOS} photos for a listing.`,
          },
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const files: File[] = [];
    for (const value of formData.getAll("files")) {
      if (value instanceof File) files.push(value);
    }
    const single = formData.get("file");
    if (files.length === 0 && single instanceof File) {
      files.push(single);
    }

    if (files.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "At least one image file is required under the 'files' field.",
          },
        },
        { status: 400 }
      );
    }

    if (files.length > remaining) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `You can only upload ${remaining} more photo(s) for this listing.`,
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const uploadedUrls: string[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const mime = file.type;

      if (!ALLOWED_IMAGE_MIME_TYPES.includes(mime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Unsupported image type. Allowed: JPEG, PNG, WEBP.",
            },
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_LISTING_PHOTO_SIZE_BYTES) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Image file is too large.",
            },
          },
          { status: 400 }
        );
      }

      const originalName = file.name || "photo";
      const ext = (originalName.split(".").pop() || "jpg").toLowerCase();
      const timestamp = Date.now();
      const path = `${id}/${timestamp}-${index}.${ext}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_LISTING_PHOTOS)
        .upload(path, file, {
          contentType: mime,
          upsert: true,
        });

      if (error || !data?.path) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "SERVER_ERROR",
              message: "Failed to upload listing photos.",
            },
          },
          { status: 500 }
        );
      }

      const { data: publicData } = supabase.storage
        .from(BUCKET_LISTING_PHOTOS)
        .getPublicUrl(data.path);

      const imageUrl = publicData.publicUrl;
      uploadedUrls.push(imageUrl);
    }

    let displayOrder = existingPhotos[existingPhotos.length - 1]?.display_order ?? 0;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const url of uploadedUrls) {
        displayOrder += 1;
        await tx.listingPhoto.create({
          data: {
            listing_id: id,
            image_url: url,
            display_order: displayOrder,
          },
        });
      }
    });

    const allPhotos = await prisma.listingPhoto.findMany({
      where: { listing_id: id },
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
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      },
      { status: 500 }
    );
  }
}

