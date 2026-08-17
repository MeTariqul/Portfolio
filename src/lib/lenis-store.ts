import type Lenis from "lenis";

let lenisInstance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  lenisInstance = lenis;
}

export function getLenis() {
  return lenisInstance;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) {
    if (id === "home") {
      if (lenisInstance) {
        try {
          lenisInstance.scrollTo(0, { duration: 1.2 });
          return;
        } catch {
          // fall through
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }
  if (lenisInstance) {
    try {
      lenisInstance.scrollTo(el, { offset: -72, duration: 1.4 });
      return;
    } catch {
      // lenis failed — fall back to native scrolling
    }
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
