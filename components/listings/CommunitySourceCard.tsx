export type CommunitySourceCardProps = {
  externalUrl: string;
};

export function CommunitySourceCard({ externalUrl }: CommunitySourceCardProps) {
  return (
    <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-card transition-all duration-200 hover:shadow-card-hover">
      <p className="text-sm text-gray-600">
        This listing was aggregated from Reddit. It is not posted or verified on Illini2Illini.
      </p>
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-amber-600 hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
      >
        View on Reddit
      </a>
    </div>
  );
}
