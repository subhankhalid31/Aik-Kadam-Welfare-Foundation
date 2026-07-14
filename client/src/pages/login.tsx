import { useState } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
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

  return (
    <PageLayout>
      <main className="max-w-md mx-auto px-6 pt-16 pb-24">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Sign In</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink">Welcome back.</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <FormField label="Email">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
          </FormField>
          <FormField label="Password">
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Your password" />
          </FormField>
          <a href="/forgot-password" className="block text-sm text-primary font-medium -mt-3">Forgot password?</a>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don't have an account? <a href="/signup" className="text-primary font-medium">Create one</a>
        </p>
      </main>
    </PageLayout>
  );
}
