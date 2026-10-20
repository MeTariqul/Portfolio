import { sendMail } from "@/lib/email";
import { site } from "@/lib/site";

// The email that carries an activation key. Kept apart from lib/email.ts
// (which is the Gmail SMTP wrapper) so the wording lives with the licensing
// feature, and so tests can call the HTML builder on its own.

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function activationEmailHtml(opts: {
  appName: string;
  key: string;
}): string {
  const app = escapeHtml(opts.appName);
  const key = escapeHtml(opts.key);
  return `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.6;color:#111">
      <p>Your activation key for <strong>${app}</strong>:</p>
      <p style="font-family:ui-monospace,Consolas,monospace;font-size:20px;letter-spacing:1px;
                padding:14px 18px;border:1px solid #ddd;border-radius:10px;background:#fafafa;
                display:inline-block;margin:8px 0">${key}</p>
      <p>Open ${app}, choose <strong>Activate</strong>, and paste the key there.</p>
      <p><strong>This key works on one device only.</strong> Activating it on a second
      machine will be refused — write to <a href="mailto:${site.email}">${site.email}</a>
      if you change computers and need the old device removed.</p>
      <p style="color:#555;font-size:13px">Keep this key private. If you did not request
      it, you can ignore this email.</p>
    </div>
  `;
}

// Best-effort, like every other send in this project: the caller decides
// what to tell the user when the provider refuses.
export async function sendActivationKey(opts: {
  to: string;
  appName: string;
  key: string;
}): Promise<boolean> {
  return sendMail({
    to: opts.to,
    replyTo: site.email,
    // The customer installed a program, not a portfolio. Introducing the mail
    // as the software itself is what makes it recognisable in a busy inbox.
    fromName: opts.appName,
    subject: `Your ${opts.appName} activation key`,
    html: activationEmailHtml({ appName: opts.appName, key: opts.key }),
  });
}
