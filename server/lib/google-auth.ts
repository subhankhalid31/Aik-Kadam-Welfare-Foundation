import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

/**
 * Verifies a Google Identity Services credential (JWT) sent from the
 * frontend "Continue with Google" button. Returns the verified profile,
 * or null if the token is missing/invalid/expired.
 *
 * This is intentionally a server-side verification (not just decoding the
 * JWT) — it checks the signature against Google's public keys and confirms
 * the token was issued for our client ID.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
  if (!GOOGLE_CLIENT_ID) {
    console.error("GOOGLE_CLIENT_ID is not set — cannot verify Google sign-in.");
    return null;
  }
  if (!idToken) return null;

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) return null;

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      emailVerified: payload.email_verified ?? false,
    };
  } catch {
    return null;
  }
}

export const isGoogleSignInConfigured = Boolean(GOOGLE_CLIENT_ID);
