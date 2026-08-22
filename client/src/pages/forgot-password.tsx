import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { BlurFade } from "@/components/ui/BlurFade";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { Mail, KeyRound, Lock } from "lucide-react";

const FORGOT_PASSWORD_STEPS = [
  { title: "Enter your email", description: "We'll look up the account tied to it." },
  { title: "Check your inbox", description: "A one-time reset code lands there within moments." },
  { title: "Set a new password", description: "Then you're straight back in." },
];

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
    <PageLayout transparentHero navTheme="light">
      <AuthSplitLayout
        eyebrow={step === "email" ? "Forgot Password" : "Reset Password"}
        heading={step === "email" ? "Reset your password." : "Check your inbox."}
        subheading={
          step === "email"
            ? "A few steps back to your account."
            : "Almost there — the code is on its way."
        }
        steps={FORGOT_PASSWORD_STEPS}
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-md"
        >
          <div className="absolute -inset-6 rounded-[3rem] bg-black/45 blur-3xl -z-10" />

          {/* Same white backing fix as login.tsx — see the comment there. */}
          <div className="glass-card p-8 sm:p-10 !bg-white/45 lg:!bg-white/0">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                  <BlurFade delay={0.05}>
                    <span className="text-xs font-semibold tracking-wide text-white uppercase">
                      {step === "email" ? "Forgot Password" : "Reset Password"}
                    </span>
                    <h1 className="mt-3 font-serif font-light text-4xl sm:text-5xl tracking-tight text-ink">
                      {step === "email" ? (
                        <><span className="italic text-white">Reset</span> your password.</>
                      ) : (
                        <>Check <span className="italic text-white">your</span> inbox.</>
                      )}
                    </h1>
                    <p className="mt-2 text-sm text-white/80 lg:text-ink/60">
                      {step === "email"
                        ? "Enter your account email and we'll send a reset code."
                        : "Enter the code we sent you and choose a new password."}
                    </p>
                  </BlurFade>

                  {step === "email" ? (
                    <form onSubmit={handleRequestCode} className="mt-8 space-y-5">
                      <BlurFade delay={0.15}>
                        <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
                        <div className="glass-input-wrap w-full">
                          <div className="glass-input">
                            <span className="glass-input-text-area" />
                            <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                              <Mail className="h-5 w-5 text-ink/70 flex-shrink-0" />
                            </div>
                            <input
                              required
                              type="email"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="relative z-10 h-full w-0 flex-grow bg-transparent text-ink placeholder:text-ink/50 focus:outline-none py-2.5 pr-4"
                              placeholder="you@example.com"
                            />
                          </div>
                        </div>
                      </BlurFade>

                      {error && <p className="text-sm text-red-600">{error}</p>}

                      <BlurFade delay={0.25}>
                        <div className="glass-button-wrap w-full">
                          <button type="submit" disabled={loading} className={cn("glass-button relative z-10 w-full rounded-full isolate transition-all", loading && "opacity-70")}>
                            <span className="glass-button-text relative block select-none tracking-tighter w-full py-3.5 text-center font-semibold">
                              {loading ? "Sending..." : "Send Reset Code"}
                            </span>
                          </button>
                          <div className="glass-button-shadow rounded-full pointer-events-none" />
                        </div>
                      </BlurFade>
                    </form>
                  ) : (
                    <form onSubmit={handleReset} className="mt-8 space-y-5">
                      {info && <p className="text-sm text-white">{info}</p>}

                      <BlurFade delay={0.15}>
                        <label className="block text-sm font-medium text-ink mb-1.5">Reset code</label>
                        <div className="glass-input-wrap w-full">
                          <div className="glass-input">
                            <span className="glass-input-text-area" />
                            <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                              <KeyRound className="h-5 w-5 text-ink/70 flex-shrink-0" />
                            </div>
                            <input
                              required
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={code}
                              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                              className="relative z-10 h-full w-0 flex-grow bg-transparent text-ink placeholder:text-ink/50 focus:outline-none py-2.5 pr-4 text-center tracking-[0.5em] font-mono"
                              placeholder="------"
                            />
                          </div>
                        </div>
                      </BlurFade>

                      <BlurFade delay={0.22}>
                        <label className="block text-sm font-medium text-ink mb-1.5">New password</label>
                        <div className="glass-input-wrap w-full">
                          <div className="glass-input">
                            <span className="glass-input-text-area" />
                            <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                              <Lock className="h-5 w-5 text-ink/70 flex-shrink-0" />
                            </div>
                            <input
                              required
                              type="password"
                              minLength={8}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="relative z-10 h-full w-0 flex-grow bg-transparent text-ink placeholder:text-ink/50 focus:outline-none py-2.5 pr-4"
                              placeholder="At least 8 characters"
                            />
                          </div>
                        </div>
                      </BlurFade>

                      {error && <p className="text-sm text-red-600">{error}</p>}

                      <BlurFade delay={0.3}>
                        <div className="glass-button-wrap w-full">
                          <button type="submit" disabled={loading || code.length !== 6} className={cn("glass-button relative z-10 w-full rounded-full isolate transition-all", (loading || code.length !== 6) && "opacity-70")}>
                            <span className="glass-button-text relative block select-none tracking-tighter w-full py-3.5 text-center font-semibold">
                              {loading ? "Resetting..." : "Reset Password"}
                            </span>
                          </button>
                          <div className="glass-button-shadow rounded-full pointer-events-none" />
                        </div>

                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={cooldown > 0}
                          className="mt-3 w-full text-center text-sm text-white font-medium disabled:text-white/50 disabled:cursor-not-allowed transition-colors hover:text-white/80"
                        >
                          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                        </button>
                      </BlurFade>
                    </form>
                  )}

                  <BlurFade delay={0.38}>
                    <p className="mt-6 text-center text-sm text-ink/60">
                      Remembered it?{" "}
                      <a href="/login" className="text-white font-semibold hover:text-white/80 transition-colors">
                        Back to sign in
                      </a>
                    </p>
                  </BlurFade>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </AuthSplitLayout>
    </PageLayout>
  );
}
