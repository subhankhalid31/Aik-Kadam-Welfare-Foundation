import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { CityPicker } from "@/components/ui/CityPicker";
import { CheckCircle2, LogIn } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDialog } from "@/lib/dialog-context";

const CASE_CATEGORIES = ["Medical", "Food Drive", "Education", "Shelter", "Emergency Relief", "Other"];

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
  const [limit, setLimit] = useState<{ used: number; limit: number; resetsInHours: number } | null>(null);

  useEffect(() => {
    if (user) {
      api.get<{ used: number; limit: number; resetsInHours: number }>("/api/cases/my-daily-limit").then(setLimit);
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

    if (limit && limit.used >= limit.limit) {
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
      <PageLayout>
        <main className="max-w-md mx-auto px-6 pt-24 pb-24 text-center">
          <LogIn className="mx-auto text-primary" size={40} />
          <h1 className="mt-5 font-display text-3xl text-ink">Sign in required</h1>
          <p className="mt-3 text-muted leading-relaxed">
            You need an account to submit a case, this keeps every request traceable
            back to a real person before our admin team verifies it.
          </p>
          <a href="/login" className="mt-8 inline-flex items-center justify-center w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors">
            Sign In to Continue
          </a>
        </main>
      </PageLayout>
    );
  }

  if (submitted) {
    return (
      <PageLayout>
        <main className="max-w-lg mx-auto px-6 pt-24 pb-24 text-center">
          <CheckCircle2 className="mx-auto text-primary" size={48} />
          <h1 className="mt-5 font-display text-3xl text-ink">Case submitted.</h1>
          <p className="mt-3 text-muted leading-relaxed">
            Our admin team will review and verify the details. Once approved, it becomes an
            active case others can support.
          </p>
          <a href="/ongoing-projects" className="mt-8 inline-flex items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink hover:bg-white transition-colors">
            Back to Ongoing Cases
          </a>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="max-w-lg mx-auto px-6 pt-16 pb-24">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Submit a Case</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink">Request help for someone in need.</h1>
        <p className="mt-3 text-muted leading-relaxed">
          An admin will review and verify this before it becomes a public case.
        </p>

        {limit && (
          <div className={`mt-4 rounded-xl border p-3 text-sm ${limit.used >= limit.limit ? "border-accent/40 bg-accent/10 text-ink/80" : "border-border bg-white text-muted"}`}>
            {limit.used}/{limit.limit} cases submitted today
            {limit.used >= limit.limit && `, resets in about ${limit.resetsInHours} hour(s)`}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <FormField label="Case title">
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Medical support for a family in Multan" />
          </FormField>
          <FormField label="City & Province">
            <CityPicker city={city} province={province} onChange={(c, p) => { setCity(c); setProvince(p); }} />
          </FormField>
          <FormField label="Your phone number (so admins can reach you about this case)">
            <input required type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} placeholder="e.g. 0301-2345678" />
          </FormField>
          <FormField label="Your email (from your account)">
            <input disabled value={user?.email ?? ""} className={`${inputClass} bg-background text-muted cursor-not-allowed`} />
          </FormField>
          <FormField label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {CASE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Amount needed (Rs.)">
            <input required type="number" min="0" value={amountNeeded} onChange={(e) => setAmountNeeded(e.target.value)} className={inputClass} placeholder="0" />
          </FormField>
          <FormField label="Details">
            <textarea required rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Describe the situation and what the funds are needed for" />
          </FormField>
          <FormField label="Photos (optional, up to 5)">
            <input type="file" accept="image/*" multiple onChange={handleImagesChange} className={`${inputClass} py-2`} />
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormField>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
            {loading ? "Submitting..." : "Submit for Review"}
          </button>
        </form>
      </main>
    </PageLayout>
  );
}
