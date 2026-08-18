"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { areScenesReady, subscribeScenesReady } from "@/lib/render-store";
import { scrollToId } from "@/lib/lenis-store";

export function Preloader({ waitForScenes = false }: { waitForScenes?: boolean }) {
  const t = useTranslations("preloader");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [fontsOk, setFontsOk] = useState(false);
  const [dataOk, setDataOk] = useState(false);
  const [scenesOk, setScenesOk] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const start = performance.now();
    const minDuration = 1600;
    let raf: number;
    let finished = false;

    const dataReady = () => {
      const h1 = document.querySelector("h1")?.textContent?.trim() ?? "";
      return (
        h1.length > 3 &&
        document.querySelectorAll("#services h3").length >= 1 &&
        document.querySelectorAll("#projects a[href]").length >= 1 &&
        document.querySelectorAll("#blog a[href]").length >= 1
      );
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      setTimeout(() => {
        setDone(true);
        document.body.style.overflow = "";
        const hash = window.location.hash.slice(1);
        if (hash) {
          setTimeout(() => scrollToId(hash), 900);
        }
      }, 250);
    };

    const tick = (now: number) => {
      const ratio = Math.min((now - start) / minDuration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));
      const assetsLoaded = document.readyState === "complete";
      const fonts = document.fonts.status === "loaded";
      setFontsOk(fonts);
      const data = dataReady();
      setDataOk(data);
      const scenes = waitForScenes && areScenesReady();
      setScenesOk(waitForScenes ? scenes : true);
      if (ratio >= 1 && assetsLoaded && fonts && data && scenes) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const unsub = subscribeScenesReady(() => {});
    const safety = setTimeout(finish, 7000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
      unsub();
      document.body.style.overflow = "";
    };
  }, [waitForScenes]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
              fill="none"
            >
              <motion.path
                d="M 20 70 L 20 30 L 38 50 L 56 30 L 56 70"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-ink"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
              <motion.path
                d="M 64 30 L 92 30 M 78 30 L 78 70"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut", delay: 0.35 }}
              />
            </svg>
            <motion.div
              className="absolute -inset-4 rounded-full border border-line"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}
              style={{
                borderTopColor: "transparent",
                borderLeftColor: "transparent",
              }}
            />
          </div>

          <motion.p
            className="mt-10 font-mono text-sm tracking-[0.4em] text-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            MT
          </motion.p>

          <div className="mt-6 flex w-56 items-center gap-4">
            <div className="h-px flex-1 overflow-hidden bg-line">
              <motion.div
                className="h-full bg-gradient-to-r from-nebula via-neon to-aqua"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono text-sm text-soft">
              {progress}%
            </span>
          </div>

          <div className="mt-4 flex flex-col items-center gap-1 font-mono text-[10px] uppercase tracking-[0.3em]">
            <span className={fontsOk ? "text-neon" : "text-soft"}>
              {fontsOk ? t("fontsOk") : t("loadingFonts")}
            </span>
            <span className={dataOk ? "text-neon" : "text-soft"}>
              {dataOk ? t("dataOk") : t("renderingData")}
            </span>
            <span className={scenesOk ? "text-neon" : "text-soft"}>
              {scenesOk ? t("scenesOk") : t("renderingScenes")}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
