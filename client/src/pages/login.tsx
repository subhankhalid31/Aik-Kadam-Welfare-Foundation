import { useState } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
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
    <PageLayout>
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
            floating controls. */}
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-6 rounded-[3rem] bg-primary/25 blur-3xl -z-10" />

          <div className="glass-card p-8 sm:p-10">
            <div className="relative">
              <span className="text-xs font-semibold tracking-wide text-primary uppercase">Sign In</span>
              <h1 className="mt-3 font-serif font-light text-4xl text-ink">
                <span className="italic" style={{ color: "#7CB342" }}>Welcome</span> back.
              </h1>
              <p className="mt-2 text-sm text-ink/60">One step closer to where it's needed.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
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
                </div>

                <div>
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
                </div>

                <a href="/forgot-password" className="block text-sm text-primary font-medium -mt-2 hover:text-primary-dark transition-colors">
                  Forgot password?
                </a>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="glass-button-wrap w-full">
                  <button type="submit" disabled={loading} className={cn("glass-button relative z-10 w-full rounded-full isolate transition-all", loading && "opacity-70")}>
                    <span className="glass-button-text relative block select-none tracking-tighter w-full py-3.5 text-center font-semibold">{loading ? "Signing in..." : "Sign In"}</span>
                  </button>
                  <div className="glass-button-shadow rounded-full pointer-events-none" />
                </div>
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
      </AuthSplitLayout>
    </PageLayout>
  );
}
