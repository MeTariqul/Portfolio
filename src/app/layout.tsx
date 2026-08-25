import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Md. Tariqul Islam | Full-Stack Web Developer in Bangladesh",
    template: "%s | Md. Tariqul Islam",
  },
  description:
    "Md. Tariqul Islam is a Full-Stack Web Developer in Bangladesh specializing in Next.js, React, TypeScript, Python, Django, AI integration and SEO-friendly web applications.",
  keywords: [
    "Md. Tariqul Islam",
    "Tariqul Islam",
    "Full-Stack Developer",
    "Next.js Developer",
    "React Developer",
    "TypeScript Developer",
    "Python Developer",
    "Django Developer",
    "AI Web Developer",
    "Web Developer Bangladesh",
    "Dhaka Developer",
    "Savar Developer",
    "Portfolio",
    "Node.js Developer",
    "SEO-friendly Web Developer",
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
