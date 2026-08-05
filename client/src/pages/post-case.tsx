import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { CityPicker } from "@/components/ui/CityPicker";
import { CheckCircle2, LogIn, Paperclip, ChevronDown, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDialog } from "@/lib/dialog-context";
import postCaseHero from "@assets/hero/postcase-hands.png";

const CASE_CATEGORIES = ["Medical", "Food Drive", "Education", "Shelter", "Emergency Relief", "Other"];

// This page's inputs sit directly on the hero photo rather than in a white
// card, so they get their own translucent/glass field style instead of the
// shared `inputClass` used everywhere else on the site.
const fieldClass =
  "w-full rounded-xl border border-white/25 bg-white/10 backdrop-blur-md px-4 py-3 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/15 transition-all duration-200";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold tracking-wide text-white/75 uppercase mb-2">{label}</span>
      {children}
    </label>
  );
}

// Full-bleed photo behind everything, including the (transparent) navbar —
// shared by all three states of this page (form, sign-in gate, submitted)
// so the page reads as one consistent design rather than a styled form
// bolted onto plain utility screens.
function HeroShell({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout transparentHero>
      <main className="relative min-h-screen overflow-hidden">
        <img
          src={postCaseHero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/45 to-ink/80" />
        <div className="relative z-10 pt-36 pb-20 px-6">{children}</div>
      </main>
    </PageLayout>
  );
}

export default function PostCasePage() {
  const { user, loading: authLoading } = useAuth();
  const dialog = useDialog();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [category, setCategory] = useState(CASE_CATEGORIES[0]);
  const [amountNeeded, setAmountNeeded] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [limit, setLimit] = useState<{ used: number; limit: number | null; resetsInHours: number; unlimited?: boolean } | null>(null);

  useEffect(() => {
    if (user) {
      api.get<{ used: number; limit: number | null; resetsInHours: number; unlimited?: boolean }>("/api/cases/my-daily-limit").then(setLimit);
    }
  }, [user]);

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setImages(files);
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (limit && !limit.unlimited && limit.limit !== null && limit.used >= limit.limit) {
      await dialog.alert(
        `You can submit up to ${limit.limit} cases per day (${limit.used}/${limit.limit} used). This resets in about ${limit.resetsInHours} hour(s).`,
        "Daily limit reached",
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("city", city);
      formData.append("province", province);
      formData.append("contactPhone", contactPhone);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("amountNeeded", amountNeeded);
      images.forEach((img) => formData.append("images", img));

      await api.postForm("/api/cases", formData);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        await dialog.alert(err.message, "Daily limit reached");
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      }
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
            You need an account to submit a case, this keeps every request traceable
            back to a real person before our admin team verifies it.
          </p>
          <a href="/login" className="mt-8 inline-flex items-center justify-center w-full rounded-full bg-white px-7 py-3.5 font-bold text-ink hover:bg-beige transition-colors">
            Sign In to Continue
          </a>
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
          <h1 className="mt-6 font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">Case submitted.</h1>
          <p className="mt-3 text-white/75 leading-relaxed">
            Our admin team will review and verify the details. Once approved, it becomes an
            active case others can support.
          </p>
          <a href="/ongoing-projects" className="mt-8 inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
            Back to Ongoing Cases
          </a>
        </div>
      </HeroShell>
    );
  }

  return (
    <HeroShell>
      {/* Headline, centered across the full width like the reference */}
      <div className="max-w-3xl mx-auto text-center">
        <span className="inline-flex items-center rounded-full bg-white/10 border border-white/25 backdrop-blur-md px-4 py-1.5 text-xs font-semibold tracking-wide text-white/85 uppercase">
          Submit a Case
        </span>
        <h1 className="mt-5 font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.2rem] text-white leading-[1.08]">
          We're Here To Support You
          <br className="hidden sm:block" /> Every Step Of The Way
        </h1>
      </div>

      {/* Form, left-aligned on larger screens (a little left of center, like
          the reference), centered on mobile */}
      <div className="mt-12 max-w-md mx-auto lg:mx-0 lg:ml-[8%]">
        {limit && (
          <div className={`mb-5 rounded-xl border p-3 text-sm backdrop-blur-md ${!limit.unlimited && limit.limit !== null && limit.used >= limit.limit ? "border-brand-orange/50 bg-brand-orange/15 text-white" : "border-white/20 bg-white/10 text-white/80"}`}>
            {limit.unlimited
              ? "Unlimited case submissions (admin account)"
              : <>
                  {limit.used}/{limit.limit} cases submitted today
                  {limit.limit !== null && limit.used >= limit.limit && `, resets in about ${limit.resetsInHours} hour(s)`}
                </>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Case title">
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} placeholder="e.g. Medical support for a family in Multan" />
          </Field>

          <Field label="City & Province">
            <CityPicker
              city={city}
              province={province}
              onChange={(c, p) => { setCity(c); setProvince(p); }}
              inputClassName={fieldClass}
              iconClassName="text-white/60"
            />
          </Field>

          <Field label="Your phone number">
            <input required type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={fieldClass} placeholder="e.g. 0301-2345678" />
          </Field>

          <Field label="Your email (from your account)">
            <input disabled value={user?.email ?? ""} className={`${fieldClass} text-white/60 cursor-not-allowed`} />
          </Field>

          <Field label="Category">
            <div className="relative">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${fieldClass} appearance-none pr-9`}>
                {CASE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="text-ink">{c}</option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60" />
            </div>
          </Field>

          <Field label="Amount needed (Rs.)">
            <input required type="number" min="0" value={amountNeeded} onChange={(e) => setAmountNeeded(e.target.value)} onWheel={(e) => e.currentTarget.blur()} className={fieldClass} placeholder="0" />
          </Field>

          <Field label="Details">
            <textarea required rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} placeholder="Describe the situation and what the funds are needed for" />
          </Field>

          {/* Attach documents — small circular icon button + label, matching
              the reference's "ATTACH DOCUMENTS" control */}
          <div>
            <label className="inline-flex items-center gap-3 cursor-pointer group">
              <span className="text-xs font-semibold tracking-wide text-white/75 uppercase">Attach Documents</span>
              <span className="h-9 w-9 shrink-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center text-white transition-colors group-hover:bg-white/20">
                <Paperclip size={15} />
              </span>
              <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
            </label>
            <span className="block text-xs text-white/50 mt-1.5">Up to 5 photos, optional</span>

            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-white/25">
                    <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-ink/70 text-white flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-orange-200">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white px-7 py-3.5 font-bold tracking-wide text-ink hover:bg-beige transition-colors disabled:opacity-60"
          >
            {loading ? "SUBMITTING..." : "SUBMIT FOR REVIEW"}
          </button>
        </form>
      </div>
    </HeroShell>
  );
}
