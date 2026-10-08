"use client";

import { useEffect } from "react";

// Keeps an open admin tab honest. Every 15 seconds it asks for the
// session: if this device was signed out (a newer device took the last
// slot, or you signed out somewhere else) it leaves for the login page
// instead of letting the tab sit there pretending. The reply also clears
// the cookie Auth.js has already turned off, so the proxy stops seeing
// the device as signed in.
export function SessionWatch() {
  useEffect(() => {
    const timer = setInterval(() => {
      fetch("/api/auth/session", { cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) return; // a failed check is not a signed-out device
          const session = await res.json().catch(() => null);
          if (!session?.user) window.location.replace("/admin/login");
        })
        .catch(() => {
          // Server unreachable — leave the tab alone and try again later.
        });
    }, 15_000);

    return () => clearInterval(timer);
  }, []);

  return null;
}
