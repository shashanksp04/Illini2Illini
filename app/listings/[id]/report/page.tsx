import type { Metadata } from "next";

import { ReportListingClient } from "@/components/listings/ReportListingClient";

export const metadata: Metadata = {
  title: "Report listing | Illini2Illini",
  robots: { index: false, follow: false },
};

export default async function ReportListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportListingClient listingId={id} />;
}
