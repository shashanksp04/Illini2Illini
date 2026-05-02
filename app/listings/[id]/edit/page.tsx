import type { Metadata } from "next";

import { EditListingClient } from "@/components/listings/EditListingClient";

export const metadata: Metadata = {
  title: "Edit listing | Illini2Illini",
  robots: { index: false, follow: false },
};

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditListingClient id={id} />;
}

