import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { site } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Applies the saved theme (or system default) before paint to avoid a flash.
// Also flags that JS is on: reveal sections only stay hidden when JS is
// around to show them (see .js .reveal in globals.css).
const themeScript = `(function(){try{var s=localStorage.getItem("theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}
document.documentElement.classList.add("js");})();`;

// Fades .reveal sections in as they scroll into view, without needing React
// to hydrate first. The observer also picks up sections that appear later
// through client-side navigation.
const revealScript = `(function(){
var io=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){if(es[i].isIntersecting){es[i].target.classList.add("revealed");io.unobserve(es[i].target)}}},{threshold:0});
function scan(){var els=document.querySelectorAll(".reveal:not(.revealed)");for(var i=0;i<els.length;i++)io.observe(els[i])}
scan();
new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Web developer`,
    template: `%s · ${site.name}`,
  },
  description:
    "Portfolio and blog of Md. Tariqul Islam, a web developer from Savar, Dhaka, Bangladesh.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1917" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: revealScript }} />
        <Analytics />
      </body>
    </html>
  );
}
