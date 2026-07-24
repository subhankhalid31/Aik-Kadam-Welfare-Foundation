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

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
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
      const data = await api.post<{ user: { role: string } }>("/api/auth/login", { email, password });
      await refresh();
      navigate(data.user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=signup`);
        return;
      }
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
          Sign In
        </motion.span>
        <motion.h1 variants={fieldVariants} className="mt-3 font-display text-3xl sm:text-4xl text-ink">
          Welcome back.
        </motion.h1>

        <motion.div variants={fieldVariants} className="mt-8">
          <GoogleButton mode="signin" onSuccess={handleGoogleSuccess} onError={fail} />
        </motion.div>

        <motion.div variants={fieldVariants} className="mt-6">
          <OrDivider />
        </motion.div>

        <motion.form onSubmit={handleSubmit} className="mt-6 space-y-5" animate={shakeControls}>
          <motion.div variants={fieldVariants}>
            <FormField label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </FormField>
          </motion.div>
          <motion.div variants={fieldVariants}>
            <FormField label="Password">
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Your password" />
            </FormField>
          </motion.div>
          <motion.a variants={fieldVariants} href="/forgot-password" className="block text-sm text-primary font-medium -mt-3">
            Forgot password?
          </motion.a>

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
            {loading ? "Signing in..." : "Sign In"}
          </motion.button>
        </motion.form>

        <motion.p variants={fieldVariants} className="mt-6 text-center text-sm text-muted">
          Don't have an account? <a href="/signup" className="text-primary font-medium">Create one</a>
        </motion.p>
      </motion.main>
    </PageLayout>
  );
}
