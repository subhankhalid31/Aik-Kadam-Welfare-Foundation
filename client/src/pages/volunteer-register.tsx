import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { CheckCircle2, LogIn } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const VOLUNTEER_CATEGORIES = ["Medical Assistant", "Food Drive", "Education", "Logistics", "Fundraising", "Field Coordinator", "Other"];

export default function VolunteerRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState(VOLUNTEER_CATEGORIES[0]);
  const [motto, setMotto] = useState("");
  const [motivation, setMotivation] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/volunteers/apply", { city, phone, motto, motivation, category });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <PageLayout>
        <main className="max-w-md mx-auto px-6 pt-24 pb-24 text-center">
          <LogIn className="mx-auto text-primary" size={40} />
          <h1 className="mt-5 font-display text-3xl text-ink">Sign in required</h1>
          <p className="mt-3 text-muted leading-relaxed">
            You need an account before applying to volunteer, this ties your badge and hours
            to a real, verifiable identity.
          </p>
          <a href="/login" className="mt-8 inline-flex items-center justify-center w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors">
            Sign In to Continue
          </a>
        </main>
      </PageLayout>
    );
  }

  if (user.volunteerStatus === "approved") {
    return (
      <PageLayout>
        <main className="max-w-lg mx-auto px-6 pt-24 pb-24 text-center">
          <CheckCircle2 className="mx-auto text-primary" size={48} />
          <h1 className="mt-5 font-display text-3xl text-ink">You're already a volunteer!</h1>
          <p className="mt-3 text-muted leading-relaxed">
            Your badge ID is <span className="font-mono text-ink">{user.badgeId}</span>. Visit your
            account page to see your hours, cases, and download your certificate.
          </p>
          <a href="/account" className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-background hover:bg-primary-dark transition-colors">
            Go to My Account
          </a>
        </main>
      </PageLayout>
    );
  }

  if (user.volunteerStatus === "pending") {
    return (
      <PageLayout>
        <main className="max-w-lg mx-auto px-6 pt-24 pb-24 text-center">
          <CheckCircle2 className="mx-auto text-primary" size={48} />
          <h1 className="mt-5 font-display text-3xl text-ink">Application pending.</h1>
          <p className="mt-3 text-muted leading-relaxed">
            You've already applied, an admin is reviewing it. You'll get a badge ID once approved.
          </p>
        </main>
      </PageLayout>
    );
  }

  if (submitted) {
    return (
      <PageLayout>
        <main className="max-w-lg mx-auto px-6 pt-24 pb-24 text-center">
          <CheckCircle2 className="mx-auto text-primary" size={48} />
          <h1 className="mt-5 font-display text-3xl text-ink">Application sent.</h1>
          <p className="mt-3 text-muted leading-relaxed">
            An admin will review your application. You'll be notified once you're approved
            and your volunteer badge is issued.
          </p>
          <a href="/volunteers" className="mt-8 inline-flex items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink hover:bg-white transition-colors">
            Back to Volunteers
          </a>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="max-w-lg mx-auto px-6 pt-16 pb-24">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Volunteer Application</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink">Register as a volunteer.</h1>
        <p className="mt-3 text-muted leading-relaxed">
          Your application goes directly to our admin team for review. Once approved, you'll
          receive a verifiable badge ID.
        </p>

        {user.volunteerStatus === "rejected" && (
          <div className="mt-5 rounded-xl border border-accent/30 bg-accent/10 p-4">
            <p className="text-sm text-ink/80">
              Your previous application wasn't approved
              {user.volunteerRejectionReason ? `: ${user.volunteerRejectionReason}` : "."} You're welcome to apply again.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <FormField label="Your email (used by admin to contact you, and shown on your public profile if approved)">
            <input type="email" value={user.email} disabled className={`${inputClass} bg-background text-muted cursor-not-allowed`} />
          </FormField>
          <FormField label="Phone number">
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+92 3XX XXXXXXX" />
          </FormField>
          <FormField label="City">
            <input required type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Your city" />
          </FormField>
          <FormField label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {VOLUNTEER_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Your motto (one line, shown publicly on your card)">
            <input
              required
              type="text"
              maxLength={120}
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              className={inputClass}
              placeholder="e.g. Passionate about food security in rural Sindh."
            />
          </FormField>
          <FormField label="Why do you want to volunteer with us? (for our review only, not shown publicly)">
            <textarea required rows={4} value={motivation} onChange={(e) => setMotivation(e.target.value)} className={inputClass} placeholder="Tell us a bit about yourself and your motivation" />
          </FormField>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </main>
    </PageLayout>
  );
}
