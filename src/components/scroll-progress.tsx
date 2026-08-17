"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[85] h-[2.5px] origin-left bg-gradient-to-r from-nebula via-neon to-aqua"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
