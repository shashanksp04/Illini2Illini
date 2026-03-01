import Link from "next/link";
import { notFound } from "next/navigation";

import { getApiBaseUrl } from "@/lib/api-base-url";

type PublicListingDetail = {
  id: string;
  title: string;
  monthly_rent: number;
  start_date: string;
  end_date: string;
  nearby_landmark: string;
  lease_type: string;
  room_type: string;
  furnished: boolean;
  utilities_included: boolean;
  owner_username: string;
};

type VerifiedPhoto = {
  image_url: string;
  display_order: number;
};

type VerifiedListingDetail = PublicListingDetail & {
  exact_address: string;
  description: string;
  photos: VerifiedPhoto[];
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_profile_picture_url: string | null;
};

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function initials(first: string | null, last: string | null): string {
  const firstInitial = first?.[0] ?? "";
  const lastInitial = last?.[0] ?? "";
  const combined = `${firstInitial}${lastInitial}`.toUpperCase();
  return combined || "U";
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const base = await getApiBaseUrl();

  let publicListing: PublicListingDetail | null = null;
  let verifiedListing: VerifiedListingDetail | null = null;
  let requiresLogin = false;

  try {
    const res = await fetch(`${base}/api/listings/${id}`, { cache: "no-store" });
    const json = (await res.json()) as any;

    if (res.status === 404 || !json?.ok) {
      if (res.status === 404) notFound();
      return (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <p className="text-base" style={{ color: "#DC2626" }}>
            {json?.error?.message ?? "Failed to load listing."}
          </p>
        </div>
      );
    }

    const listing = json.data?.listing;
    requiresLogin = json.data?.requires_login_for_details === true;

    if (!listing) {
      notFound();
    }

    const hasVerifiedFields =
      !requiresLogin &&
      typeof listing.exact_address === "string" &&
      Array.isArray(listing.photos);

    if (hasVerifiedFields) {
      verifiedListing = listing as VerifiedListingDetail;
    } else {
      publicListing = listing as PublicListingDetail;
    }
  } catch {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <p className="text-base" style={{ color: "#DC2626" }}>
          Failed to load listing.
        </p>
      </div>
    );
  }

  if (!publicListing && !verifiedListing) {
    notFound();
  }

  const listingForHeader = (verifiedListing ?? publicListing)!;
  const dateRange = `${formatDate(listingForHeader.start_date)} – ${formatDate(
    listingForHeader.end_date
  )}`;

  const isVerifiedView = Boolean(verifiedListing);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FB" }}>
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/listings" className="text-sm font-medium" style={{ color: "#13294B" }}>
            ← Back to listings
          </Link>
          <Link href="/" className="text-xl font-semibold" style={{ color: "#13294B" }}>
            Illini2Illini
          </Link>
          <Link href="/login" className="text-sm font-medium" style={{ color: "#13294B" }}>
            Log in
          </Link>
        </div>
      </header>

      {isVerifiedView && verifiedListing ? (
        <main className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column: photos + details */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm p-4">
                {verifiedListing.photos.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {verifiedListing.photos
                      .slice()
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((photo) => (
                        <div
                          key={`${photo.image_url}-${photo.display_order}`}
                          className="overflow-hidden rounded-lg bg-gray-100"
                        >
                          <img
                            src={photo.image_url}
                            alt={verifiedListing.title}
                            className="h-48 w-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="h-40 rounded-lg bg-gray-100 flex items-center justify-center">
                    <p className="text-sm" style={{ color: "#6B7280" }}>
                      No photos uploaded.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm p-6 space-y-3">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
                    {verifiedListing.title}
                  </h1>
                  <span className="text-xl font-medium" style={{ color: "#111827" }}>
                    ${verifiedListing.monthly_rent} / month
                  </span>
                </div>
                <p className="text-base" style={{ color: "#6B7280" }}>
                  {verifiedListing.nearby_landmark}
                </p>
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  {dateRange}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {roomTypeLabel(verifiedListing.room_type)}
                  </span>
                  {verifiedListing.furnished && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Furnished
                    </span>
                  )}
                  {verifiedListing.utilities_included && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Utilities included
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${leaseTypeBadgeClass(
                      verifiedListing.lease_type
                    )}`}
                  >
                    {verifiedListing.lease_type === "SUBLEASE" ? "Sublease" : "Lease takeover"}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    ACTIVE
                  </span>
                </div>

                <div className="pt-3 space-y-2">
                  <h2 className="text-sm font-medium" style={{ color: "#111827" }}>
                    Description
                  </h2>
                  <p className="text-sm" style={{ color: "#6B7280" }}>
                    {verifiedListing.description}
                  </p>
                </div>

                <div className="pt-3 space-y-1">
                  <h2 className="text-sm font-medium" style={{ color: "#111827" }}>
                    Exact address
                  </h2>
                  <p className="text-sm" style={{ color: "#6B7280" }}>
                    {verifiedListing.exact_address}
                  </p>
                </div>
              </div>
            </div>

            {/* Right column: seller card */}
            <aside className="space-y-4">
              <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3">
                  {verifiedListing.owner_profile_picture_url ? (
                    <img
                      src={verifiedListing.owner_profile_picture_url}
                      alt="Seller profile"
                      className="h-12 w-12 rounded-full object-cover border border-[#E5E7EB]"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium" style={{ color: "#111827" }}>
                      {initials(verifiedListing.owner_first_name, verifiedListing.owner_last_name)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium" style={{ color: "#111827" }}>
                      {verifiedListing.owner_first_name || verifiedListing.owner_last_name
                        ? `${verifiedListing.owner_first_name ?? ""} ${
                            verifiedListing.owner_last_name ?? ""
                          }`.trim()
                        : "UIUC Student"}
                    </span>
                    <span className="text-xs" style={{ color: "#6B7280" }}>
                      @{verifiedListing.owner_username}
                    </span>
                    <span
                      className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50"
                      style={{ color: "#2563EB" }}
                      title="Verified UIUC Student"
                    >
                      <span>✓</span>
                      <span>UIUC Verified</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Link
                    href={`/listings/${id}/contact`}
                    className="w-full inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-md"
                    style={{ backgroundColor: "#13294B" }}
                  >
                    Contact seller
                  </Link>
                  <Link
                    href={`/listings/${id}/report`}
                    className="w-full inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors hover:bg-white/80"
                    style={{ color: "#111827", borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}
                  >
                    Report listing
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </main>
      ) : (
        <main className="max-w-3xl mx-auto px-4 py-6">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm p-6">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
                {publicListing!.title}
              </h1>
              <span className="text-xl font-medium" style={{ color: "#111827" }}>
                ${publicListing!.monthly_rent} / month
              </span>
            </div>
            <p className="text-base mt-2" style={{ color: "#6B7280" }}>
              {publicListing!.nearby_landmark}
            </p>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              {dateRange}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-4">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {roomTypeLabel(publicListing!.room_type)}
              </span>
              {publicListing!.furnished && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  Furnished
                </span>
              )}
              {publicListing!.utilities_included && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  Utilities included
                </span>
              )}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${leaseTypeBadgeClass(
                  publicListing!.lease_type
                )}`}
              >
                {publicListing!.lease_type === "SUBLEASE" ? "Sublease" : "Lease takeover"}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                ACTIVE
              </span>
            </div>

            <p className="text-sm mt-4" style={{ color: "#6B7280" }}>
              @{publicListing!.owner_username}
            </p>

            {requiresLogin && (
              <div className="mt-6 p-4 rounded-lg border border-[#E5E7EB] bg-[#F8F9FB]">
                <p className="text-sm" style={{ color: "#111827" }}>
                  <Link
                    href="/login"
                    className="font-medium hover:underline"
                    style={{ color: "#13294B" }}
                  >
                    Log in
                  </Link>{" "}
                  to view photos, description, and exact address.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white mt-3"
                  style={{ backgroundColor: "#13294B" }}
                >
                  Log in
                </Link>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
