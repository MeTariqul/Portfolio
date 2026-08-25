"use server";

import { z } from "zod";
import { site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMergedMessages } from "@/lib/messages";
import {
  generateConfirmEmail,
  generateAutoReply,
} from "@/lib/ai";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export type ContactResult =
  | { ok: true; demo?: boolean }
  | { ok: false; error: string };

async function sendBrevoEmail(
  to: string,
  toName: string,
  subject: string,
  html: string,
  replyTo?: { email: string; name: string }
): Promise<boolean> {
  const brevoKey = process.env.BREVO_API_KEY;
  const sender = process.env.CONTACT_EMAIL;
  if (!brevoKey || !sender) return false;

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
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
        ...(replyTo ? { replyTo } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function isAutoReplyEnabled(): Promise<boolean> {
  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) return true;

  const { data } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", "auto_reply")
    .maybeSingle();

  return (data?.value?.enabled as boolean) ?? true;
}

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

  const { contact: t } = await getMergedMessages();

  const [confirmAiResponse, autoReplyText] = await Promise.all([
    generateConfirmEmail(name, message),
    isAutoReplyEnabled().then((enabled) =>
      enabled ? generateAutoReply(name, message) : ""
    ),
  ]);

  let confirmed = false;
  const greeting = t.confirmGreeting.replace(/\{name\}/g, name);
  const confirmBody = confirmAiResponse
    ? `<p>${greeting}</p>
<p style="line-height:1.7;color:#333;">${confirmAiResponse.replace(/\n/g, "<br/>")}</p>
<p style="margin-top:20px;color:#666;">${t.confirmSignature}</p>`
    : `<p>${greeting}</p>
<p>${t.confirmBody}</p>
<p>${t.confirmSignature}</p>`;

  confirmed = await sendBrevoEmail(email, name, t.confirmSubject, confirmBody);

  if (autoReplyText) {
    const autoReplyHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <p style="color: #333; line-height: 1.7;">Hi ${name},</p>
        <div style="color: #333; line-height: 1.7; white-space: pre-wrap;">${autoReplyText.replace(/\n/g, "<br/>")}</div>
        <p style="margin-top: 24px; color: #333; line-height: 1.7;">Best regards,<br/><strong>Samba</strong><br/>Manager, Md. Tariqul Islam</p>
        <p style="margin-top: 16px; color: #999; font-size: 12px;">Full-Stack Web Developer — Next.js / React / TypeScript / Python / AI</p>
      </div>
    `;
    await sendBrevoEmail(
      email,
      name,
      "Re: Thanks for reaching out — Md. Tariqul Islam",
      autoReplyHtml,
      { email: process.env.CONTACT_EMAIL || "", name: "Md. Tariqul Islam" }
    );
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
