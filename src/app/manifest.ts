import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Olunia",
    short_name: "Olunia",
    description: "Social media harmonogram — plan, publish, measure.",
    start_url: `${BP}/en/intranet/social/calendar/`,
    scope: `${BP}/`,
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#faf9f6",
    icons: [
      {
        src: `${BP}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${BP}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${BP}/icons/maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
