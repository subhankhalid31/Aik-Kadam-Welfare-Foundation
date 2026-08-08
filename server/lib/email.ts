import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Aik Kadam <onboarding@resend.dev>";

export async function sendOtpEmail(to: string, code: string, purpose: "signup" | "login" | "reset_password") {
  const subject =
    purpose === "signup"
      ? "Verify your Aik Kadam account"
      : purpose === "login"
        ? "Your Aik Kadam login code"
        : "Reset your Aik Kadam password";

  const html = `
    <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0F4C3A;">Aik Kadam</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0F4C3A;">${code}</p>
      <p style="color: #6B7280; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  if (!resend) {
    // Dev fallback — no RESEND_API_KEY configured yet. Log instead of failing,
    // so signup/login can be tested locally before email is wired up.
    console.log(`\n[DEV EMAIL] To: ${to} | Subject: ${subject} | OTP: ${code}\n`);
    return;
  }

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    if (result.error) {
      // Resend's SDK often resolves successfully with an `error` field rather
      // than throwing — e.g. sending domain not verified, invalid API key,
      // recipient blocked. Surface it clearly instead of silently "succeeding".
      console.error(`[EMAIL] Resend rejected OTP email to ${to}:`, result.error);
    }
  } catch (err) {
    console.error(`[EMAIL] Failed to send OTP email to ${to} via Resend:`, err);
  }
}

export async function sendNotificationEmail(to: string, subject: string, message: string, replyTo?: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0F4C3A;">Aik Kadam</h2>
      <p style="color: #1C2521; line-height: 1.6;">${message}</p>
    </div>
  `;

  if (!resend) {
    console.log(`\n[DEV EMAIL] To: ${to} | Subject: ${subject} | Message: ${message}${replyTo ? ` | Reply-To: ${replyTo}` : ""}\n`);
    return;
  }

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html, ...(replyTo ? { replyTo } : {}) });
    if (result.error) {
      console.error(`[EMAIL] Resend rejected notification email to ${to}:`, result.error);
    }
  } catch (err) {
    console.error(`[EMAIL] Failed to send notification email to ${to} via Resend:`, err);
  }
}

// Sent when an admin replies to a contact form or partnership inquiry from
// the admin inbox. Quotes the person's original message underneath so they
// have context, since this may land days after they wrote it. `to` is
// always the original sender — never trust a client-supplied recipient.
export async function sendReplyEmail(to: string, name: string, originalMessage: string, replyText: string, kind: "contact" | "partnership") {
  const subject = kind === "partnership" ? "Re: Your partnership inquiry — Aik Kadam" : "Re: Your message to Aik Kadam";
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0F4C3A;">Aik Kadam</h2>
      <p style="color: #1C2521; line-height: 1.6;">Hi ${name},</p>
      <p style="color: #1C2521; line-height: 1.6; white-space: pre-wrap;">${replyText}</p>
      <div style="margin-top: 24px; padding: 16px; border-left: 3px solid #E2E4E9; color: #6B7280; font-size: 13px; white-space: pre-wrap;">
        <strong>Your original message:</strong><br/>${originalMessage}
      </div>
    </div>
  `;

  if (!resend) {
    console.log(`\n[DEV EMAIL] To: ${to} | Subject: ${subject} | Reply: ${replyText}\n`);
    return { ok: true as const };
  }

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    if (result.error) {
      console.error(`[EMAIL] Resend rejected reply email to ${to}:`, result.error);
      return { ok: false as const, error: result.error.message };
    }
    return { ok: true as const };
  } catch (err) {
    console.error(`[EMAIL] Failed to send reply email to ${to} via Resend:`, err);
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed to send" };
  }
}
