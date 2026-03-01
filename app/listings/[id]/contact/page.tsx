import { ContactSellerClient } from "@/components/listings/ContactSellerClient";

export default async function ContactSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContactSellerClient listingId={id} />;
}
