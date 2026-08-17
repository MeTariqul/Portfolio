"use client";

import { useActionState, startTransition, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check, Loader2, Send } from "lucide-react";
import { sendContact, type ContactResult } from "@/app/actions/send-contact";

type FormValues = {
  name: string;
  email: string;
  message: string;
};

export function ContactForm() {
  const t = useTranslations("contact");

  const schema = z.object({
    name: z.string().min(2, t("errors.name")),
    email: z.string().email(t("errors.email")),
    message: z.string().min(10, t("errors.message")),
  });

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [state, formAction, pending] = useActionState<ContactResult | null, FormData>(
    sendContact,
    null
  );

  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    fd.set("name", values.name);
    fd.set("email", values.email);
    fd.set("message", values.message);
    startTransition(() => formAction(fd));
  });

  useEffect(() => {
    if (state?.ok) {
      reset();
    }
  }, [state, reset]);

  const inputClass =
    "w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base text-ink placeholder:text-soft/50 outline-none transition-all duration-300 focus:border-neon/60 focus:ring-2 focus:ring-neon/20 sm:text-sm";

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {state?.ok ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-strong flex flex-col items-center justify-center gap-4 rounded-3xl border border-emerald-400/30 px-8 py-20 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400"
            >
              <Check size={28} />
            </motion.span>
            <h3 className="font-display text-2xl font-semibold">{t("successTitle")}</h3>
            <p className="max-w-sm text-sm text-soft">{t("successDesc")}</p>
            {state.demo && (
              <p className="rounded-full border border-line px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-soft">
                demo mode — set RESEND_API_KEY to deliver
              </p>
            )}
            <button
              onClick={() => formRef.current?.requestSubmit()}
              className="mt-2 rounded-full border border-line px-6 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors hover:border-neon/50"
            >
              {t("sendAnother")}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong space-y-5 rounded-3xl p-7 sm:p-9"
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-soft">
                  {t("name")}
                </label>
                <input
                  {...register("name")}
                  className={inputClass}
                  placeholder="John Doe"
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="mt-2 font-mono text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-soft">
                  {t("email")}
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className={inputClass}
                  placeholder="john@example.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="mt-2 font-mono text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-soft">
                {t("message")}
              </label>
              <textarea
                {...register("message")}
                rows={6}
                className={`${inputClass} resize-none`}
                placeholder="Tell me about your project…"
                aria-invalid={!!errors.message}
              />
              {errors.message && (
                <p className="mt-2 font-mono text-xs text-red-400">{errors.message.message}</p>
              )}
            </div>

            {state && !state.ok && (
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 font-mono text-xs text-red-400">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              data-cursor="link"
              className="group relative w-full overflow-hidden rounded-full bg-ink py-4 font-mono text-xs font-semibold uppercase tracking-widest text-bg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {pending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t("sending")}
                  </>
                ) : (
                  <>
                    {t("send")}
                    <Send size={13} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                  </>
                )}
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-nebula via-neon to-aqua transition-transform duration-500 ease-out group-hover:translate-x-0" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
