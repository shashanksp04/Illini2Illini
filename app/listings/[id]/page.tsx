import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { PageContainer } from "@/components/layout/PageContainer";
import { SellerCard } from "@/components/listings/SellerCard";
import { PhotoCarousel } from "@/components/listings/PhotoCarousel";

type PublicListingDetail = {
  id: string;
  title: string;
  monthly_rent: number;
  start_date: string;
  end_date: string;
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

type VerifiedPhoto = { image_url: string; display_order: number };

type VerifiedListingDetail = PublicListingDetail & {
  exact_address: string;
  description: string;
  gender_preference?: string;
  photos: VerifiedPhoto[];
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_profile_picture_url: string | null;
};

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function leaseTypeBadgeClass(lt: string): string {
  return lt === "SUBLEASE" ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100" : lt === "LEASE_TAKEOVER" ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100" : "bg-gray-50 text-gray-600 ring-1 ring-gray-100";
}

function roomTypeLabel(rt: string): string {
  return rt === "PRIVATE_ROOM" ? "Private Room" : "Entire Unit";
}

function genderPreferenceLabel(g: string): string {
  return g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : "Any";
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = await getApiBaseUrl();

  let publicListing: PublicListingDetail | null = null;
  let verifiedListing: VerifiedListingDetail | null = null;
  let requiresLogin = false;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(`${base}/api/listings/${id}`, { cache: "no-store", headers: { Cookie: cookieHeader } });
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { listing?: PublicListingDetail | VerifiedListingDetail; requires_login_for_details?: boolean };
      error?: { message?: string };
    };

    if (res.status === 404 || !json?.ok) {
      if (res.status === 404) notFound();
      return <PageContainer><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert"><p className="text-sm text-red-600">{json?.error?.message ?? "Failed to load listing."}</p></div></PageContainer>;
    }

    const listing = json.data?.listing;
    requiresLogin = json.data?.requires_login_for_details === true;
    if (!listing) notFound();

    const hasVerifiedFields = !requiresLogin && typeof (listing as VerifiedListingDetail).exact_address === "string" && Array.isArray((listing as VerifiedListingDetail).photos);
    if (hasVerifiedFields) verifiedListing = listing as VerifiedListingDetail;
    else publicListing = listing as PublicListingDetail;
  } catch {
    return <PageContainer><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert"><p className="text-sm text-red-600">Failed to load listing.</p></div></PageContainer>;
  }

  if (!publicListing && !verifiedListing) notFound();

  const l = (verifiedListing ?? publicListing)!;
  const dateRange = `${formatDate(l.start_date)} – ${formatDate(l.end_date)}`;
  const isVerifiedView = Boolean(verifiedListing);

  return (
    <PageContainer>
      <div className="grid gap-8 lg:grid-cols-12">
        <main className="space-y-6 lg:col-span-8">
          {/* Header */}
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-brand md:text-3xl">{l.title}</h1>
              <span className="shrink-0 rounded-xl bg-brand px-4 py-1.5 text-xl font-bold tabular-nums text-white shadow-lg">
                ${l.monthly_rent}<span className="text-sm font-medium opacity-60">/mo</span>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {l.nearby_landmark}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {dateRange}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {(l.total_bedrooms != null || l.total_bathrooms != null) && (
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 ring-1 ring-indigo-100">
                  {l.total_bedrooms ?? "?"}B / {l.total_bathrooms ?? "?"}Ba
                </span>
              )}
              <Badge>{roomTypeLabel(l.room_type)}</Badge>
              {l.furnished && <Badge>Furnished</Badge>}
              {l.utilities_included && <Badge>Utilities included</Badge>}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${leaseTypeBadgeClass(l.lease_type)}`}>
                {l.lease_type === "SUBLEASE" ? "Sublease" : "Lease takeover"}
              </span>
            </div>
          </div>

          {/* Photos */}
          {isVerifiedView && verifiedListing && verifiedListing.photos.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-card">
              <PhotoCarousel photos={verifiedListing.photos} />
            </div>
          )}

          {!isVerifiedView && publicListing?.thumbnail_url && (
            <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicListing.thumbnail_url} alt="" className="w-full object-cover" />
            </div>
          )}

          {/* Unit details */}
          {isVerifiedView && verifiedListing && (
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
              <h2 className="mb-5 text-lg font-bold text-brand">Unit details</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {typeof verifiedListing.total_bedrooms === "number" && (
                  <DetailItem label="Bedrooms" value={String(verifiedListing.total_bedrooms)} />
                )}
                {typeof verifiedListing.total_bathrooms === "number" && (
                  <DetailItem label="Bathrooms" value={String(verifiedListing.total_bathrooms)} />
                )}
                <DetailItem label="Room type" value={roomTypeLabel(verifiedListing.room_type)} />
                <DetailItem label="Furnished" value={verifiedListing.furnished ? "Yes" : "No"} />
                <DetailItem label="Utilities" value={verifiedListing.utilities_included ? "Included" : "Not included"} />
                {verifiedListing.gender_preference && (
                  <DetailItem label="Gender pref." value={genderPreferenceLabel(verifiedListing.gender_preference)} />
                )}
              </dl>
            </div>
          )}

          {/* Description */}
          {isVerifiedView && verifiedListing && (
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
              <h2 className="mb-3 text-lg font-bold text-brand">Description</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{verifiedListing.description}</p>
            </div>
          )}

          {/* Address */}
          {isVerifiedView && verifiedListing && (
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
              <h2 className="mb-3 text-lg font-bold text-brand">Exact address</h2>
              <p className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {verifiedListing.exact_address}
              </p>
            </div>
          )}

          {/* Report */}
          {isVerifiedView && (
            <Link href={`/listings/${id}/report`} className="inline-flex items-center text-sm font-medium text-gray-400 transition-colors hover:text-accent">
              Report this listing
            </Link>
          )}

          {/* Public CTA */}
          {!isVerifiedView && publicListing && (
            <>
              <p className="text-sm text-gray-500">Posted by <span className="font-medium">@{publicListing.owner_username}</span></p>
              {requiresLogin && (
                <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-light">
                      <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Sign in to see the full listing</p>
                      <p className="mt-1 text-sm text-gray-500">Log in with your @illinois.edu account to view photos, description, exact address, and contact the seller.</p>
                    </div>
                  </div>
                  <Link href={`/login?redirect=/listings/${id}`} className="mt-5 inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-button transition-all hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2">
                    Log in
                  </Link>
                </div>
              )}
            </>
          )}
        </main>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          {isVerifiedView && verifiedListing ? (
            <div className="lg:sticky lg:top-24">
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
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card">
              <p className="text-sm font-semibold text-gray-900">Want to see more?</p>
              <p className="mt-1.5 text-sm text-gray-500">Sign in with your @illinois.edu account to view photos, description, and contact the seller.</p>
              <Link href={`/login?redirect=/listings/${id}`} className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-button transition-all hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2">
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
  return <span className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-gray-100">{children}</span>;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
