import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { api, ApiError } from "@/lib/api";
import { Mail, Phone, MapPin, CheckCircle2, Globe, Instagram, Facebook } from "lucide-react";

export default function ContactPage() {
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
      await api.post("/api/contact", { name, email, message });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid md:grid-cols-2 gap-14">
        <div>
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            Contact
          </span>
          <h1 className="mt-3 font-display text-4xl text-ink">Get in touch.</h1>
          <p className="mt-4 text-muted leading-relaxed max-w-sm">
            Questions about a donation, a case, or volunteering? Reach out directly.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-ink/85">
            <li className="flex items-center gap-3"><Mail size={16} className="text-primary" /> help@aikkadam.org</li>
            <li className="flex items-center gap-3"><Phone size={16} className="text-primary" /> +92 313 6758644</li>
            <li className="flex items-center gap-3"><MapPin size={16} className="text-primary" /> Lahore, Pakistan</li>
            <li className="flex items-center gap-3"><Globe size={16} className="text-primary" /> aikkadamwelfare.org</li>
            <li className="flex items-center gap-3"><Instagram size={16} className="text-primary" /> @aikkadam</li>
            <li className="flex items-center gap-3"><Facebook size={16} className="text-primary" /> @aikadam</li>
          </ul>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center h-fit">
            <CheckCircle2 className="mx-auto text-primary" size={40} />
            <h2 className="mt-4 font-display text-xl text-ink">Message sent.</h2>
            <p className="mt-2 text-sm text-muted">We'll get back to you as soon as we can.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Name">
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your name" />
            </FormField>
            <FormField label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </FormField>
            <FormField label="Message">
              <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={inputClass} placeholder="How can we help?" />
            </FormField>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </main>
    </PageLayout>
  );
}
