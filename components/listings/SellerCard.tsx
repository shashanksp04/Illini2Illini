import Link from "next/link";

export type SellerCardProps = {
  profile_picture_url: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string;
  contactHref: string;
  reportHref: string;
};

function initials(first: string | null, last: string | null): string {
  const a = first?.[0] ?? "";
  const b = last?.[0] ?? "";
  const combined = `${a}${b}`.toUpperCase();
  return combined || "U";
}

/**
 * Seller card for listing detail sidebar. Same design system as ListingCard/Navbar.
 * Verified context only: profile picture, full name, username, verified badge, Contact + Report.
 */
export function SellerCard({
  profile_picture_url,
  first_name,
  last_name,
  username,
  contactHref,
  reportHref,
}: SellerCardProps) {
  const displayName =
    first_name || last_name
      ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
      : "UIUC Student";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        {profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile_picture_url}
            alt=""
            className="h-12 w-12 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
            {initials(first_name, last_name)}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-illini-blue truncate">{displayName}</span>
          <span className="text-xs text-gray-500">@{username}</span>
          <span
            className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-illini-blue"
            title="Verified UIUC Student"
          >
            <span aria-hidden>✓</span>
            UIUC Verified
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Link
          href={contactHref}
          className="flex w-full items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
        >
          Contact Seller
        </Link>
        <Link
          href={reportHref}
          className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          Report listing
        </Link>
      </div>
    </div>
  );
}
