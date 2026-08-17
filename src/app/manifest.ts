import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Md. Tariqul Islam — Full-Stack Web Developer",
    short_name: "MT Portfolio",
    description:
      "Portfolio of Md. Tariqul Islam — full-stack web developer building AI-powered web experiences.",
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
