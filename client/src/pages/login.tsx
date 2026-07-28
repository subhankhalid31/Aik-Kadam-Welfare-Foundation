import { useState } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { CanvasRevealEffect } from "@/components/ui/CanvasRevealEffect";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  // iOS-style glass input: barely-there fill, blurred, a hairline border
  // that brightens on focus rather than the usual solid-white/ring pattern.
  const glassInput =
    "mt-1.5 w-full rounded-2xl border border-white/40 bg-white/25 backdrop-blur-md px-4 py-2.5 text-sm text-ink placeholder:text-muted/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] focus:outline-none focus:border-white/80 focus:bg-white/35 transition-all";

  return (
    <PageLayout>
      <main className="relative overflow-hidden bg-background min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
        {/* Animated dot-matrix background: brand blue mixed with a touch of accent yellow.
            Kept vivid and un-faded here on purpose — a glass panel needs something
            colorful behind it to actually read as "glass" rather than just frosted white. */}
        <div className="absolute inset-0">
          <CanvasRevealEffect
            animationSpeed={2.4}
            containerClassName="bg-background"
            colors={[
              [48, 135, 248],
              [25, 110, 230],
              [2, 96, 216],
            ]}
            dotSize={5}
            totalSize={11}
            opacities={[0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.85, 0.9, 0.95, 1]}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(246,247,245,0.02)_0%,_rgba(246,247,245,0.3)_85%)]" />

        {/* The glass card itself. Layering, from back to front:
              1. A soft blue glow behind the card so it looks lit from within
              2. The card: heavy backdrop-blur + very low-opacity white fill,
                 so the animated dots behind it are genuinely visible through it
              3. A hairline border, bright along the top/left edge and dimmer
                 bottom/right — mimics how real glass catches light unevenly
              4. A large soft specular highlight in the top-left corner
              5. Content sits in its own stacking layer on top of all of it   */}
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-6 rounded-[3rem] bg-primary/20 blur-3xl -z-10" />

          <div className="relative rounded-[2rem] p-8 sm:p-10 overflow-hidden backdrop-blur-2xl backdrop-saturate-150 bg-white/20 border border-white/50 shadow-[0_8px_32px_rgba(31,63,124,0.25),inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_1px_rgba(255,255,255,0.1)]">
            {/* Specular highlight — a soft bloom of light in the corner, like a curved glass edge catching a light source */}
            <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-white/60 blur-3xl opacity-70" />
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/30 via-transparent to-transparent" />

            <div className="relative">
              <span className="text-xs font-semibold tracking-wide text-primary uppercase">Sign In</span>
              <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink">Welcome back.</h1>
              <p className="mt-2 text-sm text-ink/60">One step closer to where it's needed.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink">Email</label>
                  <input
                    required
                    type="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={glassInput}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">Password</label>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={glassInput}
                    placeholder="Your password"
                  />
                </div>
                <a href="/forgot-password" className="block text-sm text-primary font-medium -mt-2 hover:text-primary-dark transition-colors">
                  Forgot password?
                </a>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-primary px-7 py-3.5 font-semibold text-white shadow-[0_4px_16px_rgba(48,135,248,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <GoogleSignInButton
                onSuccess={async (role) => {
                  await refresh();
                  navigate(role === "admin" ? "/admin" : "/");
                }}
                onError={setError}
              />

              <p className="mt-6 text-center text-sm text-ink/60">
                Don't have an account?{" "}
                <a href="/signup" className="text-primary font-medium hover:text-primary-dark transition-colors">
                  Create one
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
