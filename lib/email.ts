import nodemailer from "nodemailer";
import { site } from "@/lib/site";

// Transactional email over Gmail SMTP.
//
// Gmail rewrites the From line to whichever account authenticated unless the
// address is a verified alias, so GMAIL_USER is both the login and the sender.
// CONTACT_EMAIL is only where notifications are delivered — it can be any
// address, Gmail or not.
//
// Returns false when the credentials are missing or the send fails; every
// caller treats email as best-effort so a broken mailbox never loses a message
// on the site itself.

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
