import Link from "next/link";

export type CommunityListingCardItem = {
  id: string;
  title: string;
  monthly_rent: number | null;
  total_bedrooms: number | null;
  thumbnail_url?: string | null;
};

function rentLabel(rent: number | null): string {
  if (rent == null) return "Rent TBD";
  return `$${rent}`;
}

export function CommunityListingCard({ listing }: { listing: CommunityListingCardItem }) {
  const bedrooms =
    listing.total_bedrooms != null ? `${listing.total_bedrooms} bed` : "Bedrooms —";
  const thumb = listing.thumbnail_url ?? null;

  return (
    <Link
      href={`/community/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-amber-50/80">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-amber-200/90">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
            <span className="text-xs font-medium text-amber-600/80">No preview</span>
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-lg bg-amber-500/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
          Reddit
        </span>
        <span className="absolute right-2.5 top-2.5 rounded-lg bg-brand/90 px-2.5 py-1 text-sm font-bold tabular-nums text-white shadow-lg backdrop-blur-sm">
          {rentLabel(listing.monthly_rent)}
          {listing.monthly_rent != null ? (
            <span className="text-xs font-medium opacity-70">/mo</span>
          ) : null}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-[15px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-accent line-clamp-2">
            {listing.title}
          </h3>
        </div>
        <p className="text-xs font-medium text-indigo-600">{bedrooms}</p>
      </div>
    </Link>
  );
}
