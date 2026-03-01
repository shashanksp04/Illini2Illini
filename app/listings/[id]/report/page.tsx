import { ReportListingClient } from "@/components/listings/ReportListingClient";

export default async function ReportListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportListingClient listingId={id} />;
}
