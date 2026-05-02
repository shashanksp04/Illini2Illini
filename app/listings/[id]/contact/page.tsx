import type { Metadata } from "next";

import { ContactSellerClient } from "@/components/listings/ContactSellerClient";

export const metadata: Metadata = {
  title: "Contact seller | Illini2Illini",
  robots: { index: false, follow: false },
};

export default async function ContactSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContactSellerClient listingId={id} />;
}
