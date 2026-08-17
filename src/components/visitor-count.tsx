"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type VisitorData = { count: number | null; live: number | null };

export function VisitorCount({
  mode,
  className,
}: {
  mode: "total" | "live";
  className?: string;
}) {
  const t = useTranslations(mode === "live" ? "hero" : "footer");
  const [data, setData] = useState<VisitorData | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/visitors", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as VisitorData;
        if (alive) setData(json);
      } catch {
        // no backend configured — hide silently
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const value = mode === "live" ? data?.live : data?.count;
  if (typeof value !== "number") return null;

  return (
    <span className={className}>
      {value.toLocaleString()} {t("visitors")}
    </span>
  );
}