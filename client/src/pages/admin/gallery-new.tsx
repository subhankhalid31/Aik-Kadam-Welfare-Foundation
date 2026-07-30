import { useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout, type AdminTabKey } from "@/components/layout/AdminLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { ShieldAlert, X } from "lucide-react";

function goToAdminTab(navigate: (path: string) => void, tab: AdminTabKey) {
  sessionStorage.setItem("adminTab", tab);
  navigate("/admin");
}

export default function AdminGalleryNewPage() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [families, setFamilies] = useState("");
  const [items, setItems] = useState("");
  const [funds, setFunds] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setImages(files);
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (images.length === 0) {
      setError("Add at least one photo");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("location", location);
      formData.append("eventDate", eventDate);
      formData.append("description", description);
      formData.append("families", families);
      formData.append("items", items);
      formData.append("funds", funds);
      images.forEach((img) => formData.append("images", img));

      await api.postForm("/api/admin/gallery", formData);
      goToAdminTab(navigate, "gallery");
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
    <AdminLayout activeTab="gallery" onTabChange={(tab) => goToAdminTab(navigate, tab)}>
      <div className="max-w-lg">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Admin</span>
        <h1 className="mt-3 font-display text-3xl text-ink">Add Gallery Event</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <FormField label="Event title">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Winter Relief Drive 2026" />
          </FormField>
          <FormField label="Location">
            <input required value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="City, province" />
          </FormField>
          <FormField label="Date (free text)">
            <input required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} placeholder="e.g. December 2025" />
          </FormField>
          <FormField label="Description">
            <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="What happened, and what it accomplished" />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Families/People">
              <input value={families} onChange={(e) => setFamilies(e.target.value)} className={inputClass} placeholder="520 Families" />
            </FormField>
            <FormField label="Items">
              <input value={items} onChange={(e) => setItems(e.target.value)} className={inputClass} placeholder="1,500+ Kits" />
            </FormField>
            <FormField label="Funds used">
              <input value={funds} onChange={(e) => setFunds(e.target.value)} className={inputClass} placeholder="PKR 450,000" />
            </FormField>
          </div>

          <FormField label="Photos (up to 5)">
            <input type="file" accept="image/*" multiple onChange={handleImages} className={`${inputClass} py-2`} />
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
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormField>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="glass-surface w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
            {loading ? "Publishing..." : "Publish to Gallery"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
