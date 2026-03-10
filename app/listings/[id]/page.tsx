import Link from "next/link";
import { notFound } from "next/navigation";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { PageContainer } from "@/components/layout/PageContainer";
import { SellerCard } from "@/components/listings/SellerCard";

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
  total_bedrooms?: number;
  gender_preference?: string;
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

function genderPreferenceLabel(g: string): string {
  switch (g) {
    case "MALE":
      return "Male";
    case "FEMALE":
      return "Female";
    case "ANY":
    default:
      return "Any";
  }
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
    const json = (await res.json()) as {
      ok?: boolean;
      data?: {
        listing?: PublicListingDetail | VerifiedListingDetail;
        requires_login_for_details?: boolean;
      };
      error?: { message?: string };
    };

    if (res.status === 404 || !json?.ok) {
      if (res.status === 404) notFound();
      return (
        <PageContainer>
          <p className="text-sm text-red-600" role="alert">
            {json?.error?.message ?? "Failed to load listing."}
          </p>
        </PageContainer>
      );
    }

    const listing = json.data?.listing;
    requiresLogin = json.data?.requires_login_for_details === true;

    if (!listing) {
      notFound();
    }

    const hasVerifiedFields =
      !requiresLogin &&
      typeof (listing as VerifiedListingDetail).exact_address === "string" &&
      Array.isArray((listing as VerifiedListingDetail).photos);

    if (hasVerifiedFields) {
      verifiedListing = listing as VerifiedListingDetail;
    } else {
      publicListing = listing as PublicListingDetail;
    }
  } catch {
    return (
      <PageContainer>
        <p className="text-sm text-red-600" role="alert">
          Failed to load listing.
        </p>
      </PageContainer>
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
    <PageContainer>
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main content: col-span-8 */}
        <main className="space-y-6 md:space-y-8 lg:col-span-8">
          {/* Title, Rent, Landmark, Date range - single card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-2xl font-semibold text-illini-blue md:text-3xl">
                {listingForHeader.title}
              </h1>
              <span className="text-xl font-medium text-illini-orange shrink-0">
                ${listingForHeader.monthly_rent} / month
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">{listingForHeader.nearby_landmark}</p>
            <p className="text-xs text-gray-500">{dateRange}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {roomTypeLabel(listingForHeader.room_type)}
              </span>
              {listingForHeader.furnished && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  Furnished
                </span>
              )}
              {listingForHeader.utilities_included && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  Utilities included
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${leaseTypeBadgeClass(
                  listingForHeader.lease_type
                )}`}
              >
                {listingForHeader.lease_type === "SUBLEASE" ? "Sublease" : "Lease takeover"}
              </span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Photo gallery - verified only */}
          {isVerifiedView && verifiedListing && verifiedListing.photos.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-illini-blue mb-4">Photos</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {verifiedListing.photos
                  .slice()
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((photo) => (
                    <div
                      key={`${photo.image_url}-${photo.display_order}`}
                      className="overflow-hidden rounded-xl bg-gray-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.image_url}
                        alt=""
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Unit details - verified only (bedrooms, gender preference when available) */}
          {isVerifiedView && verifiedListing && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-illini-blue mb-3">Unit details</h2>
              <dl className="space-y-2 text-sm">
                {typeof verifiedListing.total_bedrooms === "number" && (
                  <div>
                    <dt className="text-gray-500">Bedrooms</dt>
                    <dd className="font-medium text-gray-700">{verifiedListing.total_bedrooms}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Room type</dt>
                  <dd className="font-medium text-gray-700">
                    {roomTypeLabel(verifiedListing.room_type)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Furnished</dt>
                  <dd className="font-medium text-gray-700">
                    {verifiedListing.furnished ? "Yes" : "No"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Utilities included</dt>
                  <dd className="font-medium text-gray-700">
                    {verifiedListing.utilities_included ? "Yes" : "No"}
                  </dd>
                </div>
                {verifiedListing.gender_preference && (
                  <div>
                    <dt className="text-gray-500">Gender preference</dt>
                    <dd className="font-medium text-gray-700">
                      {genderPreferenceLabel(verifiedListing.gender_preference)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Description - verified only */}
          {isVerifiedView && verifiedListing && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-illini-blue mb-3">Description</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {verifiedListing.description}
              </p>
            </div>
          )}

          {/* Exact address - verified only */}
          {isVerifiedView && verifiedListing && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-illini-blue mb-3">Exact address</h2>
              <p className="text-sm text-gray-600">{verifiedListing.exact_address}</p>
            </div>
          )}

          {/* Report listing link - verified only */}
          {isVerifiedView && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <Link
                href={`/listings/${id}/report`}
                className="text-sm font-medium text-illini-orange hover:underline focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
              >
                Report this listing
              </Link>
            </div>
          )}

          {/* Public: seller row (username only) + login CTA */}
          {!isVerifiedView && publicListing && (
            <>
              <p className="text-sm text-gray-500">@{publicListing.owner_username}</p>
              {requiresLogin && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-700">
                    <Link
                      href="/login"
                      className="font-medium text-illini-orange hover:underline focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
                    >
                      Log in
                    </Link>{" "}
                    with your @illinois.edu account to view photos, description, exact address, and
                    contact the seller.
                  </p>
                  <Link
                    href="/login"
                    className="mt-4 inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
                  >
                    Log in
                  </Link>
                </div>
              )}
            </>
          )}
        </main>

        {/* Sidebar: col-span-4 - SellerCard (verified only) or Login CTA (public) */}
        <aside className="lg:col-span-4">
          {isVerifiedView && verifiedListing ? (
            <div className="lg:sticky lg:top-6">
              <SellerCard
                profile_picture_url={verifiedListing.owner_profile_picture_url}
                first_name={verifiedListing.owner_first_name}
                last_name={verifiedListing.owner_last_name}
                username={verifiedListing.owner_username}
                contactHref={`/listings/${id}/contact`}
                reportHref={`/listings/${id}/report`}
              />
            </div>
          ) : requiresLogin ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-illini-blue">Want to see more?</p>
              <p className="mt-1 text-sm text-gray-500">
                Sign in with your @illinois.edu account to view photos, description, and contact
                the seller.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
              >
                Log in
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </PageContainer>
  );
}
