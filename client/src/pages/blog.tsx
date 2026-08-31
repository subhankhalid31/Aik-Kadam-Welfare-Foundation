import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Star } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { BlogHero } from "@/components/sections/BlogHero";
import { api } from "@/lib/api";

type ApiBlog = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  createdAt: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function BlogCard({ b, i, badge }: { b: ApiBlog; i: number; badge?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.05, ease: "easeOut" }}
    >
      <Link
        href={`/blog/${b.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="relative h-44 w-full overflow-hidden">
          <img src={b.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {badge && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-sm">
              <Star size={11} className="fill-primary text-primary" /> {badge}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays size={12} /> {formatDate(b.createdAt)}
          </span>
          <h3 className="mt-1.5 font-display text-lg font-semibold text-ink line-clamp-2">{b.title}</h3>
          <p className="mt-1.5 text-sm text-muted line-clamp-2 flex-1">{b.excerpt}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Read more <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<ApiBlog[]>([]);
  const [featured, setFeatured] = useState<ApiBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ blogs: ApiBlog[] }>("/api/blogs"),
      api.get<{ blogs: ApiBlog[] }>("/api/blogs/featured"),
    ]).then(([all, feat]) => {
      setBlogs(all.blogs);
      setFeatured(feat.blogs);
      setLoading(false);
    });
  }, []);

  const isSearching = query.trim().length > 0;
  const filtered = isSearching
    ? blogs.filter((b) => b.title.toLowerCase().includes(query.trim().toLowerCase()) || b.excerpt.toLowerCase().includes(query.trim().toLowerCase()))
    : blogs;

  // Featured Stories (admin-picked, 7-day window — see the editor's
  // "Feature this post" checkbox) only shows while not searching, and the
  // main grid below excludes whatever's already up there so nothing
  // appears twice on the page.
  const featuredIds = new Set(featured.map((b) => b.id));
  const restBlogs = isSearching ? filtered : filtered.filter((b) => !featuredIds.has(b.id));

  return (
    <PageLayout transparentHero>
      <BlogHero query={query} onQueryChange={setQuery} />

      <main id="blog-content" className="max-w-6xl mx-auto px-6 pb-24 pt-10 scroll-mt-24">
        {loading ? (
          <p className="text-center text-sm text-muted">Loading posts...</p>
        ) : (
          <>
            {!isSearching && featured.length > 0 && (
              <section className="mb-14">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-ink">Featured Stories</h2>
                    <span className="mt-1.5 block h-1 w-10 rounded-full bg-primary" />
                  </div>
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((b, i) => (
                    <BlogCard key={b.id} b={b} i={i} badge="Featured" />
                  ))}
                </div>
              </section>
            )}

            {restBlogs.length === 0 ? (
              <p className="mt-10 text-center text-sm text-muted">
                {blogs.length === 0 ? "No blog posts yet — check back soon." : "No posts match your search."}
              </p>
            ) : (
              <section>
                {!isSearching && featured.length > 0 && <h2 className="font-display text-xl font-bold text-ink mb-6">All Posts</h2>}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {restBlogs.map((b, i) => (
                    <BlogCard key={b.id} b={b} i={i} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </PageLayout>
  );
}
