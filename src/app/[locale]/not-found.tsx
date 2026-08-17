import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Rocket } from "lucide-react";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_55%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:28px_28px] opacity-40"
      />
      <div aria-hidden className="absolute inset-0 animate-spin-slow">
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line" />
      </div>

      <p className="relative font-mono text-xs uppercase tracking-[0.5em] text-soft">
        404 · error
      </p>
      <h1 className="relative mt-6 font-display text-7xl font-bold tracking-tight sm:text-9xl">
        <span className="gradient-text">LOST</span>
      </h1>
      <p className="relative mt-6 max-w-md text-lg text-soft">{t("title")}</p>
      <p className="relative mt-3 max-w-md text-sm text-soft">{t("desc")}</p>

      <Link
        href="/"
        data-cursor="link"
        className="group relative mt-10 flex items-center gap-3 overflow-hidden rounded-full bg-ink px-8 py-4 font-mono text-xs font-semibold uppercase tracking-widest text-bg"
      >
        <span className="relative z-10 flex items-center gap-2">
          <Rocket size={14} className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-45" />
          {t("back")}
        </span>
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-nebula via-neon to-aqua transition-transform duration-500 ease-out group-hover:translate-x-0" />
      </Link>
    </div>
  );
}
