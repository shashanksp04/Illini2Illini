import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#13294B",
          color: "#FFFFFF",
          fontSize: 84,
          fontWeight: 800,
          letterSpacing: -2,
          fontFamily: "Inter, system-ui, sans-serif",
          borderRadius: 36,
        }}
      >
        <span style={{ color: "#FFFFFF" }}>I</span>
        <span style={{ color: "#FF5F05" }}>2</span>
        <span style={{ color: "#FFFFFF" }}>I</span>
      </div>
    ),
    { ...size },
  );
}
