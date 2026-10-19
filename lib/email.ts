import nodemailer from "nodemailer";
import { site } from "@/lib/site";

// Transactional email over Gmail SMTP.
//
// Gmail rewrites the From line to whichever account authenticated unless the
// address is a verified alias, so GMAIL_USER is both the login and the sender.
// CONTACT_EMAIL is only where notifications are delivered — it can be any
// address, Gmail or not.
//
// Every message goes out as multipart/alternative: the HTML plus a plain-text
// twin derived from it. HTML-only mail is a spam signal, and a text part is
// also what a plain-text client and a screen reader fall back to.
//
// Returns false when the credentials are missing or the send fails; every
// caller treats email as best-effort so a broken mailbox never loses a message
// on the site itself.

/**
 * Turns the HTML body into readable plain text. Exported so the wording of a
 * message can be checked without sending it.
 */
export function htmlToText(html: string): string {
  return (
    html
      // The templates are indented and wrapped for a human reading the source.
      // That whitespace is not a line break in the delivered text — only <br>
      // and block tags are — so fold it into single spaces before the tag
      // handling below starts introducing real newlines.
      .replace(/\s*\n\s*/g, " ")
      // Do this before the generic tag strip: an anchor whose label is not the
      // URL would otherwise lose the URL, and for a mail whose whole point is
      // that link, it is the one thing worth keeping. mailto: is skipped — the
      // label is already the address.
      .replace(
        /<a\b[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
        (_, href: string, label: string) => {
          const text = label.replace(/<[^>]+>/g, "").trim();
          return text === href ? text : `${text} (${href})`;
        },
      )
      .replace(/<li\b[^>]*>/gi, "\n- ")
      .replace(/<br\s*\/?>/gi, "\n")
      // Block tags end the line; their opening tag leaves no trace.
      .replace(/<\/(p|div|section|tr|h[1-6]|blockquote)>/gi, "\n\n")
      .replace(/<(p|div|section|tr|h[1-6]|blockquote)\b[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
      // &amp; decodes last, or "&amp;lt;" would turn into "<".
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#(?:39|x27);/gi, "'")
      .replace(/&amp;/gi, "&")
      // Line by line, so any indentation the tag replacements did not eat is
      // tidied away and blank runs become single blank lines.
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return false;

  // 465 is TLS from the first byte; 587 opens in plaintext and upgrades via
  // STARTTLS. `secure` has to agree with the port, so derive it rather than
  // let the two drift apart. Vercel blocks port 25 and leaves both open.
  const port = Number(process.env.GMAIL_SMTP_PORT ?? 465);

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
    // A socket that hangs costs a billed invocation and leaves the contact
    // form spinning. Gmail answers well inside these.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    await transport.sendMail({
      from: { name: site.name, address: user },
      to: opts.to,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      subject: opts.subject,
      text: htmlToText(opts.html),
      html: opts.html,
    });
    return true;
  } catch (err) {
    // The code is the whole diagnosis: EAUTH is a wrong App Password (or
    // 2-Step Verification off), EENVELOPE is Gmail refusing the recipient,
    // ETIMEDOUT is the port being blocked on this host.
    const code = (err as { code?: string } | null)?.code;
    console.warn(`Gmail SMTP send failed${code ? ` (${code})` : ""}:`, err);
    return false;
  }
}
