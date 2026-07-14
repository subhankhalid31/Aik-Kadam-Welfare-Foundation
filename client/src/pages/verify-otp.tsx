import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { inputClass } from "@/components/ui/FormField";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MailCheck } from "lucide-react";

export default function VerifyOtpPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { refresh } = useAuth();

  const params = new URLSearchParams(search);
  const email = params.get("email") || "";
  const purpose = (params.get("purpose") || "signup") as "signup" | "login" | "reset_password";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/verify-otp", { email, code, purpose });
      await refresh();
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    try {
      await api.post("/api/auth/resend-otp", { email, purpose });
      setInfo("A new code has been sent.");
      setCooldown(45);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  if (!email) {
    return (
      <PageLayout>
        <main className="max-w-md mx-auto px-6 pt-24 pb-24 text-center">
          <p className="text-muted">Missing email. Please sign up or log in again.</p>
          <a href="/signup" className="mt-4 inline-block text-primary font-medium">Back to Sign Up</a>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="max-w-md mx-auto px-6 pt-16 pb-24 text-center">
        <MailCheck className="mx-auto text-primary" size={40} />
        <h1 className="mt-5 font-display text-3xl text-ink">Check your email</h1>
        <p className="mt-3 text-muted leading-relaxed">
          We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>.
        </p>

        <form onSubmit={handleVerify} className="mt-8 space-y-5 text-left">
          <input
            required
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${inputClass} text-center tracking-[0.5em] text-lg font-mono`}
            placeholder="------"
          />

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          {info && <p className="text-sm text-primary text-center">{info}</p>}

          <button type="submit" disabled={loading || code.length !== 6} className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="mt-5 text-sm text-primary font-medium disabled:text-muted disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </main>
    </PageLayout>
  );
}
