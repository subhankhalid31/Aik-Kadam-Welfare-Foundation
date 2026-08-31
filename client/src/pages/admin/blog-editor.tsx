import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { AdminLayout, type AdminTabKey } from "@/components/layout/AdminLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { BlogBlockEditor } from "@/components/admin/BlogBlockEditor";
import { useAuth } from "@/lib/auth-context";
import { useDialog } from "@/lib/dialog-context";
import { api, ApiError } from "@/lib/api";
import { compressImage } from "@/lib/compress-image";
import { ShieldAlert, Star } from "lucide-react";
import { parseBlogBlocks, serializeBlogBlocks, emptyParagraphBlock, type BlogBlock } from "@shared/blog-blocks";
import { BLOG_FEATURED_DAYS } from "@shared/schema";

function goToAdminTab(navigate: (path: string) => void, tab: AdminTabKey) {
  sessionStorage.setItem("adminTab", tab);
  navigate("/admin");
}

type ApiBlog = {
  id: string;
  title: string;
  excerpt: string;
  coverImage: string;
  content: string;
  status: "draft" | "published";
  featuredUntil: string | null;
};

export default function AdminBlogEditorPage() {
  const { user, loading: authLoading } = useAuth();
  const dialog = useDialog();
  const [, navigate] = useLocation();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [blocks, setBlocks] = useState<BlogBlock[]>([emptyParagraphBlock()]);
  const [cover, setCover] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEditing);

  // `featured` reflects whether the post is *currently* in the Featured
  // Stories window (starts checked if editing a still-featured post,
  // unchecked otherwise). `featuredTouched` tracks whether the admin has
  // actually interacted with the checkbox this session — that's what
  // distinguishes "explicitly decided not to feature it" (touched, still
  // unchecked → save as normal, no prompt) from "never even looked at
  // it" (untouched, unchecked → this is the "forgot to decide" case, so
  // we ask via a popup at save time instead of silently defaulting to
  // "not featured").
  const [featured, setFeatured] = useState(false);
  const [featuredTouched, setFeaturedTouched] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<{ blog: ApiBlog }>(`/api/admin/blogs/${id}`).then((data) => {
      setTitle(data.blog.title);
      setExcerpt(data.blog.excerpt);
      setStatus(data.blog.status);
      setBlocks(parseBlogBlocks(data.blog.content));
      setExistingCoverUrl(data.blog.coverImage);
      setFeatured(Boolean(data.blog.featuredUntil && new Date(data.blog.featuredUntil) > new Date()));
      setLoadingPost(false);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const nonEmptyBlocks = blocks.filter((b) => (b.type === "image" ? true : b.text.trim().length > 0));
    if (nonEmptyBlocks.length === 0) {
      setError("Add at least one paragraph or image to the post");
      return;
    }
    if (!isEditing && !cover) {
      setError("A cover image is required");
      return;
    }

    // The actual "forgot to decide" popup: only fires when the box is
    // unchecked AND the admin never touched it — an explicit uncheck of a
    // previously-featured post skips straight to saving as normal, no
    // extra prompt needed since that was already a real decision.
    let finalFeatured = featured;
    if (!featured && !featuredTouched) {
      finalFeatured = await dialog.confirm(
        `Feature this post in "Featured Stories" on the Blog page for the next ${BLOG_FEATURED_DAYS} days?`,
        "Feature this post?",
      );
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("excerpt", excerpt);
      formData.append("status", status);
      formData.append("content", serializeBlogBlocks(nonEmptyBlocks));
      formData.append("featured", String(finalFeatured));
      if (cover) formData.append("coverImage", cover);

      if (isEditing) {
        await api.patchForm(`/api/admin/blogs/${id}`, formData);
      } else {
        await api.postForm("/api/admin/blogs", formData);
      }
      goToAdminTab(navigate, "blogs");
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
    <AdminLayout activeTab="blogs" onTabChange={(tab) => goToAdminTab(navigate, tab)}>
      <div className="max-w-2xl">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Admin</span>
        <h1 className="mt-3 font-display text-3xl text-ink">{isEditing ? "Edit Blog Post" : "New Blog Post"}</h1>

        {loadingPost ? (
          <p className="mt-8 text-sm text-muted">Loading post...</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <FormField label="Title">
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Why Winter Aid Matters More Than Ever" />
            </FormField>

            <FormField label="Excerpt (shown on cards and search results)">
              <textarea required rows={2} maxLength={300} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={inputClass} placeholder="A one or two sentence summary readers see before opening the post" />
            </FormField>

            <FormField label={isEditing ? "Cover image (leave blank to keep the current one)" : "Cover image"}>
              <input required={!isEditing} type="file" accept="image/*" onChange={async (e) => setCover(e.target.files?.[0] ? await compressImage(e.target.files[0]) : null)} className={`${inputClass} py-2`} />
              {(cover || existingCoverUrl) && (
                <img src={cover ? URL.createObjectURL(cover) : existingCoverUrl!} alt="Cover" className="mt-2 h-40 w-full rounded-lg border border-border object-cover" />
              )}
            </FormField>

            <FormField label="Status">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("published")}
                  className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    status === "published" ? "bg-primary text-background border-primary" : "bg-white text-ink border-border hover:bg-background"
                  }`}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("draft")}
                  className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    status === "draft" ? "bg-primary text-background border-primary" : "bg-white text-ink border-border hover:bg-background"
                  }`}
                >
                  Draft (not shown publicly)
                </button>
              </div>
            </FormField>

            <FormField label="Featured Stories">
              <label className="flex items-start gap-3 rounded-xl border border-border bg-white px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => {
                    setFeatured(e.target.checked);
                    setFeaturedTouched(true);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-ink">
                  <span className="inline-flex items-center gap-1.5"><Star size={14} className="text-primary" /> Feature this post</span>
                  <span className="block mt-1 text-xs text-muted leading-relaxed">
                    Shown in the "Featured Stories" row at the top of the Blog page for {BLOG_FEATURED_DAYS} days
                    from when you save. If you leave this unchecked, you'll be asked to confirm when you save.
                  </span>
                </span>
              </label>
            </FormField>

            <FormField label="Post body">
              <BlogBlockEditor blocks={blocks} onChange={setBlocks} />
            </FormField>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="glass-surface w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60">
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Publish Post"}
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
