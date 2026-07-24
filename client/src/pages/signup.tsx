import { useState } from "react";
import { useLocation } from "wouter";
import { motion, useAnimation, type Variants } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { GoogleButton, OrDivider } from "@/components/ui/GoogleButton";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const shakeControls = useAnimation();

  function fail(message: string) {
    setError(message);
    shakeControls.start({
      x: [0, -8, 8, -6, 6, -3, 3, 0],
      transition: { duration: 0.4, ease: "easeInOut" },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/signup", { name, email, password });
      navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=signup`);
    } catch (err) {
      fail(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(role: string) {
    await refresh();
    navigate(role === "admin" ? "/admin" : "/");
  }

  return (
    <PageLayout>
      <motion.main
        className="max-w-md mx-auto px-6 pt-16 pb-24"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.span variants={fieldVariants} className="text-xs font-semibold tracking-wide text-primary uppercase">
          Create Account
        </motion.span>
        <motion.h1 variants={fieldVariants} className="mt-3 font-display text-3xl sm:text-4xl text-ink">
          Join Aik Kadam.
        </motion.h1>
        <motion.p variants={fieldVariants} className="mt-3 text-muted leading-relaxed">
          Create an account to donate, volunteer, or submit a case.
        </motion.p>

        <motion.div variants={fieldVariants} className="mt-8">
          <GoogleButton mode="signup" onSuccess={handleGoogleSuccess} onError={fail} />
        </motion.div>

        <motion.div variants={fieldVariants} className="mt-6">
          <OrDivider />
        </motion.div>

        <motion.form onSubmit={handleSubmit} className="mt-6 space-y-5" animate={shakeControls}>
          <motion.div variants={fieldVariants}>
            <FormField label="Full name">
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your full name" />
            </FormField>
          </motion.div>
          <motion.div variants={fieldVariants}>
            <FormField label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </FormField>
          </motion.div>
          <motion.div variants={fieldVariants}>
            <FormField label="Password">
              <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="At least 8 characters" />
            </FormField>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            variants={fieldVariants}
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </motion.button>
        </motion.form>

        <motion.p variants={fieldVariants} className="mt-6 text-center text-sm text-muted">
          Already have an account? <a href="/login" className="text-primary font-medium">Sign in</a>
        </motion.p>
      </motion.main>
    </PageLayout>
  );
}
