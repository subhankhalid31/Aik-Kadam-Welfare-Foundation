import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { BlogContent } from "@/components/blog/BlogContent";
import { api, ApiError } from "@/lib/api";

type ApiBlog = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  content: string;
  createdAt: string;
};

export default function BlogPostPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<ApiBlog | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    api
      .get<{ blog: ApiBlog }>(`/api/blogs/${slug}`)
      .then((data) => setBlog(data.blog))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <PageLayout>
      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors">
          <ArrowLeft size={15} /> Back to Blog
        </Link>

        {loading ? (
          <p className="mt-16 text-center text-sm text-muted">Loading post...</p>
        ) : notFound || !blog ? (
          <div className="mt-16 text-center">
            <h1 className="font-display text-2xl text-ink">Post not found</h1>
            <p className="mt-2 text-sm text-muted">This post may have been removed or the link is out of date.</p>
          </div>
        ) : (
          <article className="mt-6">
            <p className="text-xs text-muted">{new Date(blog.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl text-ink">{blog.title}</h1>
            <p className="mt-3 text-base text-muted">{blog.excerpt}</p>

            <img src={blog.coverImage} alt="" className="mt-7 w-full rounded-2xl object-cover" style={{ maxHeight: 440 }} />

            <div className="mt-9">
              <BlogContent content={blog.content} />
            </div>
          </article>
        )}
      </main>
    </PageLayout>
  );
}
