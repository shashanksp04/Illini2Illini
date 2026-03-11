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
    <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        {profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile_picture_url}
            alt=""
            className="h-12 w-12 rounded-full object-cover ring-2 ring-accent/20"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-sm font-semibold text-accent ring-2 ring-accent/20">
            {initials(first_name, last_name)}
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-brand">{displayName}</span>
          <span className="text-xs text-gray-500">@{username}</span>
          <span
            className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-brand"
            title="Verified UIUC Student"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            UIUC Verified
          </span>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Link
          href={contactHref}
          className="flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          Contact Seller
        </Link>
        <Link
          href={reportHref}
          className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          Report listing
        </Link>
      </div>
    </div>
  );
}
