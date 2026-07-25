import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { api, ApiError } from "@/lib/api";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
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

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setInfo("If an account exists for that email, a reset code has been sent.");
      setStep("reset");
      setCooldown(45);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { email, code, newPassword });
      navigate("/login");
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
      await api.post("/api/auth/forgot-password", { email });
      setInfo("A new code has been sent.");
      setCooldown(45);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <PageLayout>
      <main className="max-w-md mx-auto px-6 pt-16 pb-24">
        <MailCheck className="text-primary" size={36} />
        <h1 className="mt-4 font-display text-3xl text-ink">Reset your password</h1>

        {step === "email" ? (
          <form onSubmit={handleRequestCode} className="mt-6 space-y-5">
            <p className="text-muted text-sm">Enter your account email and we'll send a reset code.</p>
            <FormField label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </FormField>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-5">
            {info && <p className="text-sm text-primary">{info}</p>}
            <FormField label="Reset code">
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={`${inputClass} text-center tracking-[0.5em] font-mono`}
                placeholder="------"
              />
            </FormField>
            <FormField label="New password">
              <input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="At least 8 characters" />
            </FormField>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading || code.length !== 6} className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="w-full text-center text-sm text-primary font-medium disabled:text-muted disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </form>
        )}
      </main>
    </PageLayout>
  );
}
