import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Consistency: Task Tracker",
    short_name: "Consistency",
    description: "Plan your days, track time on what matters, and keep the streak alive.",
    start_url: "/login",
    display: "standalone",
    background_color: "#0b0b12",
    theme_color: "#4338ca",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
