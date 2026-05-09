import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Codetama — a creature that lives in your code";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "#0a0a0a",
          color: "#f5e6c8",
          padding: "80px",
          display: "flex",
          flexDirection: "column",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background: "#f5e6c8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0a0a0a",
              fontSize: "48px",
              fontWeight: 700,
            }}
          >
            {">"}
          </div>
          <div style={{ display: "flex", fontSize: "36px", color: "#888" }}>codetama.com</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "80px" }}>
          <div style={{ display: "flex", fontSize: "108px", fontWeight: 700, lineHeight: 1.05 }}>
            a creature
          </div>
          <div style={{ display: "flex", fontSize: "108px", fontWeight: 700, lineHeight: 1.05, color: "#7ee787" }}>
            that lives
          </div>
          <div style={{ display: "flex", fontSize: "108px", fontWeight: 700, lineHeight: 1.05 }}>
            in your code.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: "26px",
            color: "#888",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex" }}>$ npm i -g codetama</div>
            <div style={{ display: "flex", color: "#555" }}>tamagotchi for claude code</div>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            <Tag label="warrior" color="#ff6b6b" />
            <Tag label="sage" color="#5fb3ff" />
            <Tag label="trickster" color="#c98aff" />
            <Tag label="balanced" color="#7ee787" />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        border: `1px solid ${color}`,
        color,
        padding: "6px 16px",
        fontSize: "20px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
}
