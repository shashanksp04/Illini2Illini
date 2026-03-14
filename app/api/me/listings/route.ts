import { NextResponse } from "next/server";

import { AuthError, requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

type ListingWithPhotos = Awaited<
  ReturnType<
    typeof prisma.listing.findMany<{
      where: { owner_id: string };
      orderBy: { created_at: "desc" };
      include: { photos: true };
    }>
  >
>[number];

export async function GET() {
  try {
    const { authUserId } = await requireAuth();

    const domainUser = await prisma.user.findUnique({
      where: { auth_user_id: authUserId },
      select: { id: true },
    });

    if (!domainUser) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROFILE_INCOMPLETE",
            message: "Profile must be completed before accessing listings.",
          },
        },
        { status: 403 }
      );
    }

    const listings = await prisma.listing.findMany({
      where: { owner_id: domainUser.id },
      orderBy: { created_at: "desc" },
      include: {
        photos: true,
      },
    });

    const items = listings.map((listing: ListingWithPhotos) => ({
      id: listing.id,
      title: listing.title,
      status: listing.status,
      monthly_rent: listing.monthly_rent,
      start_date: listing.start_date,
      end_date: listing.end_date,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      photos: listing.photos
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((photo) => ({
          image_url: photo.image_url,
          display_order: photo.display_order,
        })),
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

