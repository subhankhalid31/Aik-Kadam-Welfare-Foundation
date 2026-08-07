import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { CheckCircle2, Handshake } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import partnerHero from "@assets/hero/partner-hands.jpg";

// Same translucent/glass field treatment as volunteer-register.tsx and
// post-case.tsx, for the same reason: these inputs sit directly on a hero
// photo, not a white card. .field-on-dark also fixes browser autofill
// forcing black text back in (see index.css).
const fieldClass =
  "field-on-dark w-full rounded-xl border border-white/25 bg-white/10 backdrop-blur-md px-4 py-3 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/15 transition-all duration-200";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold tracking-wide text-white/75 uppercase mb-2">{label}</span>
      {children}
    </label>
  );
}

// Full-bleed photo behind everything, including the (transparent, white
// logo) navbar — same shell pattern as volunteer-register.tsx so the two
// application-style pages read as one consistent design language.
function HeroShell({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout transparentHero navTheme="light">
      <main className="relative min-h-screen overflow-hidden">
        <img
          src={partnerHero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 pt-36 pb-20 px-6">{children}</div>
      </main>
    </PageLayout>
  );
}

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

  if (sent) {
    return (
      <HeroShell>
        <div className="max-w-lg mx-auto text-center pt-8 pb-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/10 border border-white/25 backdrop-blur-md flex items-center justify-center">
            <CheckCircle2 className="text-white" size={28} />
          </div>
          <h1 className="mt-6 font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">Inquiry sent.</h1>
          <p className="mt-3 text-white/75 leading-relaxed">
            We'll get back to you soon to talk through what a partnership
            with Aik Kadam could look like.
          </p>
          <a href="/" className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-bold text-ink hover:bg-beige transition-colors">
            Back to Home
          </a>
        </div>
      </HeroShell>
    );
  }

  return (
    <HeroShell>
      {/* Headline, centered across the full width */}
      <div className="max-w-3xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/25 backdrop-blur-md px-4 py-1.5 text-xs font-semibold tracking-wide text-white/85 uppercase">
          <Handshake size={13} /> Partner Inquiry
        </span>
        <h1 className="mt-5 font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.2rem] text-white leading-[1.08]">
          Partner With Us,
          <br className="hidden sm:block" /> Multiply The Impact
        </h1>
        <p className="mt-4 text-white/75 max-w-lg mx-auto leading-relaxed">
          Businesses, NGOs, and institutions can partner with Aik Kadam on
          campaigns, sponsorships, or ongoing collaboration. Tell us a bit
          about what you have in mind.
        </p>
      </div>

      {/* Form, left-aligned on larger screens, centered on mobile — same
          positioning pattern as volunteer-register.tsx and post-case.tsx */}
      <div className="mt-12 max-w-md mx-auto lg:mx-0 lg:ml-[8%]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Organization name">
            <input required type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} className={fieldClass} placeholder="Your company or organization" />
          </Field>

          <Field label="Your name">
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} placeholder="Your full name" />
          </Field>

          <Field label="Email">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} placeholder="you@example.com" />
          </Field>

          <Field label="Tell us about the partnership">
            <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={fieldClass} placeholder="What did you have in mind?" />
          </Field>

          {error && <p className="text-sm text-orange-200">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white px-7 py-3.5 font-bold tracking-wide text-ink hover:bg-beige transition-colors disabled:opacity-60"
          >
            {loading ? "SUBMITTING..." : "SUBMIT INQUIRY"}
          </button>
        </form>
      </div>
    </HeroShell>
  );
}
