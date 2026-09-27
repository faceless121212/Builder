import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Figure.09 — Ideas to build",
    short_name: "Figure.09",
    description: "Every idea you want to build, in one place.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f3f5fa",
    theme_color: "#181941",
    categories: ["productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "New idea",
        short_name: "New idea",
        description: "Capture a new idea",
        url: "/?new=1",
        icons: [{ src: "/icons/shortcut-new.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
