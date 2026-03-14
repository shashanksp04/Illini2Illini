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
  total_bedrooms?: number;
  total_bathrooms?: number;
  furnished: boolean;
  utilities_included: boolean;
  owner_username: string;
  thumbnail_url?: string | null;
};

export type ListingCardItem = PublicListingItem & {
  image_url?: string | null;
  owner_profile_picture_url?: string | null;
  show_verified_badge?: boolean;
  status?: "ACTIVE" | "TAKEN" | "EXPIRED" | "DELETED";
};

function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function leaseTypeBadgeClass(leaseType: string): string {
  switch (leaseType) {
    case "SUBLEASE":
      return "bg-blue-50 text-blue-600 ring-1 ring-blue-100";
    case "LEASE_TAKEOVER":
      return "bg-amber-50 text-amber-600 ring-1 ring-amber-100";
    default:
      return "bg-gray-50 text-gray-600 ring-1 ring-gray-100";
  }
}

function roomTypeLabel(roomType: string): string {
  return roomType === "PRIVATE_ROOM" ? "Private Room" : "Entire Unit";
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100";
    case "TAKEN":
      return "bg-gray-50 text-gray-500 ring-1 ring-gray-100";
    case "EXPIRED":
    case "DELETED":
      return "bg-gray-50 text-gray-400 ring-1 ring-gray-100";
    default:
      return "bg-gray-50 text-gray-500 ring-1 ring-gray-100";
  }
}

export function ListingCard({ listing }: { listing: ListingCardItem }) {
  const dateRange = `${formatDate(listing.start_date)} – ${formatDate(listing.end_date)}`;
  const hasExplicitStatus = listing.status != null;
  const status = listing.status ?? "ACTIVE";

  const imageUrl = listing.image_url ?? undefined;
  const ownerPicUrl = listing.owner_profile_picture_url ?? undefined;
  const showVerifiedBadge = listing.show_verified_badge === true;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-300">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
            <span className="text-xs font-medium text-gray-400">No preview</span>
          </div>
        )}
        <span className="absolute right-2.5 top-2.5 rounded-lg bg-brand/90 px-2.5 py-1 text-sm font-bold tabular-nums text-white shadow-lg backdrop-blur-sm">
          ${listing.monthly_rent}<span className="text-xs font-medium opacity-70">/mo</span>
        </span>
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-[15px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-accent">
            {listing.title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">{listing.nearby_landmark}</p>
        </div>

        <p className="text-xs text-gray-400">{dateRange}</p>

        <div className="flex flex-wrap gap-1.5">
          {(listing.total_bedrooms != null || listing.total_bathrooms != null) && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 ring-1 ring-indigo-100">
              {listing.total_bedrooms ?? "?"}B/{listing.total_bathrooms ?? "?"}Ba
            </span>
          )}
          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-gray-100">
            {roomTypeLabel(listing.room_type)}
          </span>
          {listing.furnished && (
            <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-gray-100">
              Furnished
            </span>
          )}
          {listing.utilities_included && (
            <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-gray-100">
              Utilities
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${leaseTypeBadgeClass(listing.lease_type)}`}>
            {listing.lease_type === "SUBLEASE" ? "Sublease" : "Lease Takeover"}
          </span>
          {hasExplicitStatus && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}>
              {status}
            </span>
          )}
        </div>

        {/* Seller row */}
        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
          {ownerPicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ownerPicUrl} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-gray-100" />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-400">
              {listing.owner_username[0]?.toUpperCase()}
            </span>
          )}
          <span className="text-xs text-gray-400">@{listing.owner_username}</span>
          {showVerifiedBadge && (
            <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 ring-1 ring-blue-100">
              &#10003; Verified
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
