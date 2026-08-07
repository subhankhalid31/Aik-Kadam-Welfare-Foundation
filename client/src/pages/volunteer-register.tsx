import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { CheckCircle2, LogIn, ChevronDown } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import volunteerHero from "@assets/hero/volunteer-register-hands.jpg";

const VOLUNTEER_CATEGORIES = ["Medical Assistant", "Food Drive", "Education", "Logistics", "Fundraising", "Field Coordinator", "Other"];

// Same translucent/glass field treatment as post-case.tsx, for the same
// reason: these inputs sit directly on a hero photo, not a white card.
// .field-on-dark also fixes browser autofill forcing black text back in
// (see index.css).
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

// Full-bleed photo behind everything, including the (transparent) navbar —
// shared by every state of this page so it reads as one consistent design.
function HeroShell({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout transparentHero navTheme="light">
      <main className="relative min-h-screen overflow-hidden">
        <img
          src={volunteerHero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 pt-36 pb-20 px-6">{children}</div>
      </main>
    </PageLayout>
  );
}

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
      <HeroShell>
        <div className="max-w-md mx-auto text-center pt-8 pb-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/10 border border-white/25 backdrop-blur-md flex items-center justify-center">
            <LogIn className="text-white" size={26} />
          </div>
          <h1 className="mt-6 font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">Sign in required</h1>
          <p className="mt-3 text-white/75 leading-relaxed">
            You need an account before applying to volunteer, this ties your badge and hours
            to a real, verifiable identity.
          </p>
          <a href="/login" className="mt-8 inline-flex items-center justify-center w-full rounded-full bg-white px-7 py-3.5 font-bold text-ink hover:bg-beige transition-colors">
            Sign In to Continue
          </a>
        </div>
      </HeroShell>
    );
  }

  if (user.volunteerStatus === "approved") {
    return (
      <HeroShell>
        <div className="max-w-lg mx-auto text-center pt-8 pb-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/10 border border-white/25 backdrop-blur-md flex items-center justify-center">
            <CheckCircle2 className="text-white" size={28} />
          </div>
          <h1 className="mt-6 font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">You're already a volunteer!</h1>
          <p className="mt-3 text-white/75 leading-relaxed">
            Your badge ID is <span className="font-mono text-white">{user.badgeId}</span>. Visit your
            account page to see your hours, cases, and download your certificate.
          </p>
          <a href="/account" className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-bold text-ink hover:bg-beige transition-colors">
            Go to My Account
          </a>
        </div>
      </HeroShell>
    );
  }

  if (user.volunteerStatus === "pending") {
    return (
      <HeroShell>
        <div className="max-w-lg mx-auto text-center pt-8 pb-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/10 border border-white/25 backdrop-blur-md flex items-center justify-center">
            <CheckCircle2 className="text-white" size={28} />
          </div>
          <h1 className="mt-6 font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">Application pending.</h1>
          <p className="mt-3 text-white/75 leading-relaxed">
            You've already applied, an admin is reviewing it. You'll get a badge ID once approved.
          </p>
        </div>
      </HeroShell>
    );
  }

  if (submitted) {
    return (
      <HeroShell>
        <div className="max-w-lg mx-auto text-center pt-8 pb-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/10 border border-white/25 backdrop-blur-md flex items-center justify-center">
            <CheckCircle2 className="text-white" size={28} />
          </div>
          <h1 className="mt-6 font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">Application sent.</h1>
          <p className="mt-3 text-white/75 leading-relaxed">
            An admin will review your application. You'll be notified once you're approved
            and your volunteer badge is issued.
          </p>
          <a href="/volunteers" className="mt-8 inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
            Back to Volunteers
          </a>
        </div>
      </HeroShell>
    );
  }

  return (
    <HeroShell>
      {/* Headline, centered across the full width */}
      <div className="max-w-3xl mx-auto text-center">
        <span className="inline-flex items-center rounded-full bg-white/10 border border-white/25 backdrop-blur-md px-4 py-1.5 text-xs font-semibold tracking-wide text-white/85 uppercase">
          Volunteer Application
        </span>
        <h1 className="mt-5 font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.2rem] text-white leading-[1.08]">
          Register As A Volunteer,
          <br className="hidden sm:block" /> Show Up For Someone
        </h1>
        <p className="mt-4 text-white/75 max-w-lg mx-auto leading-relaxed">
          Your application goes directly to our admin team for review. Once approved,
          you'll receive a verifiable badge ID.
        </p>
      </div>

      {/* Form, left-aligned on larger screens, centered on mobile — same
          positioning pattern as post-case.tsx */}
      <div className="mt-12 max-w-md mx-auto lg:mx-0 lg:ml-[8%]">
        {user.volunteerStatus === "rejected" && (
          <div className="mb-5 rounded-xl border border-brand-orange/40 bg-brand-orange/15 p-4 backdrop-blur-md">
            <p className="text-sm text-white/85">
              Your previous application wasn't approved
              {user.volunteerRejectionReason ? `: ${user.volunteerRejectionReason}` : "."} You're welcome to apply again.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Your email (used by admin to contact you, and shown on your public profile if approved)">
            <input type="email" value={user.email} disabled className={`${fieldClass} text-white/60 cursor-not-allowed`} />
          </Field>

          <Field label="Phone number">
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} placeholder="+92 3XX XXXXXXX" />
          </Field>

          <Field label="City">
            <input required type="text" value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass} placeholder="Your city" />
          </Field>

          <Field label="Category">
            <div className="relative">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${fieldClass} appearance-none pr-9`}>
                {VOLUNTEER_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="text-ink">{c}</option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60" />
            </div>
          </Field>

          <Field label="Your motto (one line, shown publicly on your card)">
            <input
              required
              type="text"
              maxLength={120}
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Passionate about food security in rural Sindh."
            />
          </Field>

          <Field label="Why do you want to volunteer with us? (for our review only, not shown publicly)">
            <textarea required rows={4} value={motivation} onChange={(e) => setMotivation(e.target.value)} className={fieldClass} placeholder="Tell us a bit about yourself and your motivation" />
          </Field>

          {error && <p className="text-sm text-orange-200">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white px-7 py-3.5 font-bold tracking-wide text-ink hover:bg-beige transition-colors disabled:opacity-60"
          >
            {loading ? "SUBMITTING..." : "SUBMIT APPLICATION"}
          </button>
        </form>
      </div>
    </HeroShell>
  );
}
