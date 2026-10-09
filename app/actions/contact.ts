"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email";
import { site } from "@/lib/site";
import { getCopy } from "@/lib/content";

export type ContactState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

export async function sendContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // The wording of every message the visitor can see comes from the admin
  // Copy screen; the schema is built here so its error text does too.
  const copy = await getCopy();
  const contactSchema = z.object({
    name: z.string().trim().min(2, copy["contact.errName"]).max(100),
    email: z.email(copy["contact.errEmail"]).max(200),
    message: z
      .string()
      .trim()
      .min(10, copy["contact.errMessage"])
      .max(5000),
    // Honeypot: real users never fill this hidden field.
    website: z.string().max(500).optional().default(""),
  });

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      (errors[field] ??= []).push(issue.message);
    }
    return { status: "error", message: copy["contact.errFix"], errors };
  }

  // Honeypot filled → silently pretend success (bot gets no feedback).
  if (parsed.data.website) {
    return { status: "ok", message: copy["contact.sentBot"] };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return {
      status: "error",
      message: copy["contact.errRate"],
    };
  }

  try {
    await prisma.message.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        content: parsed.data.message,
      },
    });
  } catch (err) {
    console.error("Message insert failed:", err);
    return {
      status: "error",
      message: copy["contact.errSave"],
    };
  }

  // Best-effort notification; the message is stored either way.
  const notified = await sendMail({
    to: process.env.CONTACT_EMAIL ?? site.email,
    replyTo: parsed.data.email,
    subject: `New message from ${parsed.data.name}`,
    html: `
      <p><strong>${escapeHtml(parsed.data.name)}</strong> wrote via your portfolio:</p>
      <p>${escapeHtml(parsed.data.message).replace(/\n/g, "<br>")}</p>
      <p>Reply to: ${escapeHtml(parsed.data.email)}</p>
    `,
  });
  if (!notified) {
    console.warn("Contact email not sent (Brevo key missing or invalid).");
  }

  return {
    status: "ok",
    message: copy["contact.sentOk"],
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
