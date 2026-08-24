import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Transfer Pro",
    short_name: "Transfer Pro",
    description: "Private transfer booking and dispatch.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ed",
    theme_color: "#0b1d31",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" }
    ]
  };
}
