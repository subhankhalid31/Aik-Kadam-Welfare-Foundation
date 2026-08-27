import { ArrowRight } from "lucide-react";
import { BlogStaggerCarousel } from "@/components/blog/BlogStaggerCarousel";

// Renders nothing when there are no published posts yet (the carousel
// itself resolves that after fetching — see BlogStaggerCarousel), so an
// empty blog never leaves a half-built section sitting on the home page.
export function BlogsTeaser() {
  return (
    <section className="relative py-20 bg-cream overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center">
          <span className="text-xs font-semibold tracking-wide text-brand-green uppercase">From the Blog</span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">Stories, updates, and what we're learning.</h2>
          <p className="mt-1 text-sm text-muted">Click a card to bring it forward, or hit Read More to open it.</p>
        </div>

        <div className="mt-4">
          <BlogStaggerCarousel />
        </div>

        <div className="mt-2 text-center">
          <a
            href="/blog"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink hover:bg-white hover:gap-2.5 transition-all"
          >
            View All Blog Posts <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
