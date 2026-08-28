import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, CalendarDays } from "lucide-react";
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

  const isSearching = query.trim().length > 0;
  const filtered = isSearching
    ? blogs.filter((b) => b.title.toLowerCase().includes(query.trim().toLowerCase()) || b.excerpt.toLowerCase().includes(query.trim().toLowerCase()))
    : blogs;

  // The newest post gets pulled out as a large "featured" card up top —
  // while searching, everything (including the newest post) just goes
  // back into the plain grid below, so search results aren't split
  // across two different layouts.
  const featured = !isSearching && filtered.length > 0 ? filtered[0] : null;
  const rest = featured ? filtered.slice(1) : filtered;

  return (
    <PageLayout transparentHero>
      <BlogHero />

      <main className="max-w-6xl mx-auto px-6 pb-24 -mt-4">
        <div className="max-w-md mx-auto relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {loading ? (
          <p className="mt-16 text-center text-sm text-muted">Loading posts...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted">
            {blogs.length === 0 ? "No blog posts yet — check back soon." : "No posts match your search."}
          </p>
        ) : (
          <>
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mt-10"
              >
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group grid overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-all hover:shadow-lg sm:grid-cols-2"
                >
                  <div className="h-56 sm:h-full overflow-hidden">
                    <img src={featured.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col justify-center p-7 sm:p-9">
                    <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      Latest post
                    </span>
                    <h2 className="mt-3 font-display text-2xl sm:text-3xl leading-tight text-ink">{featured.title}</h2>
                    <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3">{featured.excerpt}</p>
                    <div className="mt-5 flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                        <CalendarDays size={13} /> {formatDate(featured.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Read more <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {rest.length > 0 && (
              <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${featured ? "mt-8" : "mt-10"}`}>
                {rest.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.05, ease: "easeOut" }}
                  >
                    <Link
                      href={`/blog/${b.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="h-44 w-full overflow-hidden">
                        <img src={b.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
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
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </PageLayout>
  );
}
