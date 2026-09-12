"use server";

import { z } from "zod";
import { site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMergedMessages } from "@/lib/messages";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  const confirmBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#8b5cf6,#ec4899);padding:32px 40px;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Thank You, ${safeName}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#333;">${t.confirmBody}</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#333;">I'll review your message and get back to you within 24 hours. If your matter is urgent, feel free to reach out directly at <a href="mailto:${site.email}" style="color:#8b5cf6;text-decoration:none;">${site.email}</a>.</p>
          <table cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #e5e5e5;padding-top:24px;">
            <tr><td>
              <p style="margin:0;font-size:14px;color:#666;line-height:1.6;">Best regards,</p>
              <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#111;">Md. Tariqul Islam</p>
              <p style="margin:4px 0 0;font-size:13px;color:#888;">Full-Stack Web Developer</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color:#f9f9fa;padding:20px 40px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;text-align:center;">This is an automated confirmation — please do not reply directly to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const confirmed = await sendBrevoEmail(email, name, t.confirmSubject, confirmBody);

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
        subject: `New portfolio message from ${safeName}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#8b5cf6,#ec4899);padding:24px 40px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">New Contact Message</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="padding:12px 16px;background-color:#f9f9fa;border-radius:8px;">
              <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">From</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#111;">${safeName}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#666;">${safeEmail}</p>
            </td></tr>
          </table>
          <div style="padding:16px;background-color:#f9f9fa;border-radius:8px;">
            <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Message</p>
            <p style="margin:8px 0 0;font-size:15px;line-height:1.7;color:#333;white-space:pre-wrap;">${safeMessage}</p>
          </div>
          <a href="mailto:${safeEmail}?subject=Re: New portfolio message" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#8b5cf6;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Reply</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
