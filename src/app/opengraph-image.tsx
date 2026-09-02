import { ImageResponse } from "next/og";
import { site } from "@/site.config";

export const alt = `${site.name} — put your business online`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#16100D",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 620,
            height: 620,
            borderRadius: 999,
            background: "radial-gradient(circle at 35% 35%, #FF7A00 0%, #E23E2C 55%, rgba(226,62,44,0) 72%)",
            opacity: 0.85,
            display: "flex",
          }}
        />
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#FF9C5B" }}>
          Digital service agency · India
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", fontSize: 108, fontWeight: 800, letterSpacing: "-0.04em", color: "#FFF3E4" }}>
            brandit<span style={{ color: "#FF7A00" }}>bro</span><span style={{ color: "#E23E2C" }}>.</span>
          </div>
          <div style={{ display: "flex", fontSize: 38, lineHeight: 1.25, color: "rgba(255,243,228,0.82)", maxWidth: 820 }}>
            We put any business online — websites, apps, marketing, video. Sorted.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {["Fixed price", "Agreed launch date", "You own everything"].map((t) => (
            <div key={t} style={{ display: "flex", padding: "12px 22px", borderRadius: 999, border: "1px solid rgba(255,243,228,0.28)", fontSize: 22, color: "#FFF3E4" }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
