"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function WordReveal({
  text,
  className,
  delay = 0,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "span" | "h1" | "h2" | "p";
}) {
  const words = text.split(" ");

  return (
    <Tag className="inline">
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden pb-[0.12em] align-bottom"
        >
          <motion.span
            className={cn("inline-block will-change-transform", className)}
            initial={{ y: "115%", rotate: 4, opacity: 0 }}
            whileInView={{ y: 0, rotate: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
              delay: delay + i * 0.045,
            }}
          >
            {word}
            {"\u00A0"}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
