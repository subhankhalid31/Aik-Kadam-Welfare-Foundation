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

  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendNotificationEmail(to: string, subject: string, message: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0F4C3A;">Aik Kadam</h2>
      <p style="color: #1C2521; line-height: 1.6;">${message}</p>
    </div>
  `;

  if (!resend) {
    console.log(`\n[DEV EMAIL] To: ${to} | Subject: ${subject} | Message: ${message}\n`);
    return;
  }

  await resend.emails.send({ from: FROM, to, subject, html });
}
