import { useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout, type AdminTabKey } from "@/components/layout/AdminLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { compressImage } from "@/lib/compress-image";
import { ShieldAlert } from "lucide-react";

function goToAdminTab(navigate: (path: string) => void, tab: AdminTabKey) {
  sessionStorage.setItem("adminTab", tab);
  navigate("/admin");
}

export default function AdminSuccessStoryNewPage() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [storyDate, setStoryDate] = useState("");
  const [quote, setQuote] = useState("");
  const [before, setBefore] = useState<File | null>(null);
  const [after, setAfter] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!before || !after) {
      setError("Both a before and after photo are required");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("title", title);
      formData.append("storyDate", storyDate);
      formData.append("quote", quote);
      formData.append("before", before);
      formData.append("after", after);

      await api.postForm("/api/admin/success-stories", formData);
      goToAdminTab(navigate, "stories");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return null;

  if (!user || user.role !== "admin") {
    return (
      <main className="max-w-md mx-auto px-6 pt-24 pb-24 text-center">
        <ShieldAlert className="mx-auto text-accent-dark" size={40} />
        <h1 className="mt-5 font-display text-2xl text-ink">Admins only.</h1>
      </main>
    );
  }

  return (
    <AdminLayout activeTab="stories" onTabChange={(tab) => goToAdminTab(navigate, tab)}>
      <div className="max-w-lg">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Admin</span>
        <h1 className="mt-3 font-display text-3xl text-ink">Add Success Story</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <FormField label="Person's name">
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Usman" />
          </FormField>
          <FormField label="Story title">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Usman's Journey" />
          </FormField>
          <FormField label="Date (free text)">
            <input required value={storyDate} onChange={(e) => setStoryDate(e.target.value)} className={inputClass} placeholder="e.g. October 2025" />
          </FormField>
          <FormField label="Quote / story text">
            <textarea required rows={4} value={quote} onChange={(e) => setQuote(e.target.value)} className={inputClass} placeholder="Tell their story in a few sentences" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Before photo">
              <input required type="file" accept="image/*" onChange={async (e) => setBefore(e.target.files?.[0] ? await compressImage(e.target.files[0]) : null)} className={`${inputClass} py-2`} />
              {before && <img src={URL.createObjectURL(before)} alt="Before" className="mt-2 aspect-square w-full object-cover rounded-lg border border-border" />}
            </FormField>
            <FormField label="After photo">
              <input required type="file" accept="image/*" onChange={async (e) => setAfter(e.target.files?.[0] ? await compressImage(e.target.files[0]) : null)} className={`${inputClass} py-2`} />
              {after && <img src={URL.createObjectURL(after)} alt="After" className="mt-2 aspect-square w-full object-cover rounded-lg border border-border" />}
            </FormField>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="glass-surface w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
            {loading ? "Publishing..." : "Publish Story"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
