"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail, MapPin } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "./brand-icons";
import { SectionHeading } from "./section-heading";
import { ContactForm } from "./contact-form";
import { Magnetic } from "./magnetic";
import { site } from "@/lib/site";

export function Contact() {
  const t = useTranslations("contact");

  return (
    <section id="contact" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8 lg:py-36">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"
      />

      <SectionHeading number="09" label={t("label")} title={t("heading")} />

      <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col justify-center">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md text-lg leading-relaxed text-soft sm:text-xl"
          >
            {t("sub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 space-y-6"
          >
            <div className="flex items-center gap-4">
              <span className="glass flex h-12 w-12 items-center justify-center rounded-2xl text-neon">
                <Mail size={18} />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-soft">
                  {t("emailLabel")}
                </p>
                <a
                  href={`mailto:${site.email}`}
                  data-cursor="link"
                  className="font-display text-lg font-medium transition-colors hover:text-neon"
                >
                  {site.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="glass flex h-12 w-12 items-center justify-center rounded-2xl text-neon">
                <MapPin size={18} />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-soft">
                  {t("locationLabel")}
                </p>
                <p className="font-display text-lg font-medium">{site.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.25em] text-soft">
                {t("followLabel")}
              </span>
              {[
                { href: site.github, icon: GitHubIcon, label: "GitHub" },
                { href: site.linkedin, icon: LinkedInIcon, label: "LinkedIn" },
              ].map(({ href, icon: Icon, label }) => (
                <Magnetic key={label} strength={0.45}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    data-cursor="link"
                    className="glass flex h-11 w-11 items-center justify-center rounded-full text-soft transition-all duration-300 hover:scale-110 hover:text-neon"
                  >
                    <Icon width={17} height={17} />
                  </a>
                </Magnetic>
              ))}
            </div>
          </motion.div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
