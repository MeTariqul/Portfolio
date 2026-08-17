import React from "react";
import { ImageResponse } from "@vercel/og";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const abs = (style) => React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...style } });

const glow = React.createElement("div", {
  style: {
    width: 640,
    height: 640,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 60%)",
  },
});

const label = React.createElement(
  "p",
  {
    style: {
      fontSize: 28,
      letterSpacing: "0.45em",
      color: "rgba(244,244,245,0.6)",
      margin: 0,
    },
  },
  "FULL-STACK WEB DEVELOPER"
);

const name = React.createElement(
  "h1",
  {
    style: {
      fontSize: 88,
      fontWeight: 800,
      margin: "18px 0 0 0",
      background: "linear-gradient(100deg,#8b5cf6,#ec4899,#22d3ee)",
      WebkitBackgroundClip: "text",
      color: "transparent",
    },
  },
  "Md. Tariqul Islam"
);

const tagline = React.createElement(
  "p",
  {
    style: {
      fontSize: 26,
      color: "rgba(244,244,245,0.75)",
      margin: "22px 0 0 0",
    },
  },
  "Next.js · React · TypeScript · AI · Three.js"
);

const element = React.createElement(
  "div",
  {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #05060a 0%, #12102a 55%, #05060a 100%)",
      fontFamily: "sans-serif",
      position: "relative",
    },
  },
  abs({}, glow),
  label,
  name,
  tagline
);

const response = new ImageResponse(element, { width: 1200, height: 630 });

const out = join(root, "public", "opengraph.png");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.from(await response.arrayBuffer()));
console.log("wrote", out);