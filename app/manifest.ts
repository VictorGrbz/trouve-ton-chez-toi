import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trouve Ton Chez-Toi",
    short_name: "Chez-Toi",
    description:
      "Copilote d'achat immobilier : le carnet de visite intelligent qui accompagne chaque visite, avant, pendant et après.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#2f5d7c",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icon/maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
