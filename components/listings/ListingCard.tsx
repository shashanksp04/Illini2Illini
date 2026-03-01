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

function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function leaseTypeBadgeClass(leaseType: string): string {
  switch (leaseType) {
    case "SUBLEASE":
      return "bg-purple-100 text-purple-700";
    case "LEASE_TAKEOVER":
      return "bg-teal-100 text-teal-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function roomTypeLabel(roomType: string): string {
  return roomType === "PRIVATE_ROOM" ? "Private Room" : "Entire Unit";
}

export function ListingCard({ listing }: { listing: PublicListingItem }) {
  const dateRange = `${formatDate(listing.start_date)} – ${formatDate(listing.end_date)}`;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md border border-[#E5E7EB]"
    >
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-base font-semibold flex-1 min-w-0" style={{ color: "#111827" }}>
          {listing.title}
        </h3>
        <span className="text-base font-medium shrink-0" style={{ color: "#111827" }}>
          ${listing.monthly_rent} / month
        </span>
      </div>
      <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
        {listing.nearby_landmark}
      </p>
      <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
        {dateRange}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {roomTypeLabel(listing.room_type)}
        </span>
        {listing.furnished && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            Furnished
          </span>
        )}
        {listing.utilities_included && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            Utilities
          </span>
        )}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${leaseTypeBadgeClass(listing.lease_type)}`}>
          {listing.lease_type === "SUBLEASE" ? "Sublease" : "Lease takeover"}
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
          ACTIVE
        </span>
      </div>
      <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
        @{listing.owner_username}
      </p>
    </Link>
  );
}
