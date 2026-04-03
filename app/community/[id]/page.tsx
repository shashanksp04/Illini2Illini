import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { PageContainer } from "@/components/layout/PageContainer";
import { CommunitySourceCard } from "@/components/listings/CommunitySourceCard";
import { NegotiableBadge } from "@/components/listings/NegotiableBadge";
import { PhotoCarousel } from "@/components/listings/PhotoCarousel";

type PublicRedditDetail = {
  id: string;
  title: string;
  monthly_rent: number | null;
  total_bedrooms: number | null;
  thumbnail_url: string | null;
};

type VerifiedRedditDetail = {
  id: string;
  external_id: string;
  source: string;
  title: string;
  description: string;
  monthly_rent: number | null;
  lease_type: string | null;
  start_date: string | null;
  end_date: string | null;
  room_type: string | null;
  furnished: boolean | null;
  utilities_included: boolean | null;
  open_to_negotiation: boolean | null;
  gender_preference: string | null;
  nearby_landmark: string | null;
  total_bedrooms: number | null;
  total_bathrooms: number | null;
  exact_address: string | null;
  external_url: string;
  source_created_at: string;
  raw_text: string | null;
  images: string[];
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function leaseTypeBadgeClass(lt: string): string {
  return lt === "SUBLEASE"
    ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
    : lt === "LEASE_TAKEOVER"
      ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100"
      : "bg-gray-50 text-gray-600 ring-1 ring-gray-100";
}

function roomTypeLabel(rt: string): string {
  return rt === "PRIVATE_ROOM" ? "Private room" : "Entire unit";
}

function genderPreferenceLabel(g: string): string {
  return g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : "Any";
}

export default async function CommunityListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = await getApiBaseUrl();

  let publicListing: PublicRedditDetail | null = null;
  let verifiedListing: VerifiedRedditDetail | null = null;
  let requiresLogin = false;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
    const res = await fetch(`${base}/api/reddit-listings/${id}`, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    });
    const json = (await res.json()) as {
      ok?: boolean;
      data?: {
        listing?: PublicRedditDetail | VerifiedRedditDetail;
        requires_login_for_details?: boolean;
      };
      error?: { message?: string };
    };

    if (res.status === 404 || !json?.ok) {
      if (res.status === 404) notFound();
      return (
        <PageContainer>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
            <p className="text-sm text-red-600">{json?.error?.message ?? "Failed to load listing."}</p>
          </div>
        </PageContainer>
      );
    }

    const listing = json.data?.listing;
    requiresLogin = json.data?.requires_login_for_details === true;
    if (!listing) notFound();

    const hasVerifiedFields =
      !requiresLogin &&
      typeof (listing as VerifiedRedditDetail).external_url === "string" &&
      Array.isArray((listing as VerifiedRedditDetail).images);
    if (hasVerifiedFields) verifiedListing = listing as VerifiedRedditDetail;
    else publicListing = listing as PublicRedditDetail;
  } catch {
    return (
      <PageContainer>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <p className="text-sm text-red-600">Failed to load listing.</p>
        </div>
      </PageContainer>
    );
  }

  if (!publicListing && !verifiedListing) notFound();

  const l = (verifiedListing ?? publicListing)!;
  const isVerifiedView = Boolean(verifiedListing);
  const dateRange =
    verifiedListing && (verifiedListing.start_date || verifiedListing.end_date)
      ? `${formatDate(verifiedListing.start_date)} – ${formatDate(verifiedListing.end_date)}`
      : null;

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          href="/listings?tab=community"
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          ← Back to Community listings
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <main className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                Community (Reddit)
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-brand md:text-3xl">{l.title}</h1>
              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                <span className="rounded-xl bg-brand px-4 py-1.5 text-center text-xl font-bold tabular-nums text-white shadow-lg sm:text-right">
                  {l.monthly_rent != null ? (
                    <>
                      ${l.monthly_rent}
                      <span className="text-sm font-medium opacity-60">/mo</span>
                    </>
                  ) : (
                    "Rent TBD"
                  )}
                </span>
                {isVerifiedView && verifiedListing?.open_to_negotiation ? <NegotiableBadge /> : null}
              </div>
            </div>

            <p className="mt-4 text-sm font-medium text-indigo-600">
              {l.total_bedrooms != null ? `${l.total_bedrooms} bedroom${l.total_bedrooms === 1 ? "" : "s"}` : "Bedrooms —"}
            </p>

            {isVerifiedView && verifiedListing && (
              <>
                {verifiedListing.nearby_landmark ? (
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <svg
                        className="h-3.5 w-3.5 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {verifiedListing.nearby_landmark}
                    </span>
                  </div>
                ) : null}
                {dateRange ? (
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <svg
                        className="h-3.5 w-3.5 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {dateRange}
                    </span>
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {verifiedListing.room_type ? (
                    <Badge>{roomTypeLabel(verifiedListing.room_type)}</Badge>
                  ) : null}
                  {verifiedListing.furnished === true ? <Badge>Furnished</Badge> : null}
                  {verifiedListing.furnished === false ? <Badge>Unfurnished</Badge> : null}
                  {verifiedListing.utilities_included === true ? <Badge>Utilities included</Badge> : null}
                  {verifiedListing.utilities_included === false ? <Badge>Utilities not included</Badge> : null}
                  {verifiedListing.lease_type ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${leaseTypeBadgeClass(verifiedListing.lease_type)}`}
                    >
                      {verifiedListing.lease_type === "SUBLEASE" ? "Sublease" : "Lease takeover"}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {!isVerifiedView && publicListing?.thumbnail_url ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicListing.thumbnail_url} alt="" className="w-full object-cover" />
            </div>
          ) : null}

          {isVerifiedView && verifiedListing && verifiedListing.images.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-card">
              <PhotoCarousel
                photos={verifiedListing.images.map((image_url, display_order) => ({
                  image_url,
                  display_order,
                }))}
              />
            </div>
          ) : null}

          {isVerifiedView && verifiedListing && (
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
              <h2 className="mb-5 text-lg font-bold text-brand">Unit details</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {typeof verifiedListing.total_bedrooms === "number" ? (
                  <DetailItem label="Bedrooms" value={String(verifiedListing.total_bedrooms)} />
                ) : null}
                {typeof verifiedListing.total_bathrooms === "number" ? (
                  <DetailItem label="Bathrooms" value={String(verifiedListing.total_bathrooms)} />
                ) : null}
                {verifiedListing.room_type ? (
                  <DetailItem label="Room type" value={roomTypeLabel(verifiedListing.room_type)} />
                ) : null}
                {verifiedListing.furnished != null ? (
                  <DetailItem label="Furnished" value={verifiedListing.furnished ? "Yes" : "No"} />
                ) : null}
                {verifiedListing.utilities_included != null ? (
                  <DetailItem
                    label="Utilities"
                    value={verifiedListing.utilities_included ? "Included" : "Not included"}
                  />
                ) : null}
                {verifiedListing.open_to_negotiation != null ? (
                  <DetailItem
                    label="Open to negotiation"
                    value={verifiedListing.open_to_negotiation ? "Yes" : "No"}
                  />
                ) : null}
                {verifiedListing.gender_preference ? (
                  <DetailItem label="Gender pref." value={genderPreferenceLabel(verifiedListing.gender_preference)} />
                ) : null}
              </dl>
            </div>
          )}

          {isVerifiedView && verifiedListing && (
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
              <h2 className="mb-3 text-lg font-bold text-brand">Description</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{verifiedListing.description}</p>
            </div>
          )}

          {isVerifiedView && verifiedListing && verifiedListing.exact_address ? (
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
              <h2 className="mb-3 text-lg font-bold text-brand">Exact address</h2>
              <p className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                <svg
                  className="h-4 w-4 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {verifiedListing.exact_address}
              </p>
            </div>
          ) : null}

          {!isVerifiedView && publicListing && requiresLogin && (
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-light">
                  <svg
                    className="h-5 w-5 text-accent"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Sign in to see the full listing</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Log in with your @illinois.edu account to view description, dates, location details, and open the
                    post on Reddit.
                  </p>
                </div>
              </div>
              <Link
                href={`/login?redirect=/community/${id}`}
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-button transition-all hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
              >
                Log in
              </Link>
            </div>
          )}
        </main>

        <aside className="lg:col-span-4">
          {isVerifiedView && verifiedListing ? (
            <div className="lg:sticky lg:top-24">
              <CommunitySourceCard externalUrl={verifiedListing.external_url} />
            </div>
          ) : requiresLogin ? (
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card">
              <p className="text-sm font-semibold text-gray-900">Want to see more?</p>
              <p className="mt-1.5 text-sm text-gray-500">
                Sign in with your @illinois.edu account to view the full Reddit-sourced listing and open it on Reddit.
              </p>
              <Link
                href={`/login?redirect=/community/${id}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-button transition-all hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-gray-100">
      {children}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
