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
  keywords: [
    "Md. Tariqul Islam",
    "Tariqul Islam",
    "Full-Stack Developer",
    "Next.js Developer",
    "React Developer",
    "TypeScript Developer",
    "Python Developer",
    "AI Web Developer",
    "Web Developer Bangladesh",
    "Portfolio",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
