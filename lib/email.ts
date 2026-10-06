import { site } from "@/lib/site";

// Transactional email via the Brevo API (plain fetch, no SDK needed).
// Returns false when the key is missing or the call fails; callers treat
// email as best-effort so a broken key never loses a message.
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.CONTACT_EMAIL ?? site.email;
  if (!apiKey) return false;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { email: from, name: site.name },
        to: [{ email: opts.to }],
        ...(opts.replyTo ? { replyTo: { email: opts.replyTo } } : {}),
        subject: opts.subject,
        htmlContent: opts.html,
      }),
    });
    if (!res.ok) {
      console.warn(`Brevo send failed: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Brevo send error:", err);
    return false;
  }
}
