"use client";

import dynamic from "next/dynamic";
import type { SkillsRings } from "@/components/skills";

const Skills = dynamic(() => import("@/components/skills").then((m) => m.Skills), {
  ssr: false,
  loading: () => (
    <section id="skills" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8 lg:py-36">
      <div className="h-[420px] sm:h-[520px]" />
    </section>
  ),
});

export function SkillsWrapper({ rings }: { rings?: SkillsRings }) {
  return <Skills rings={rings} />;
}
