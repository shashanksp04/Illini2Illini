import Link from "next/link";

export type PublicListingItem = {
  id: string;
  title: string;
  monthly_rent: number;
  start_date: string | Date;
  end_date: string | Date;
  nearby_landmark: string;
  lease_type: string;
  room_type: string;
  furnished: boolean;
  utilities_included: boolean;
  owner_username: string;
};

/** Optional fields for verified/Dashboard/My Listings context */
export type ListingCardItem = PublicListingItem & {
  /** First photo URL (public listings have no photos) */
  image_url?: string | null;
  /** For seller row avatar (verified only) */
  owner_profile_picture_url?: string | null;
  /** Show verified badge in seller row (verified only) */
  show_verified_badge?: boolean;
  /** For Dashboard/My Listings status badge */
  status?: "ACTIVE" | "TAKEN" | "EXPIRED" | "DELETED";
};

function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function leaseTypeBadgeClass(leaseType: string): string {
  switch (leaseType) {
    case "SUBLEASE":
      return "bg-gray-100 text-gray-700";
    case "LEASE_TAKEOVER":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function roomTypeLabel(roomType: string): string {
  return roomType === "PRIVATE_ROOM" ? "Private Room" : "Entire Unit";
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "TAKEN":
      return "bg-gray-100 text-gray-600";
    case "EXPIRED":
    case "DELETED":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "ACTIVE";
    case "TAKEN":
      return "TAKEN";
    case "EXPIRED":
      return "EXPIRED";
    case "DELETED":
      return "DELETED";
    default:
      return "ACTIVE";
  }
}

export function ListingCard({ listing }: { listing: ListingCardItem }) {
  const dateRange = `${formatDate(listing.start_date)} – ${formatDate(listing.end_date)}`;
  const status = listing.status ?? "ACTIVE";

  // Defensive defaults: public usage must never leak restricted fields.
  const imageUrl = listing.image_url ?? undefined;
  const ownerProfilePictureUrl = listing.owner_profile_picture_url ?? undefined;
  const showVerifiedBadge = listing.show_verified_badge === true;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      {/* Image: aspect-[4/3], placeholder when no photo (public) */}
      <div className="relative aspect-[4/3] w-full bg-gray-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full rounded-t-xl object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-gray-200 text-gray-500">
            <span className="text-xs">No image</span>
          </div>
        )}
        {/* Price tag: top-right overlay, Illini Orange */}
        <span className="absolute right-2 top-2 rounded-lg bg-illini-orange px-2 py-1 text-sm font-medium text-white">
          ${listing.monthly_rent} / month
        </span>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-base font-medium text-illini-blue line-clamp-2">{listing.title}</h3>
        <p className="text-sm text-gray-500">{listing.nearby_landmark}</p>
        <p className="text-xs text-gray-500">{dateRange}</p>

        {/* Tags: rounded badge, muted background */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {roomTypeLabel(listing.room_type)}
          </span>
          {listing.furnished && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              Furnished
            </span>
          )}
          {listing.utilities_included && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              Utilities Included
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${leaseTypeBadgeClass(
              listing.lease_type
            )}`}
          >
            {listing.lease_type === "SUBLEASE" ? "Sublease" : "Lease Takeover"}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}>
            {statusLabel(status)}
          </span>
        </div>

        {/* Seller row: avatar and verified badge only when explicitly passed (verified API). Public: username only. */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {ownerProfilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ownerProfilePictureUrl}
              alt=""
              className="h-6 w-6 rounded-full object-cover border border-gray-200"
            />
          ) : null}
          <span className="text-xs text-gray-500">@{listing.owner_username}</span>
          {showVerifiedBadge ? (
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-illini-blue"
              title="Verified UIUC Student"
            >
              <span aria-hidden>✓</span>
              <span>Verified</span>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
