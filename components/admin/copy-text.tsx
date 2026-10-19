"use client";

import { useState } from "react";

// Copies arbitrary text (API keys, license keys, snippets, public keys).
export function CopyText({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
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
      className={className ?? "link-underline text-xs text-accent hover:text-ink"}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
