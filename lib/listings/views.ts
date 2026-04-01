import { prisma } from "@/lib/prisma";

/**
 * Records one listing detail view. Skips when the listing is missing/inactive
 * or when the viewer is the listing owner (e.g. edit flow).
 */
export async function recordListingView(params: {
  listingId: string;
  viewerUserId: string | null;
}): Promise<void> {
  const { listingId, viewerUserId } = params;

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, status: "ACTIVE" },
    select: { owner_id: true },
  });
  if (!listing) return;
  if (viewerUserId !== null && viewerUserId === listing.owner_id) return;

  await prisma.listingView.create({
    data: {
      listing_id: listingId,
      viewer_user_id: viewerUserId,
    },
  });
}
