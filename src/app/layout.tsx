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
    "Md. Tariqul Islam is one of the best full-stack web developers in Bangladesh. Hire a top Next.js, React, TypeScript, Python and Django developer for SEO-friendly, high-performance web applications.",
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
    "Best Web Developer Bangladesh",
    "Hire Web Developer",
    "Freelance Developer Bangladesh",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: "google62145c0c8174e585",
  },
  openGraph: {
    title: "Md. Tariqul Islam | Best Full-Stack Web Developer in Bangladesh",
    description: "Top full-stack web developer in Bangladesh — Next.js, React, TypeScript, Python, Django, AI integration and SEO-friendly web applications.",
    url: site.url,
    siteName: "Md. Tariqul Islam",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "Md. Tariqul Islam — Full-Stack Web Developer in Bangladesh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Md. Tariqul Islam | Best Full-Stack Web Developer in Bangladesh",
    description: "Top full-stack web developer in Bangladesh — Next.js, React, TypeScript, Python, Django, AI integration and SEO-friendly web applications.",
    images: ["/opengraph.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
