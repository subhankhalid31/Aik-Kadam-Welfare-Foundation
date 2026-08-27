import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────
// Adapted from the stagger-card testimonial carousel: same octagon-clipped
// cards, same "click a side card to bring it to center" interaction, same
// stacked/rotated fan-out layout. What changed is what's *inside* each
// card — a testimonial had a small round avatar + a quote; a blog card
// needs a full cover photo with the title underneath it and a "Read more"
// that actually navigates, so those parts were rebuilt from scratch.
//
// Also re-themed off this project's real Tailwind tokens (ink / primary /
// background / border / muted) instead of the shadcn-style tokens the
// original component used (bg-primary-foreground, text-card-foreground,
// ring-ring, etc.) — none of those exist in this app's tailwind.config.js,
// so left as-is they'd have silently rendered with no color at all.
// ─────────────────────────────────────────────────────────────────────────

const SQRT_5000 = Math.sqrt(5000);

export type BlogCarouselItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
};

interface BlogCardProps {
  position: number;
  blog: BlogCarouselItem & { tempId: number };
  handleMove: (steps: number) => void;
  onReadMore: (slug: string) => void;
  cardSize: number;
}

const BlogCard: React.FC<BlogCardProps> = ({ position, blog, handleMove, onReadMore, cardSize }) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-6 transition-all duration-500 ease-in-out overflow-hidden",
        isCenter
          ? "z-10 bg-primary text-background border-primary"
          : "z-0 bg-card text-ink border-border hover:border-primary/50",
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px rgba(21,21,21,0.12)" : "0px 0px 0px 0px transparent",
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-border"
        style={{ right: -2, top: 48, width: SQRT_5000, height: 2 }}
      />

      {/* Cover photo — bleeds to the card's own edges (cancels the parent's
          p-6 with an equal negative margin) so it reads as a proper blog
          cover, not a small inset thumbnail. The octagon clip-path on the
          parent still clips this to match, corners included. */}
      <div className="-m-6 mb-2.5 h-24 sm:h-28 w-[calc(100%+3rem)] overflow-hidden bg-background/40">
        <img src={blog.coverImage} alt="" className="h-full w-full object-cover" draggable={false} />
      </div>

      <h3 className={cn("text-sm sm:text-base font-display font-semibold leading-snug line-clamp-2", isCenter ? "text-background" : "text-ink")}>
        {blog.title}
      </h3>
      <p className={cn("mt-1 text-xs leading-relaxed line-clamp-2", isCenter ? "text-background/80" : "text-muted")}>
        {blog.excerpt}
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onReadMore(blog.slug);
        }}
        className={cn(
          "absolute bottom-6 left-6 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 decoration-1",
          isCenter ? "text-background" : "text-primary",
        )}
      >
        Read more <ArrowUpRight size={14} />
      </button>
    </div>
  );
};

export const BlogStaggerCarousel: React.FC = () => {
  const [, navigate] = useLocation();
  const [cardSize, setCardSize] = useState(300);
  const [blogList, setBlogList] = useState<(BlogCarouselItem & { tempId: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ blogs: BlogCarouselItem[] }>("/api/blogs?limit=12").then((data) => {
      setBlogList(data.blogs.map((b, i) => ({ ...b, tempId: i })));
      setLoading(false);
    });
  }, []);

  const handleMove = (steps: number) => {
    setBlogList((prev) => {
      const next = [...prev];
      if (steps > 0) {
        for (let i = steps; i > 0; i--) {
          const item = next.shift();
          if (!item) return prev;
          next.push({ ...item, tempId: Math.random() });
        }
      } else {
        for (let i = steps; i < 0; i++) {
          const item = next.pop();
          if (!item) return prev;
          next.unshift({ ...item, tempId: Math.random() });
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      // Smaller than the original testimonial cards (365/290) — a photo
      // card this size read as oversized for a "browse the blog" teaser
      // sitting mid-page rather than a full hero.
      setCardSize(matches ? 280 : 230);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center text-sm text-muted">Loading posts...</div>;
  }

  if (blogList.length === 0) return null;

  return (
    // Height needs to comfortably clear the center card's full vertical
    // travel: it's shifted up 65px on top of its own half-height, so for
    // the 300px desktop card that's 65 + 150 = 215px above container
    // center — 440px total gives a safe margin either side without
    // clipping the top of the center card or crowding the nav buttons
    // against the fanned side cards below.
    <div className="relative w-full overflow-hidden" style={{ height: 440 }}>
      {blogList.map((blog, index) => {
        const position = blogList.length % 2 ? index - (blogList.length + 1) / 2 : index - blogList.length / 2;
        return (
          <BlogCard
            key={blog.tempId}
            blog={blog}
            handleMove={handleMove}
            onReadMore={(slug) => navigate(`/blog/${slug}`)}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      {/* Same round liquid-glass nav buttons used by the home page's other
          carousels (see WheelCarousel) — was previously a bespoke square
          bordered button that didn't match the rest of the site. */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-3">
        <div className="glass-pill-wrap">
          <button onClick={() => handleMove(-1)} aria-label="Previous post" className="glass-pill relative isolate rounded-full block h-10 w-10">
            <span className="glass-pill-text flex items-center justify-center h-10 w-10">
              <ChevronLeft size={17} />
            </span>
          </button>
          <div className="glass-pill-shadow rounded-full" />
        </div>
        <div className="glass-pill-wrap">
          <button onClick={() => handleMove(1)} aria-label="Next post" className="glass-pill relative isolate rounded-full block h-10 w-10">
            <span className="glass-pill-text flex items-center justify-center h-10 w-10">
              <ChevronRight size={17} />
            </span>
          </button>
          <div className="glass-pill-shadow rounded-full" />
        </div>
      </div>
    </div>
  );
};
