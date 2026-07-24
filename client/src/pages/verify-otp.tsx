import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { OtpInput } from "@/components/ui/OtpInput";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MailCheck, Check } from "lucide-react";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

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
  const [shakeKey, setShakeKey] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  async function verifyCode(fullCode: string) {
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/verify-otp", { email, code: fullCode, purpose });
      setVerified(true);
      await refresh();
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setCode("");
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6 || loading || verified) return;
    verifyCode(code);
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
      <motion.main
        className="max-w-md mx-auto px-6 pt-16 pb-24 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fieldVariants} className="relative mx-auto flex h-14 w-14 items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {verified ? (
              <motion.div
                key="success"
                initial={{ scale: 0, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15"
              >
                <Check className="text-success" size={28} strokeWidth={3} />
              </motion.div>
            ) : (
              <motion.div
                key="mail"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MailCheck className="text-primary" size={40} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.h1 variants={fieldVariants} className="mt-5 font-display text-3xl text-ink">
          {verified ? "Verified!" : "Check your email"}
        </motion.h1>
        <motion.p variants={fieldVariants} className="mt-3 text-muted leading-relaxed">
          {verified ? (
            "Taking you in..."
          ) : (
            <>We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>.</>
          )}
        </motion.p>

        {!verified && (
          <motion.form onSubmit={handleVerify} className="mt-8 space-y-5" variants={fieldVariants}>
            <OtpInput value={code} onChange={setCode} onComplete={verifyCode} shakeKey={shakeKey} disabled={loading} />

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-sm text-red-600 text-center"
                >
                  {error}
                </motion.p>
              )}
              {info && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-sm text-primary text-center"
                >
                  {info}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || code.length !== 6}
              whileHover={{ scale: loading || code.length !== 6 ? 1 : 1.015 }}
              whileTap={{ scale: loading || code.length !== 6 ? 1 : 0.98 }}
              className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify"}
            </motion.button>
          </motion.form>
        )}

        {!verified && (
          <motion.button
            variants={fieldVariants}
            onClick={handleResend}
            disabled={cooldown > 0}
            className="mt-5 text-sm text-primary font-medium disabled:text-muted disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </motion.button>
        )}
      </motion.main>
    </PageLayout>
  );
}
