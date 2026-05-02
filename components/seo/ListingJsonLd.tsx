/**
 * schema.org/Apartment + Offer JSON-LD for listing detail pages.
 *
 * Emits a <script type="application/ld+json"> with whatever fields are
 * actually visible on the page; we don't fabricate data that isn't shown
 * (so the verified vs. public stub views generate different payloads).
 */

type ListingJsonLdProps = {
  url: string;
  name: string;
  description?: string | null;
  monthly_rent?: number | null;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  total_bedrooms?: number | null;
  total_bathrooms?: number | null;
  exact_address?: string | null;
  nearby_landmark?: string | null;
  images?: string[];
};

function toIsoDate(d: string | Date | null | undefined): string | undefined {
  if (!d) return undefined;
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

export function ListingJsonLd(props: ListingJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: props.name,
    url: props.url,
  };

  if (props.description) data.description = props.description;
  if (typeof props.total_bedrooms === "number") data.numberOfBedrooms = props.total_bedrooms;
  if (typeof props.total_bathrooms === "number") data.numberOfBathroomsTotal = props.total_bathrooms;
  if (props.images && props.images.length > 0) data.image = props.images;

  if (props.exact_address || props.nearby_landmark) {
    const address: Record<string, unknown> = {
      "@type": "PostalAddress",
      addressLocality: "Champaign",
      addressRegion: "IL",
      addressCountry: "US",
    };
    if (props.exact_address) address.streetAddress = props.exact_address;
    data.address = address;
  }

  if (typeof props.monthly_rent === "number") {
    const offer: Record<string, unknown> = {
      "@type": "Offer",
      price: props.monthly_rent,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: props.url,
    };
    const validFrom = toIsoDate(props.start_date);
    const validThrough = toIsoDate(props.end_date);
    if (validFrom) offer.validFrom = validFrom;
    if (validThrough) offer.validThrough = validThrough;
    data.offers = offer;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
