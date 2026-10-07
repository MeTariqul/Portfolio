import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { site } from "@/lib/site";
import "./globals.css";

// Headings only ever render at weight 500 (see h1-h4 in globals.css), so we
// pin the weights instead of shipping whole variable axes. Same for the body
// face: 400 for text, 500 for buttons, 700 for markdown bold. This keeps the
// font payload small, which is what first paint waits on.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: "500",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "700"],
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

// Counts visits for the admin dashboard (app/api/visit). One ping per page
// load, then a heartbeat a minute while the tab stays open so "visitors
// online now" stays honest.
//
// sendBeacon hands the request to the network process, so the visit never
// touches the main thread while the page is still settling. A plain fetch
// showed up as a ~40 ms blocking task in the first seconds of load.
const visitScript = `(function(){
var K="visitor-id";
function vid(){try{var v=localStorage.getItem(K);if(!v){v=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2));localStorage.setItem(K,v)}return v}catch(e){return null}}
function ping(count){try{if(location.pathname.indexOf("/admin")===0)return;var v=vid();if(!v)return;var b=new Blob([JSON.stringify({v:v,c:count?1:0})],{type:"application/json"});if(navigator.sendBeacon&&navigator.sendBeacon("/api/visit",b))return;fetch("/api/visit",{method:"POST",keepalive:true,headers:{"content-type":"application/json"},body:JSON.stringify({v:v,c:count?1:0})})}catch(e){}}
function go(){ping(true);setInterval(function(){ping(false)},60000)}
if(document.readyState==="complete")go();else window.addEventListener("load",go);
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
        <script dangerouslySetInnerHTML={{ __html: visitScript }} />
        <Analytics />
      </body>
    </html>
  );
}
