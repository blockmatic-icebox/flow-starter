import { ImageResponse } from "next/og";

export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        fontSize: 48,
        fontWeight: 600,
        height: "100%",
        justifyContent: "center",
        padding: 80,
        textAlign: "center",
        width: "100%",
      }}
    >
      <div style={{ fontSize: 56, marginBottom: 24 }}>Feature Intelligence</div>
      <div
        style={{ fontSize: 28, fontWeight: 400, maxWidth: 900, opacity: 0.9 }}
      >
        Product feature request triage — MCP, OpenAPI, and agent-ready docs
      </div>
    </div>,
    { ...size }
  );
}
