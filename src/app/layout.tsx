import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Md. Tariqul Islam — Full-Stack Web Developer",
    template: "%s | Md. Tariqul Islam",
  },
  description:
    "Full-stack web developer from Savar, Dhaka, Bangladesh. I build fast, cinematic, AI-powered web experiences with Next.js, React, TypeScript and Three.js.",
};

export const viewport: Viewport = {
  themeColor: "#05060a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
