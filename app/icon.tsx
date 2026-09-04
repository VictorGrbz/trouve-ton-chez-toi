import { ImageResponse } from "next/og";

export const contentType = "image/png";

const sizes: Record<string, { width: number; height: number }> = {
  "192": { width: 192, height: 192 },
  "512": { width: 512, height: 512 },
  "maskable-512": { width: 512, height: 512 },
};

export function generateImageMetadata() {
  return Object.entries(sizes).map(([id, size]) => ({
    id,
    size,
    contentType,
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const iconId = await id;
  const iconSize = sizes[iconId] ?? sizes["512"];
  const isMaskable = iconId === "maskable-512";
  const padding = isMaskable ? "20%" : "12%";

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
            width: `${100 - parseFloat(padding) * 2}%`,
            height: `${100 - parseFloat(padding) * 2}%`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "22%",
            background: "#F6EEDE",
          }}
        >
          <div
            style={{
              width: "46%",
              height: "46%",
              display: "flex",
              borderRadius: "9999px",
              border: "24px solid #8A6520",
            }}
          />
        </div>
      </div>
    ),
    iconSize,
  );
}
