import { ImageResponse } from "next/og";

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
          background: "#2F5D7C",
        }}
      >
        <div
          style={{
            width: "60%",
            height: "60%",
            display: "flex",
            borderRadius: "9999px",
            border: "16px solid #F6EEDE",
          }}
        />
      </div>
    ),
    size,
  );
}
