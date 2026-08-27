import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, Search } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { api } from "@/lib/api";

type ApiBlog = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  createdAt: string;
};

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<ApiBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get<{ blogs: ApiBlog[] }>("/api/blogs").then((data) => {
      setBlogs(data.blogs);
      setLoading(false);
    });
  }, []);

  const filtered = query.trim()
    ? blogs.filter((b) => b.title.toLowerCase().includes(query.trim().toLowerCase()) || b.excerpt.toLowerCase().includes(query.trim().toLowerCase()))
    : blogs;

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        <div className="text-center">
          <span className="text-xs font-semibold tracking-wide text-brand-green uppercase">Blog</span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl text-ink">Stories, updates, and what we're learning.</h1>
          <p className="mt-2 text-sm text-muted max-w-xl mx-auto">
            Notes from the field, updates on ongoing cases, and everything else we want to share beyond the numbers.
          </p>
        </div>

        <div className="mt-8 max-w-md mx-auto relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {loading ? (
          <p className="mt-16 text-center text-sm text-muted">Loading posts...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted">
            {blogs.length === 0 ? "No blog posts yet — check back soon." : "No posts match your search."}
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <Link
                key={b.id}
                href={`/blog/${b.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-44 w-full overflow-hidden">
                  <img src={b.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs text-muted">{new Date(b.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
                  <h2 className="mt-1.5 font-display text-lg font-semibold text-ink line-clamp-2">{b.title}</h2>
                  <p className="mt-1.5 text-sm text-muted line-clamp-2 flex-1">{b.excerpt}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Read more <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
