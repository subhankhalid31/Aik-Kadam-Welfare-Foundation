import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { api, ApiError } from "@/lib/api";
import { CheckCircle2, Handshake } from "lucide-react";

export default function PartnerPage() {
  const [organization, setOrganization] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/partner", { organization, name, email, message });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <main className="max-w-lg mx-auto px-6 pt-16 pb-24">
        <Handshake className="text-primary" size={36} />
        <h1 className="mt-4 font-display text-3xl sm:text-4xl text-ink">Partner With Us.</h1>
        <p className="mt-3 text-muted leading-relaxed">
          Businesses, NGOs, and institutions can partner with Aik Kadam on campaigns, sponsorships,
          or ongoing collaboration. Tell us a bit about what you have in mind.
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-border bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto text-primary" size={40} />
            <h2 className="mt-4 font-display text-xl text-ink">Inquiry sent.</h2>
            <p className="mt-2 text-sm text-muted">We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <FormField label="Organization name">
              <input required type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} className={inputClass} placeholder="Your company or organization" />
            </FormField>
            <FormField label="Your name">
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your full name" />
            </FormField>
            <FormField label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </FormField>
            <FormField label="Tell us about the partnership">
              <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={inputClass} placeholder="What did you have in mind?" />
            </FormField>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="glass-surface w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
              {loading ? "Sending..." : "Send Inquiry"}
            </button>
          </form>
        )}
      </main>
    </PageLayout>
  );
}
