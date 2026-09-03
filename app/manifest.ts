import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trouve Ton Chez-Toi",
    short_name: "Chez-Toi",
    description:
      "Copilote d'achat immobilier : le carnet de visite intelligent qui accompagne chaque visite, avant, pendant et après.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [],
  };
}
