"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email";
import { site } from "@/lib/site";

export type ContactState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell me your name.").max(100),
  email: z.email("Please enter a valid email address.").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Write at least a few words so I can help.")
    .max(5000),
  // Honeypot: real users never fill this hidden field.
  website: z.string().max(500).optional().default(""),
});

export async function sendContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
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
    return { status: "error", message: "Please fix the fields below.", errors };
  }

  // Honeypot filled → silently pretend success (bot gets no feedback).
  if (parsed.data.website) {
    return { status: "ok", message: "Thanks! Your message is on its way." };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return {
      status: "error",
      message: "You have sent a few messages already. Give it a few minutes.",
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
      message: "I could not save your message. Please try again or email me.",
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
    message: "Thanks! Your message is in my inbox. I will reply within a day.",
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
