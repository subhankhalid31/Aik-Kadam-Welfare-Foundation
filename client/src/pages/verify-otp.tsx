import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { inputClass } from "@/components/ui/FormField";
import { GlassButton } from "@/components/ui/GlassButton";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MailCheck, Check } from "lucide-react";

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
  const [verified, setVerified] = useState(false);
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
      setVerified(true);
      setTimeout(() => navigate("/"), 1100);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
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
        <AnimatePresence mode="wait">
          {verified ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500"
              >
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.35, ease: "easeOut" }}
                >
                  <Check size={32} strokeWidth={3} className="text-white" />
                </motion.div>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-5 font-display text-3xl text-ink"
              >
                Verified
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-muted"
              >
                Taking you in...
              </motion.p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                  autoFocus
                />

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                {info && <p className="text-sm text-primary text-center">{info}</p>}

                <GlassButton type="submit" disabled={loading || code.length !== 6}>
                  {loading ? "Verifying..." : "Verify"}
                </GlassButton>
              </form>

              <button
                onClick={handleResend}
                disabled={cooldown > 0}
                className="mt-5 text-sm text-primary font-medium disabled:text-muted disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageLayout>
  );
}
