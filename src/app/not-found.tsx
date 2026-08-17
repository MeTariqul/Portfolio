import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", background: "#05060a", color: "#f4f4f5" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 72, margin: 0 }}>404</h1>
          <p>Lost in space</p>
          <Link
            href="/"
            style={{ color: "#8b5cf6", textDecoration: "none", fontWeight: 600 }}
          >
            Return home
          </Link>
        </div>
      </body>
    </html>
  );
}
