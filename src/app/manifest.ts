import type { MetadataRoute } from "next";
import { getSite } from "@/lib/content";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSite();
  return {
    name: `${s.name} — ${s.role}`,
    short_name: s.shortName,
    description: `Portfolio of ${s.name} — ${s.role}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#05060a",
    theme_color: "#05060a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
