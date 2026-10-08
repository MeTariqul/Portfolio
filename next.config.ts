import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com"
        : "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      // img-src: images live inside the content the admin writes — markdown
      // in posts, and the "url | alt" lines in a project's Screenshots field —
      // so a fixed host list silently breaks any link pasted from elsewhere
      // (that is what broke a postimg.cc screenshot). Images cannot execute,
      // so https: is the practical allowlist; Supabase and Cloudinary are
      // https and stay covered. connect-src keeps its narrow list, because
      // that one is about the browser talking to storage and the beacon.
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.supabase.co",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["192.168.0.10"],
  // Inline the stylesheet into the HTML so first paint has no render-blocking
  // request to wait for (measured by PageSpeed/Lighthouse).
  experimental: {
    inlineCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/cv/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  // Browsers and a few tools still ask for /favicon.ico directly; we only ship
  // app/icon.svg, so send that request onwards instead of returning a 404.
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/icon.svg", permanent: true },
    ];
  },
};

export default nextConfig;
