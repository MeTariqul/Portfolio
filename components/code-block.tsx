"use client";

import { useState } from "react";

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

// <pre> override used by the markdown renderer: adds a copy button and a
// small language label to code blocks.
export function CodeBlock({
  children,
  className,
  labels,
  ...props
}: React.HTMLAttributes<HTMLPreElement> & {
  labels: { copy: string; copied: string };
}) {
  const [copied, setCopied] = useState(false);
  const code = textOf(children).replace(/\n$/, "");
  const codeEl = Array.isArray(children) ? children[0] : children;
  const codeClass =
    codeEl &&
    typeof codeEl === "object" &&
    "props" in codeEl
      ? String((codeEl as { props: { className?: string } }).props.className ?? "")
      : "";
  const lang =
    /language-(\w+)/.exec(codeClass)?.[1] ??
    /language-(\w+)/.exec(className ?? "")?.[1];

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable (http context) — button just does nothing
    }
  }

  return (
    <div className="relative">
      <pre className={className} {...props}>
        {children}
      </pre>
      <div className="absolute top-2 right-3 flex items-center gap-2">
        {lang && (
          <span className="text-[0.7rem] text-soft/80" aria-hidden>
            {lang}
          </span>
        )}
        <button
          type="button"
          onClick={copy}
          className="rounded border border-line bg-bg px-2 py-1 text-[0.7rem] text-soft transition-colors hover:text-ink"
        >
          {copied ? labels.copied : labels.copy}
        </button>
      </div>
    </div>
  );
}
