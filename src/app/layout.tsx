import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Md. Tariqul Islam | Web Developer from Bangladesh",
    template: "%s | Md. Tariqul Islam",
  },
  description:
    "Md. Tariqul Islam is a Web Developer from Bangladesh. He builds responsive websites, web applications, business platforms, and e-commerce solutions using Next.js, React, TypeScript, Python, and Django.",
  keywords: [
    "Md. Tariqul Islam",
    "Web Developer",
    "Next.js Developer",
    "React Developer",
    "TypeScript Developer",
    "Python Developer",
    "Django Developer",
    "Bangladesh Developer",
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
  verification: {
    google: "google62145c0c8174e585",
  },
  openGraph: {
    title: "Md. Tariqul Islam | Web Developer from Bangladesh",
    description:
      "Md. Tariqul Islam is a Web Developer from Bangladesh. He builds responsive websites, web applications, business platforms, and e-commerce solutions using Next.js, React, TypeScript, Python, and Django.",
    url: site.url,
    siteName: "Md. Tariqul Islam",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "Md. Tariqul Islam — Web Developer from Bangladesh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Md. Tariqul Islam | Web Developer from Bangladesh",
    description:
      "Md. Tariqul Islam is a Web Developer from Bangladesh. He builds responsive websites, web applications, business platforms, and e-commerce solutions using Next.js, React, TypeScript, Python, and Django.",
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