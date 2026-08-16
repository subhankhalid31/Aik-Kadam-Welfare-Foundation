import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Aik Kadam <onboarding@resend.dev>";

// Set once inbound receiving is turned on in the Resend dashboard (see
// .env.example). Until then, inbox replies still send fine, they just
// won't thread automatically if the recipient replies from their own
// email client.
const INBOUND_DOMAIN = process.env.RESEND_INBOUND_DOMAIN;

function escapeHtml(v: string): string {
  return String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// A unique reply-to address per conversation (msg-<id>@<inbound domain>).
// When the recipient hits "reply" in their own email client, it lands here
// instead of their personal inbox, Resend's inbound webhook fires, and the
// id in the address tells us which inbox_messages row to append it to.
export function inboundReplyAddressFor(inboxMessageId: string): string | undefined {
  if (!INBOUND_DOMAIN) return undefined;
  return `msg-${inboxMessageId}@${INBOUND_DOMAIN}`;
}

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

type ThreadEntry = { authorLabel: string; date: Date; body: string };

// Builds a Gmail-style thread: the new message on top, then each prior
// message quoted underneath (most recent first), indented with a left
// border like a normal email client quote block — not our own invention,
// just matching what everyone already expects from "reply".
function buildThreadHtml(newBody: string, prior: ThreadEntry[]): string {
  const newBodyHtml = escapeHtml(newBody).replace(/\n/g, "<br/>");
  const quoted = prior
    .slice()
    .reverse()
    .map(
      (m) => `
      <div style="margin-top: 16px; padding-left: 12px; border-left: 2px solid #E2E4E9; color: #6B7280; font-size: 13px;">
        <p style="margin: 0 0 6px;">On ${m.date.toLocaleString()}, ${escapeHtml(m.authorLabel)} wrote:</p>
        <div style="white-space: pre-wrap;">${escapeHtml(m.body).replace(/\n/g, "<br/>")}</div>
      </div>`,
    )
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0F4C3A;">Aik Kadam</h2>
      <div style="color: #1C2521; line-height: 1.6; white-space: pre-wrap;">${newBodyHtml}</div>
      ${quoted}
    </div>
  `;
}

type SendResult = { ok: true; emailId?: string } | { ok: false; error: string };

// Sent when an admin replies to a contact form, partnership inquiry, or any
// other inbox conversation. `to` must always be the conversation's known
// sender — never a client-supplied recipient. `prior` is the full thread so
// far (original message + any earlier replies), used to build the Gmail-
// style quoted history under the new reply.
export async function sendReplyEmail(
  to: string,
  name: string,
  subject: string,
  replyText: string,
  prior: ThreadEntry[],
  inboxMessageId: string,
): Promise<SendResult> {
  const html = buildThreadHtml(replyText, prior);
  const replyTo = inboundReplyAddressFor(inboxMessageId);

  if (!resend) {
    console.log(`\n[DEV EMAIL] To: ${to} | Subject: Re: ${subject} | Reply: ${replyText}${replyTo ? ` | Reply-To: ${replyTo}` : ""}\n`);
    return { ok: true };
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    if (result.error) {
      console.error(`[EMAIL] Resend rejected reply email to ${to}:`, result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, emailId: result.data?.id };
  } catch (err) {
    console.error(`[EMAIL] Failed to send reply email to ${to} via Resend:`, err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send" };
  }
}

// A brand-new conversation the admin starts (not a reply to an inbound
// message) — same inbound-threading setup so if they reply, it comes back
// to the right place.
export async function sendComposeEmail(to: string, name: string, subject: string, body: string, inboxMessageId: string): Promise<SendResult> {
  const html = buildThreadHtml(body, []);
  const replyTo = inboundReplyAddressFor(inboxMessageId);

  if (!resend) {
    console.log(`\n[DEV EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}${replyTo ? ` | Reply-To: ${replyTo}` : ""}\n`);
    return { ok: true };
  }

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html, ...(replyTo ? { replyTo } : {}) });
    if (result.error) {
      console.error(`[EMAIL] Resend rejected composed email to ${to}:`, result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, emailId: result.data?.id };
  } catch (err) {
    console.error(`[EMAIL] Failed to send composed email to ${to} via Resend:`, err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send" };
  }
}

// ─── Inbound (two-way threading) ──────────────────────────────────────────
// Requires: Inbound turned on in the Resend dashboard, a webhook pointed at
// POST /api/webhooks/resend-inbound, RESEND_WEBHOOK_SECRET set to that
// webhook's signing secret, and RESEND_INBOUND_DOMAIN set to whichever
// address visitors' replies should land on (Resend's free auto-provisioned
// <id>.resend.app subdomain works fine here — no DNS/domain purchase
// needed for this part specifically).

export function verifyInboundWebhook(payload: string, headers: { id: string; timestamp: string; signature: string }) {
  if (!resend) throw new Error("RESEND_API_KEY not configured");
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) throw new Error("RESEND_WEBHOOK_SECRET not configured");
  return resend.webhooks.verify({ payload, headers, webhookSecret: secret });
}

export async function getReceivedEmail(emailId: string) {
  if (!resend) throw new Error("RESEND_API_KEY not configured");
  const { data, error } = await resend.emails.receiving.get(emailId);
  if (error) throw new Error(error.message);
  return data;
}
