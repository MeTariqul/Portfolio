"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export type ContactResult =
  | { ok: true; demo?: boolean }
  | { ok: false; error: string };

export async function sendContact(
  prev: ContactResult | null,
  formData: FormData
): Promise<ContactResult> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Validation failed" };
  }

  const { name, email, message } = parsed.data;

  const supabase = createAdminClient();
  let stored = false;
  if (supabase) {
    try {
      const { error } = await supabase
        .from("messages")
        .insert({ name, email, message });
      stored = !error;
    } catch {
      stored = false;
    }
  }

  const t = await getTranslations({ locale: "en", namespace: "contact" });

  let confirmed = false;
  const brevoKey = process.env.BREVO_API_KEY;
  const sender = process.env.CONTACT_EMAIL;
  if (brevoKey && sender) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { email: sender, name: site.name },
          to: [{ email }],
          subject: t("confirmSubject"),
          htmlContent: `<p>${t("confirmGreeting", { name })}</p>
<p>${t("confirmBody")}</p>
<p>${t("confirmSignature")}</p>`,
        }),
      });
      confirmed = res.ok;
    } catch {
      confirmed = false;
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const inbox = process.env.CONTACT_EMAIL;

  if (apiKey && inbox) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: "Portfolio <onboarding@resend.dev>",
        to: [inbox],
        replyTo: email,
        subject: `New portfolio message from ${name}`,
        html: `<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>`,
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to send" };
    }
  }

  if (stored || confirmed) {
    return { ok: true };
  }

  return { ok: true, demo: true };
}