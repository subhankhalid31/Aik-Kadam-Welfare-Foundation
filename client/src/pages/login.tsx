import { useState } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { BlurFade } from "@/components/ui/BlurFade";
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const LOGIN_STEPS = [
  { title: "Sign in securely", description: "One account for donating, volunteering, and tracking cases." },
  { title: "Pick up where you left off", description: "Your dashboard, hours, and history are right where you left them." },
  { title: "Keep the momentum going", description: "Every login is one more step toward someone who needs it." },
];

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout transparentHero navTheme="light">
      <AuthSplitLayout
        eyebrow="Sign In"
        heading="Welcome back to Aik Kadam."
        subheading="Every login is one step closer to where it's needed."
        steps={LOGIN_STEPS}
      >
        {/* Unlike signup — whose pill inputs float directly on the
            background with no container — login sits inside a bordered
            .glass-card (defined in index.css) so the panel itself is
            clearly recognizable as a distinct surface, not just loose
            floating controls. The whole card fades/slides in on mount,
            same as signup's step transitions, and the glow behind it is a
            plain black shadow (not the brand green) so it reads as a
            drop shadow, not a colored halo bleeding out of the card. */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-md"
        >
          <div className="absolute -inset-6 rounded-[3rem] bg-black/45 blur-3xl -z-10" />

          {/* .glass-card is fully see-through by default (fine on the old
              plain-color background), so on mobile — sitting directly on a
              busy photo — it read as tinted by whatever color was behind
              it (green, from the photo). !bg-white/45 gives it an actual
              white backing there; lg:!bg-white/0 keeps the original pure
              glass look on desktop, where it only ever sits on the plain
              ivory page background anyway. */}
          <div className="glass-card p-8 sm:p-10 !bg-white/20 lg:!bg-white/0 !border-none">
            <div className="relative">
              <BlurFade delay={0.05}>
                <span className="text-xs font-semibold tracking-wide text-white uppercase">Sign In</span>
                <h1 className="mt-3 font-serif font-light text-4xl sm:text-5xl tracking-tight text-white lg:text-ink">
                  {/* Whole heading is white on mobile for contrast against
                      the photo; back to ink + the brand-green italic
                      accent on desktop where it sits on the plain
                      background. */}
                  <span className="lg:italic lg:text-white">Welcome</span> back.
                </h1>
                <p className="mt-2 text-sm text-white/80 lg:text-ink/60">One step closer to where it's needed.</p>
              </BlurFade>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

                <BlurFade delay={0.25}>
                  <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
                  <div className="glass-input-wrap w-full">
                    <div className="glass-input">
                      <span className="glass-input-text-area" />
                      <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                        <Lock className="h-5 w-5 text-ink/70 flex-shrink-0" />
                      </div>
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="relative z-10 h-full w-0 flex-grow bg-transparent text-ink placeholder:text-ink/50 focus:outline-none py-2.5"
                        placeholder="Your password"
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pr-2 text-ink/70 hover:text-ink transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </BlurFade>

                <BlurFade delay={0.32}>
                  <a href="/forgot-password" className="block text-sm text-white font-medium -mt-2 hover:text-black transition-colors">
                    Forgot password?
                  </a>
                </BlurFade>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <BlurFade delay={0.4}>
                  <div className="glass-button-wrap w-full">
                    <button type="submit" disabled={loading} className={cn("glass-button relative z-10 w-full rounded-full isolate transition-all", loading && "opacity-70")}>
                      <span className="glass-button-text relative block select-none tracking-tighter w-full py-3.5 text-center font-semibold">{loading ? "Signing in..." : "Sign In"}</span>
                    </button>
                    <div className="glass-button-shadow rounded-full pointer-events-none" />
                  </div>
                </BlurFade>
              </form>

              <BlurFade delay={0.48}>
                <GoogleSignInButton
                  onSuccess={async (role) => {
                    await refresh();
                    navigate(role === "admin" ? "/admin" : "/");
                  }}
                  onError={setError}
                />
              </BlurFade>

              <BlurFade delay={0.55}>
                <p className="mt-6 text-center text-sm text-ink/60">
                  Don't have an account?{" "}
                  <a href="/signup" className="text-white font-medium hover:text-black transition-colors">
                    Create one
                  </a>
                </p>
              </BlurFade>
            </div>
          </div>
        </motion.div>
      </AuthSplitLayout>
    </PageLayout>
  );
}
