import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "UIUC housing listing on Illini2Illini";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://illini2illini.com";

type ListingOgData = {
  title?: string;
  monthly_rent?: number;
  nearby_landmark?: string;
};

export default async function Image({ params }: { params: Promise<{ alias: string }> }) {
  const { alias } = await params;
  let listing: ListingOgData | null = null;

  try {
    const res = await fetch(
      `${APP_URL}/api/listings/by-alias/${encodeURIComponent(alias)}`,
      { next: { revalidate: 300 } },
    );
    if (res.ok) {
      const json = (await res.json()) as { ok?: boolean; data?: { listing?: ListingOgData } };
      if (json?.ok) listing = json.data?.listing ?? null;
    }
  } catch {
    // Fall through to generic card.
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#FFFFFF",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.15,
            maxWidth: 1040,
            display: "flex",
          }}
        >
          {listing?.title || "UIUC Housing Listing"}
        </div>

        <div style={{ fontSize: 48, color: "#E84A27", marginTop: 28, fontWeight: 600 }}>
          {typeof listing?.monthly_rent === "number"
            ? `$${listing.monthly_rent}/month`
            : "Verified UIUC student listing"}
        </div>

        {listing?.nearby_landmark ? (
          <div style={{ fontSize: 32, color: "#6B7280", marginTop: 16 }}>
            near {listing.nearby_landmark}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 56,
            display: "flex",
            alignItems: "center",
            fontSize: 26,
            color: "#13294B",
            fontWeight: 600,
          }}
        >
          <span style={{ color: "#13294B" }}>Illini</span>
          <span style={{ color: "#E84A27" }}>2</span>
          <span style={{ color: "#13294B" }}>Illini</span>
          <span style={{ color: "#6B7280", marginLeft: 12, fontWeight: 500 }}>
            • Verified UIUC Students Only
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
