import crypto from "crypto";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export function generateOtpCode(): string {
  // 6-digit numeric code, e.g. "042917"
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtpCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
}

export function isOtpExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}

export { MAX_ATTEMPTS };
