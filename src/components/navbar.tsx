"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Magnetic } from "./magnetic";
import { scrollToId } from "@/lib/lenis-store";

const LINKS = [
  { id: "about", key: "about" },
  { id: "projects", key: "projects" },
  { id: "skills", key: "skills" },
  { id: "experience", key: "experience" },
  { id: "blog", key: "blog" },
  { id: "contact", key: "contact" },
] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const pos = window.scrollY + window.innerHeight * 0.35;
      let current = "";
      for (const { id } of LINKS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= pos) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    const delay = open ? 350 : 0;
    if (document.getElementById(id)) {
      setTimeout(() => scrollToId(id), delay);
      return;
    }
    if (id === "home") {
      router.push("/");
      return;
    }
    setTimeout(() => router.push(`/#${id}`), delay);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-[70] transition-all duration-500 ${
          scrolled ? "glass-strong py-3 shadow-lg shadow-black/5" : "py-5"
        }`}
        style={{
          paddingTop: `calc(env(safe-area-inset-top, 0px) + ${
            scrolled ? "0.75rem" : "1.25rem"
          })`,
        }}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={() => go("home")}
            data-cursor="link"
            className="group flex items-center gap-2 font-display text-lg font-bold tracking-tight"
            aria-label="Back to top"
          >
            <span className="gradient-text">MT</span>
            <span className="hidden sm:inline text-soft">·</span>
            <span className="hidden text-sm font-medium text-soft sm:inline">
              {t("home")}
            </span>
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            {LINKS.map(({ id, key }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => go(id)}
                  data-cursor="link"
                  aria-current={isActive ? "true" : undefined}
                  className={`group relative font-mono text-xs uppercase tracking-[0.2em] transition-colors ${
                    isActive ? "text-ink" : "text-soft hover:text-ink"
                  }`}
                >
                  <span
                    className={`mr-1.5 inline-block h-1 w-1 rounded-full align-middle ${
                      isActive ? "bg-gradient-to-r from-nebula to-neon" : "bg-line"
                    }`}
                  />
                  {t(key)}
                  <span
                    className={`absolute -bottom-1 left-0 h-px bg-gradient-to-r from-nebula to-neon transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Magnetic className="hidden lg:block">
              <button
                onClick={() => go("contact")}
                data-cursor="link"
                className="group relative overflow-hidden rounded-full bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-bg"
              >
                <span className="relative z-10 transition-colors duration-300 group-hover:text-bg">
                  {t("hire")}
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-nebula via-neon to-aqua transition-transform duration-500 ease-out group-hover:translate-x-0" />
              </button>
            </Magnetic>
            <button
              onClick={() => setOpen(true)}
              data-cursor="link"
              aria-label="Open menu"
              className="glass flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col bg-bg/95 backdrop-blur-2xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center justify-between px-5 pb-4 pt-[max(env(safe-area-inset-top),1rem)]">
              <span className="font-display text-lg font-bold">
                <span className="gradient-text">MT</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                data-cursor="link"
                aria-label="Close menu"
                className="glass flex h-11 w-11 items-center justify-center rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-2 px-8">
              {LINKS.map(({ id, key }, i) => {
                const isActive = active === id;
                return (
                  <motion.button
                    key={id}
                    onClick={() => go(id)}
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                    aria-current={isActive ? "true" : undefined}
                    className={`text-left font-display text-5xl font-semibold transition-colors ${
                      isActive ? "gradient-text" : "text-soft hover:text-ink"
                    }`}
                  >
                    <span className="mr-3 font-mono text-sm text-neon">
                      0{i + 1}
                    </span>
                    {t(key)}
                  </motion.button>
                );
              })}
            </div>

            <div className="px-8 pb-[max(env(safe-area-inset-bottom),2.5rem)]">
              <motion.button
                onClick={() => go("contact")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="w-full rounded-full bg-ink py-4 font-mono text-sm font-semibold uppercase tracking-widest text-bg"
              >
                {t("hire")}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
