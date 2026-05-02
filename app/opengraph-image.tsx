import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Illini2Illini — Find Short-Term Housing at UIUC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F8F9FB",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
          <span style={{ fontSize: 48, fontWeight: 700, color: "#13294B" }}>Illini</span>
          <span style={{ fontSize: 48, fontWeight: 700, color: "#E84A27" }}>2</span>
          <span style={{ fontSize: 48, fontWeight: 700, color: "#13294B" }}>Illini</span>
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          Find Short-Term Housing at UIUC
        </div>

        <div style={{ fontSize: 32, color: "#6B7280" }}>
          Verified students. No spam. No scams.
        </div>
      </div>
    ),
    { ...size },
  );
}
