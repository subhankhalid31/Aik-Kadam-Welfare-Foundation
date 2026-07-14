import { useState } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { api, ApiError } from "@/lib/api";

export default function SignupPage() {
  const [, navigate] = useLocation();
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
      <main className="max-w-md mx-auto px-6 pt-16 pb-24">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Create Account</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink">Join Aik Kadam.</h1>
        <p className="mt-3 text-muted leading-relaxed">
          Create an account to donate, volunteer, or submit a case.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <FormField label="Full name">
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your full name" />
          </FormField>
          <FormField label="Email">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
          </FormField>
          <FormField label="Password">
            <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="At least 8 characters" />
          </FormField>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account? <a href="/login" className="text-primary font-medium">Sign in</a>
        </p>
      </main>
    </PageLayout>
  );
}
