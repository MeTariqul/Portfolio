"use client";

import { useState } from "react";

// Small "copy to clipboard" button used for media URLs.
export function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="link-underline text-xs text-accent hover:text-ink"
      title={url}
    >
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}
