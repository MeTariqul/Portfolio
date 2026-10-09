"use client";

import { useState } from "react";

// Share row for post pages: X, LinkedIn, and a copy-link button.
// Labels arrive from the server so the admin Copy screen can reword them.
export function ShareLinks({
  title,
  url,
  labels,
}: {
  title: string;
  url: string;
  labels: { share: string; x: string; linkedin: string; copy: string; copied: string };
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  }

  const encoded = { u: encodeURIComponent(url), t: encodeURIComponent(title) };

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <span className="text-soft">{labels.share}</span>
      <a
        href={`https://twitter.com/intent/tweet?u=${encoded.u}&t=${encoded.t}`}
        target="_blank"
        rel="noopener noreferrer"
        className="link-underline text-soft hover:text-ink"
      >
        {labels.x}
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded.u}`}
        target="_blank"
        rel="noopener noreferrer"
        className="link-underline text-soft hover:text-ink"
      >
        {labels.linkedin}
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="text-soft transition-colors hover:text-ink"
      >
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  );
}
