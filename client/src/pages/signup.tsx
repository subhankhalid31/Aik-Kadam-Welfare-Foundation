import { useState } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { CanvasRevealEffect } from "@/components/ui/CanvasRevealEffect";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/signup", { name, email, password });
      navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=signup`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <main className="relative overflow-hidden bg-background min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
        {/* Animated dot-matrix background: brand blue mixed with a touch of accent yellow */}
        <div className="absolute inset-0">
          <CanvasRevealEffect
            animationSpeed={2.4}
            containerClassName="bg-background"
            colors={[
              [48, 135, 248],
              [255, 214, 98],
            ]}
            dotSize={5}
            opacities={[0.12, 0.14, 0.16, 0.2, 0.22, 0.26, 0.3, 0.34, 0.4, 0.48]}
          />
        </div>
        {/* Fades the dots out toward the edges so the card and text stay crisp and readable */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(246,247,245,0.25)_0%,_rgba(246,247,245,0.94)_78%)]" />

        <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-white/80 backdrop-blur-md p-8 sm:p-10 shadow-xl">
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">Create Account</span>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink">Join Aik Kadam.</h1>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Create an account to donate, volunteer, or submit a case.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink">Full name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Password</label>
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <GoogleSignInButton
            onSuccess={async (role) => {
              await refresh();
              navigate(role === "admin" ? "/admin" : "/");
            }}
            onError={setError}
          />

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <a href="/login" className="text-primary font-medium hover:text-primary-dark transition-colors">
              Sign in
            </a>
          </p>
        </div>
      </main>
    </PageLayout>
  );
}
