import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// The "b." mark — mango dot on ink, generated at build.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16100D",
          borderRadius: 14,
          fontSize: 46,
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: "-0.05em",
          color: "#FFF3E4",
        }}
      >
        b<span style={{ color: "#FF7A00" }}>.</span>
      </div>
    ),
    { ...size }
  );
}
